from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import random
import string
import hashlib
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="SheshA API", description="Location-based service discovery app")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Secret key (in production, this should be in env variables)
SECRET_KEY = "shesha_secret_key_change_in_production"
ALGORITHM = "HS256"

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone_number: Optional[str] = None
    email: Optional[str] = None
    is_phone_verified: bool = False
    is_email_verified: bool = False
    name: Optional[str] = None
    user_type: str = "customer"  # customer, business_owner
    preferences: List[str] = []  # ["food", "clothing", "spa"]
    location: Optional[dict] = None  # {"latitude": float, "longitude": float}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserCreate(BaseModel):
    phone_number: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    user_type: str = "customer"

class Business(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    business_name: str
    description: Optional[str] = None
    category: str  # "food", "clothing", "spa"
    phone_number: str
    email: Optional[str] = None
    address: str
    location: dict  # {"latitude": float, "longitude": float}
    services: List[str] = []
    images: List[str] = []  # base64 images
    rating: float = 0.0
    total_ratings: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BusinessCreate(BaseModel):
    business_name: str
    description: Optional[str] = None
    category: str
    phone_number: str
    email: Optional[str] = None
    address: str
    location: dict
    services: List[str] = []

class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_id: str
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    duration_minutes: Optional[int] = None
    category: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    duration_minutes: Optional[int] = None
    category: str

class OTPVerification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contact: str  # phone or email
    contact_type: str  # "phone" or "email"
    otp_code: str
    is_verified: bool = False
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SendOTPRequest(BaseModel):
    contact: str  # phone or email
    contact_type: str  # "phone" or "email"

class VerifyOTPRequest(BaseModel):
    contact: str
    contact_type: str
    otp_code: str

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

class NearbyServicesRequest(BaseModel):
    latitude: float
    longitude: float
    radius_meters: int = 1000
    categories: Optional[List[str]] = None

class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str

# Helper functions
def generate_otp() -> str:
    """Generate a 6-digit OTP code for demo purposes"""
    return ''.join(random.choices(string.digits, k=6))

def create_access_token(user_id: str) -> str:
    """Create JWT token for user authentication"""
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode = {"sub": user_id, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        return user_id
    except jwt.PyJWTError:
        return None

def clean_mongo_doc(doc: dict) -> dict:
    """Remove MongoDB ObjectId fields to make document JSON serializable"""
    if doc is None:
        return None
    # Remove _id field which contains ObjectId
    if "_id" in doc:
        del doc["_id"]
    return doc

def clean_mongo_docs(docs: list) -> list:
    """Clean a list of MongoDB documents"""
    return [clean_mongo_doc(doc) for doc in docs if doc is not None]

async def get_current_user(authorization: str = Header()) -> dict:
    """Get current user from JWT token"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in meters (Haversine formula)"""
    import math
    
    # Convert latitude and longitude to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of Earth in meters
    r = 6371000
    
    return c * r

# Authentication Routes
@api_router.post("/auth/send-otp")
async def send_otp(request: SendOTPRequest):
    """Send OTP to phone or email (Mock implementation)"""
    try:
        # Generate OTP
        otp_code = generate_otp()
        
        # Set expiration to 10 minutes from now
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        # Create OTP verification record
        otp_verification = OTPVerification(
            contact=request.contact,
            contact_type=request.contact_type,
            otp_code=otp_code,
            expires_at=expires_at
        )
        
        # Store in database
        await db.otp_verifications.insert_one(otp_verification.dict())
        
        # Mock SMS/Email sending (in production, integrate with Twilio/SMTP)
        if request.contact_type == "phone":
            print(f"📱 Mock SMS to {request.contact}: Your SheshA OTP is {otp_code}")
        else:
            print(f"📧 Mock Email to {request.contact}: Your SheshA OTP is {otp_code}")
        
        return {
            "success": True,
            "message": f"OTP sent to {request.contact}",
            "demo_otp": otp_code  # Remove this in production!
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/auth/verify-otp", response_model=AuthToken)
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP and create/login user"""
    try:
        # Find valid OTP
        otp_record = await db.otp_verifications.find_one({
            "contact": request.contact,
            "contact_type": request.contact_type,
            "otp_code": request.otp_code,
            "is_verified": False,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not otp_record:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
        # Mark OTP as verified
        await db.otp_verifications.update_one(
            {"id": otp_record["id"]},
            {"$set": {"is_verified": True}}
        )
        
        # Find or create user
        user_query = {}
        if request.contact_type == "phone":
            user_query = {"phone_number": request.contact}
        else:
            user_query = {"email": request.contact}
        
        user = await db.users.find_one(user_query)
        
        if not user:
            # Create new user
            new_user = User()
            if request.contact_type == "phone":
                new_user.phone_number = request.contact
                new_user.is_phone_verified = True
            else:
                new_user.email = request.contact
                new_user.is_email_verified = True
            
            await db.users.insert_one(new_user.dict())
            user_id = new_user.id
        else:
            # Update verification status
            update_data = {}
            if request.contact_type == "phone":
                update_data["is_phone_verified"] = True
            else:
                update_data["is_email_verified"] = True
            
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": update_data}
            )
            user_id = user["id"]
        
        # Create access token
        access_token = create_access_token(user_id)
        
        return AuthToken(
            access_token=access_token,
            user_id=user_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# User Routes
@api_router.get("/users/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@api_router.put("/users/preferences")
async def update_user_preferences(
    preferences: List[str],
    current_user: dict = Depends(get_current_user)
):
    """Update user preferences (food, clothing, spa)"""
    valid_preferences = ["food", "clothing", "spa"]
    invalid_prefs = [p for p in preferences if p not in valid_preferences]
    
    if invalid_prefs:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid preferences: {invalid_prefs}. Valid options: {valid_preferences}"
        )
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"preferences": preferences}}
    )
    
    return {"success": True, "message": "Preferences updated successfully"}

@api_router.put("/users/location")
async def update_user_location(
    location: LocationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user's current location"""
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"location": {"latitude": location.latitude, "longitude": location.longitude}}}
    )
    
    return {"success": True, "message": "Location updated successfully"}

# Business Routes
@api_router.post("/businesses", response_model=Business)
async def create_business(
    business_data: BusinessCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new business (business owners only)"""
    business = Business(
        owner_id=current_user["id"],
        **business_data.dict()
    )
    
    await db.businesses.insert_one(business.dict())
    
    # Update user type to business_owner
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"user_type": "business_owner"}}
    )
    
    return business

@api_router.get("/businesses/my")
async def get_my_businesses(current_user: dict = Depends(get_current_user)):
    """Get businesses owned by current user"""
    businesses = await db.businesses.find({"owner_id": current_user["id"]}).to_list(100)
    return businesses

@api_router.get("/businesses/{business_id}/services")
async def get_business_services(business_id: str):
    """Get services for a specific business"""
    services = await db.services.find({"business_id": business_id, "is_active": True}).to_list(100)
    return services

@api_router.post("/businesses/{business_id}/services", response_model=Service)
async def create_service(
    business_id: str,
    service_data: ServiceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a service for a business"""
    # Verify business ownership
    business = await db.businesses.find_one({"id": business_id, "owner_id": current_user["id"]})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found or not owned by user")
    
    service = Service(
        business_id=business_id,
        **service_data.dict()
    )
    
    await db.services.insert_one(service.dict())
    return service

# Discovery Routes
@api_router.post("/discover/nearby")
async def discover_nearby_services(
    request: NearbyServicesRequest,
    current_user: dict = Depends(get_current_user)
):
    """Discover nearby services based on location and preferences"""
    try:
        # Get all active businesses
        query = {"is_active": True}
        if request.categories:
            query["category"] = {"$in": request.categories}
        
        businesses = await db.businesses.find(query).to_list(1000)
        
        nearby_businesses = []
        for business in businesses:
            if "location" in business:
                distance = calculate_distance(
                    request.latitude, request.longitude,
                    business["location"]["latitude"], business["location"]["longitude"]
                )
                
                if distance <= request.radius_meters:
                    business["distance_meters"] = round(distance)
                    nearby_businesses.append(business)
        
        # Sort by distance
        nearby_businesses.sort(key=lambda x: x["distance_meters"])
        
        return {
            "total_found": len(nearby_businesses),
            "radius_meters": request.radius_meters,
            "businesses": nearby_businesses
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/businesses/categories")
async def get_business_categories():
    """Get available business categories"""
    return {
        "categories": [
            {"id": "food", "name": "Food", "icon": "restaurant"},
            {"id": "clothing", "name": "Clothing", "icon": "tshirt-crew"},
            {"id": "spa", "name": "Beauty & Spa", "icon": "spa"}
        ]
    }

# Root route
@api_router.get("/")
async def root():
    return {"message": "SheshA API - Location-based service discovery", "version": "1.0.0"}

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)