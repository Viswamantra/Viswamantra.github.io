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
app = FastAPI(title="OshirO API", description="Location-based service discovery app")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Secret key (in production, this should be in env variables)
SECRET_KEY = "oshiro_secret_key_change_in_production"
ALGORITHM = "HS256"

# Pydantic Models
class Offer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_id: str
    title: str
    description: str
    discount_type: str  # "percentage", "fixed_amount"
    discount_value: float  # e.g., 20 for 20% or 100 for $100 off
    original_price: Optional[float] = None
    discounted_price: Optional[float] = None
    image_base64: Optional[str] = None  # business photo in base64
    valid_from: datetime = Field(default_factory=datetime.utcnow)
    valid_until: datetime
    max_uses: Optional[int] = None  # maximum number of uses
    current_uses: int = 0
    is_active: bool = True
    for_oshiro_users_only: bool = True  # instant discount for OshirO users
    terms_conditions: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OfferCreate(BaseModel):
    title: str
    description: str
    discount_type: str
    discount_value: float
    original_price: Optional[float] = None
    image_base64: Optional[str] = None
    valid_until: str  # ISO format date string
    max_uses: Optional[int] = None
    terms_conditions: Optional[str] = None

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
    
    return clean_mongo_doc(user)

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
            print(f"📱 Mock SMS to {request.contact}: Your OshirO OTP is {otp_code}")
        else:
            print(f"📧 Mock Email to {request.contact}: Your OshirO OTP is {otp_code}")
        
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
    return clean_mongo_docs(businesses)

@api_router.get("/businesses/{business_id}/services")
async def get_business_services(business_id: str):
    """Get services for a specific business"""
    services = await db.services.find({"business_id": business_id, "is_active": True}).to_list(100)
    return clean_mongo_docs(services)

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

# Offers Routes
@api_router.post("/businesses/{business_id}/offers", response_model=Offer)
async def create_offer(
    business_id: str,
    offer_data: OfferCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create an offer for a business"""
    # Verify business ownership
    business = await db.businesses.find_one({"id": business_id, "owner_id": current_user["id"]})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found or not owned by user")
    
    # Parse valid_until date
    from datetime import datetime
    try:
        valid_until = datetime.fromisoformat(offer_data.valid_until.replace('Z', '+00:00'))
    except:
        raise HTTPException(status_code=400, detail="Invalid date format for valid_until")
    
    # Calculate discounted price if original price is provided
    discounted_price = None
    if offer_data.original_price:
        if offer_data.discount_type == "percentage":
            discounted_price = offer_data.original_price * (1 - offer_data.discount_value / 100)
        elif offer_data.discount_type == "fixed_amount":
            discounted_price = max(0, offer_data.original_price - offer_data.discount_value)
    
    offer = Offer(
        business_id=business_id,
        title=offer_data.title,
        description=offer_data.description,
        discount_type=offer_data.discount_type,
        discount_value=offer_data.discount_value,
        original_price=offer_data.original_price,
        discounted_price=discounted_price,
        image_base64=offer_data.image_base64,
        valid_until=valid_until,
        max_uses=offer_data.max_uses,
        terms_conditions=offer_data.terms_conditions
    )
    
    await db.offers.insert_one(offer.dict())
    return offer

@api_router.get("/businesses/{business_id}/offers")
async def get_business_offers(business_id: str):
    """Get offers for a specific business"""
    offers = await db.offers.find({
        "business_id": business_id, 
        "is_active": True,
        "valid_until": {"$gt": datetime.utcnow()}
    }).to_list(100)
    return clean_mongo_docs(offers)

@api_router.get("/offers/my")
async def get_my_offers(current_user: dict = Depends(get_current_user)):
    """Get offers for businesses owned by current user"""
    # Get user's businesses
    businesses = await db.businesses.find({"owner_id": current_user["id"]}).to_list(100)
    business_ids = [b["id"] for b in businesses]
    
    if not business_ids:
        return []
    
    offers = await db.offers.find({
        "business_id": {"$in": business_ids},
        "is_active": True
    }).to_list(100)
    
    # Clean businesses first to remove ObjectId
    clean_businesses = clean_mongo_docs(businesses)
    business_map = {b["id"]: b for b in clean_businesses}
    
    # Add business info to each offer
    for offer in offers:
        if offer["business_id"] in business_map:
            offer["business_info"] = business_map[offer["business_id"]]
    
    return clean_mongo_docs(offers)

@api_router.post("/offers/nearby")
async def get_nearby_offers(
    request: NearbyServicesRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get offers from nearby businesses"""
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
        
        # Get offers for nearby businesses
        business_ids = [b["id"] for b in nearby_businesses]
        offers = await db.offers.find({
            "business_id": {"$in": business_ids},
            "is_active": True,
            "valid_until": {"$gt": datetime.utcnow()}
        }).to_list(1000)
        
        # Add business info and distance to offers
        business_map = {b["id"]: b for b in nearby_businesses}
        for offer in offers:
            if offer["business_id"] in business_map:
                business_info = business_map[offer["business_id"]]
                offer["business_info"] = business_info
                offer["distance_meters"] = business_info["distance_meters"]
        
        # Sort by distance
        offers.sort(key=lambda x: x.get("distance_meters", float('inf')))
        
        return {
            "total_found": len(offers),
            "radius_meters": request.radius_meters,
            "offers": clean_mongo_docs(offers)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/offers/{offer_id}/deactivate")
async def deactivate_offer(
    offer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deactivate an offer"""
    # Find offer and verify ownership through business
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    business = await db.businesses.find_one({"id": offer["business_id"], "owner_id": current_user["id"]})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found or not owned by user")
    
    await db.offers.update_one(
        {"id": offer_id},
        {"$set": {"is_active": False}}
    )
    
    return {"success": True, "message": "Offer deactivated successfully"}

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
            "businesses": clean_mongo_docs(nearby_businesses)
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
    return {"message": "OshirO API - Location-based service discovery", "version": "1.0.0"}

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