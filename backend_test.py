#!/usr/bin/env python3
"""
SheshA Backend API Testing Suite
Tests all backend endpoints for the location-based service discovery app
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Optional

class SheshAAPITester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.auth_token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: dict = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def test_health_endpoint(self):
        """Test /api/health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log_test("Health Check", True, "API is healthy", data)
                    return True
                else:
                    self.log_test("Health Check", False, "Invalid health response format", data)
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_send_otp(self, contact: str, contact_type: str):
        """Test /api/auth/send-otp endpoint"""
        try:
            payload = {
                "contact": contact,
                "contact_type": contact_type
            }
            response = requests.post(f"{self.base_url}/api/auth/send-otp", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "demo_otp" in data:
                    self.log_test(f"Send OTP ({contact_type})", True, f"OTP sent to {contact}, demo OTP: {data['demo_otp']}", data)
                    return data["demo_otp"]
                else:
                    self.log_test(f"Send OTP ({contact_type})", False, "Invalid response format", data)
                    return None
            else:
                self.log_test(f"Send OTP ({contact_type})", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return None
        except Exception as e:
            self.log_test(f"Send OTP ({contact_type})", False, f"Error: {str(e)}")
            return None
    
    def test_verify_otp(self, contact: str, contact_type: str, otp_code: str):
        """Test /api/auth/verify-otp endpoint"""
        try:
            payload = {
                "contact": contact,
                "contact_type": contact_type,
                "otp_code": otp_code
            }
            response = requests.post(f"{self.base_url}/api/auth/verify-otp", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user_id" in data:
                    self.auth_token = data["access_token"]
                    self.user_id = data["user_id"]
                    self.log_test("Verify OTP", True, f"Authentication successful, user_id: {self.user_id}", data)
                    return True
                else:
                    self.log_test("Verify OTP", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Verify OTP", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return False
        except Exception as e:
            self.log_test("Verify OTP", False, f"Error: {str(e)}")
            return False
    
    def get_auth_headers(self):
        """Get authorization headers"""
        if not self.auth_token:
            return {}
        return {"Authorization": f"Bearer {self.auth_token}"}
    
    def test_user_profile(self):
        """Test /api/users/profile endpoint"""
        try:
            headers = self.get_auth_headers()
            response = requests.get(f"{self.base_url}/api/users/profile", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data:
                    self.log_test("Get User Profile", True, f"Profile retrieved for user {data.get('id')}", data)
                    return True
                else:
                    self.log_test("Get User Profile", False, "Invalid profile response", data)
                    return False
            elif response.status_code == 401:
                self.log_test("Get User Profile", False, "Authentication failed", response.json() if response.text else {})
                return False
            else:
                self.log_test("Get User Profile", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return False
        except Exception as e:
            self.log_test("Get User Profile", False, f"Error: {str(e)}")
            return False
    
    def test_update_preferences(self):
        """Test /api/users/preferences endpoint"""
        try:
            headers = self.get_auth_headers()
            preferences = ["food", "spa"]
            response = requests.put(f"{self.base_url}/api/users/preferences", 
                                  json=preferences, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Update User Preferences", True, f"Preferences updated: {preferences}", data)
                    return True
                else:
                    self.log_test("Update User Preferences", False, "Update failed", data)
                    return False
            else:
                self.log_test("Update User Preferences", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return False
        except Exception as e:
            self.log_test("Update User Preferences", False, f"Error: {str(e)}")
            return False
    
    def test_update_location(self):
        """Test /api/users/location endpoint"""
        try:
            headers = self.get_auth_headers()
            location = {"latitude": 12.9716, "longitude": 77.5946}  # Bangalore coordinates
            response = requests.put(f"{self.base_url}/api/users/location", 
                                  json=location, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Update User Location", True, f"Location updated: {location}", data)
                    return True
                else:
                    self.log_test("Update User Location", False, "Update failed", data)
                    return False
            else:
                self.log_test("Update User Location", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return False
        except Exception as e:
            self.log_test("Update User Location", False, f"Error: {str(e)}")
            return False
    
    def test_create_business(self):
        """Test /api/businesses endpoint"""
        try:
            headers = self.get_auth_headers()
            business_data = {
                "business_name": "Rajesh's Food Corner",
                "description": "Authentic South Indian cuisine",
                "category": "food",
                "phone_number": "+919876543210",
                "email": "rajesh@foodcorner.com",
                "address": "123 MG Road, Bangalore",
                "location": {"latitude": 12.9716, "longitude": 77.5946},
                "services": ["Breakfast", "Lunch", "Dinner"]
            }
            response = requests.post(f"{self.base_url}/api/businesses", 
                                   json=business_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data.get("business_name") == business_data["business_name"]:
                    self.log_test("Create Business", True, f"Business created: {data.get('business_name')}", data)
                    return data["id"]
                else:
                    self.log_test("Create Business", False, "Invalid business response", data)
                    return None
            else:
                self.log_test("Create Business", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return None
        except Exception as e:
            self.log_test("Create Business", False, f"Error: {str(e)}")
            return None
    
    def test_get_my_businesses(self):
        """Test /api/businesses/my endpoint"""
        try:
            headers = self.get_auth_headers()
            response = requests.get(f"{self.base_url}/api/businesses/my", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get My Businesses", True, f"Retrieved {len(data)} businesses", {"count": len(data)})
                    return True
                else:
                    self.log_test("Get My Businesses", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Get My Businesses", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return False
        except Exception as e:
            self.log_test("Get My Businesses", False, f"Error: {str(e)}")
            return False
    
    def test_discover_nearby(self):
        """Test /api/discover/nearby endpoint"""
        try:
            headers = self.get_auth_headers()
            search_data = {
                "latitude": 12.9716,
                "longitude": 77.5946,
                "radius_meters": 5000,
                "categories": ["food"]
            }
            response = requests.post(f"{self.base_url}/api/discover/nearby", 
                                   json=search_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "total_found" in data and "businesses" in data:
                    self.log_test("Discover Nearby Services", True, f"Found {data['total_found']} nearby businesses", data)
                    return True
                else:
                    self.log_test("Discover Nearby Services", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Discover Nearby Services", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return False
        except Exception as e:
            self.log_test("Discover Nearby Services", False, f"Error: {str(e)}")
            return False
    
    def test_create_offer(self, business_id: str):
        """Test POST /api/businesses/{business_id}/offers endpoint"""
        try:
            headers = self.get_auth_headers()
            from datetime import timedelta
            valid_until = (datetime.now() + timedelta(days=30)).isoformat() + "Z"
            
            offer_data = {
                "title": "Special Lunch Deal",
                "description": "Get 20% off on all lunch items",
                "discount_type": "percentage",
                "discount_value": 20,
                "original_price": 500,
                "valid_until": valid_until,
                "max_uses": 100,
                "terms_conditions": "Valid for dine-in only"
            }
            
            response = requests.post(f"{self.base_url}/api/businesses/{business_id}/offers", 
                                   json=offer_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data.get("title") == offer_data["title"]:
                    # Verify discount calculation
                    expected_discounted = 400  # 20% off 500
                    if data.get("discounted_price") == expected_discounted:
                        self.log_test("Create Offer", True, f"Offer created: {data.get('title')}, discounted price: ${data.get('discounted_price')}", data)
                        return data["id"]
                    else:
                        self.log_test("Create Offer", False, f"Incorrect discount calculation: expected ${expected_discounted}, got ${data.get('discounted_price')}", data)
                        return None
                else:
                    self.log_test("Create Offer", False, "Invalid offer response", data)
                    return None
            else:
                self.log_test("Create Offer", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return None
        except Exception as e:
            self.log_test("Create Offer", False, f"Error: {str(e)}")
            return None
    
    def test_create_fixed_amount_offer(self, business_id: str):
        """Test creating offer with fixed amount discount"""
        try:
            headers = self.get_auth_headers()
            from datetime import timedelta
            valid_until = (datetime.now() + timedelta(days=15)).isoformat() + "Z"
            
            offer_data = {
                "title": "Fixed $50 Off Deal",
                "description": "Get $50 off on orders above $200",
                "discount_type": "fixed_amount",
                "discount_value": 50,
                "original_price": 200,
                "valid_until": valid_until,
                "max_uses": 50,
                "terms_conditions": "Minimum order $200"
            }
            
            response = requests.post(f"{self.base_url}/api/businesses/{business_id}/offers", 
                                   json=offer_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                expected_discounted = 150  # 200 - 50
                if data.get("discounted_price") == expected_discounted:
                    self.log_test("Create Fixed Amount Offer", True, f"Fixed amount offer created: ${data.get('original_price')} - ${data.get('discount_value')} = ${data.get('discounted_price')}", data)
                    return data["id"]
                else:
                    self.log_test("Create Fixed Amount Offer", False, f"Incorrect fixed amount calculation", data)
                    return None
            else:
                self.log_test("Create Fixed Amount Offer", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return None
        except Exception as e:
            self.log_test("Create Fixed Amount Offer", False, f"Error: {str(e)}")
            return None
    
    def test_get_business_offers(self, business_id: str):
        """Test GET /api/businesses/{business_id}/offers endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/businesses/{business_id}/offers", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    active_offers = [offer for offer in data if offer.get("is_active")]
                    self.log_test("Get Business Offers", True, f"Retrieved {len(data)} offers ({len(active_offers)} active)", {"total": len(data), "active": len(active_offers)})
                    return True
                else:
                    self.log_test("Get Business Offers", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Get Business Offers", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return False
        except Exception as e:
            self.log_test("Get Business Offers", False, f"Error: {str(e)}")
            return False
    
    def test_get_my_offers(self):
        """Test GET /api/offers/my endpoint"""
        try:
            headers = self.get_auth_headers()
            response = requests.get(f"{self.base_url}/api/offers/my", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check that offers include business info
                    offers_with_business_info = [offer for offer in data if "business_info" in offer]
                    self.log_test("Get My Offers", True, f"Retrieved {len(data)} user offers ({len(offers_with_business_info)} with business info)", {"total": len(data), "with_business_info": len(offers_with_business_info)})
                    return True
                else:
                    self.log_test("Get My Offers", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Get My Offers", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return False
        except Exception as e:
            self.log_test("Get My Offers", False, f"Error: {str(e)}")
            return False
    
    def test_nearby_offers(self):
        """Test POST /api/offers/nearby endpoint"""
        try:
            headers = self.get_auth_headers()
            search_data = {
                "latitude": 12.9716,
                "longitude": 77.5946,
                "radius_meters": 5000,
                "categories": ["food"]
            }
            
            response = requests.post(f"{self.base_url}/api/offers/nearby", 
                                   json=search_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "total_found" in data and "offers" in data and "radius_meters" in data:
                    offers = data["offers"]
                    offers_with_distance = [offer for offer in offers if "distance_meters" in offer]
                    self.log_test("Get Nearby Offers", True, f"Found {data['total_found']} nearby offers within {data['radius_meters']}m ({len(offers_with_distance)} with distance)", data)
                    return True
                else:
                    self.log_test("Get Nearby Offers", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Get Nearby Offers", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return False
        except Exception as e:
            self.log_test("Get Nearby Offers", False, f"Error: {str(e)}")
            return False
    
    def test_deactivate_offer(self, offer_id: str):
        """Test PUT /api/offers/{offer_id}/deactivate endpoint"""
        try:
            headers = self.get_auth_headers()
            response = requests.put(f"{self.base_url}/api/offers/{offer_id}/deactivate", 
                                  headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Deactivate Offer", True, f"Offer {offer_id} deactivated successfully", data)
                    return True
                else:
                    self.log_test("Deactivate Offer", False, "Deactivation failed", data)
                    return False
            else:
                self.log_test("Deactivate Offer", False, f"HTTP {response.status_code}", response.json() if response.text else {})
                return False
        except Exception as e:
            self.log_test("Deactivate Offer", False, f"Error: {str(e)}")
            return False
    
    def run_full_test_suite(self):
        """Run complete test suite"""
        print("🚀 Starting OshirO Backend API Test Suite")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Health Check
        if not self.test_health_endpoint():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Test 2: Authentication Flow - Use existing credentials first
        print("\n📱 Testing Authentication Flow...")
        
        # Try existing email and OTP first
        test_email = "viswamantrateam@gmail.com"
        existing_otp = "956819"
        
        print(f"🔐 Trying existing credentials: {test_email} with OTP {existing_otp}")
        if not self.test_verify_otp(test_email, "email", existing_otp):
            print("🔄 Existing OTP invalid, generating new one...")
            otp_code = self.test_send_otp(test_email, "email")
            
            if not otp_code:
                print("❌ OTP sending failed - stopping tests")
                return False
            
            if not self.test_verify_otp(test_email, "email", otp_code):
                print("❌ OTP verification failed - stopping tests")
                return False
        
        # Test 3: User Profile Operations
        print("\n👤 Testing User Profile Operations...")
        self.test_user_profile()
        self.test_update_preferences()
        self.test_update_location()
        
        # Test 4: Business Operations
        print("\n🏢 Testing Business Operations...")
        business_id = self.test_create_business()
        self.test_get_my_businesses()
        
        # Test 5: NEW OFFERS FUNCTIONALITY
        print("\n🎯 Testing NEW Offers Functionality...")
        if business_id:
            # Create offers
            percentage_offer_id = self.test_create_offer(business_id)
            fixed_amount_offer_id = self.test_create_fixed_amount_offer(business_id)
            
            # Test offer retrieval
            self.test_get_business_offers(business_id)
            self.test_get_my_offers()
            self.test_nearby_offers()
            
            # Test offer deactivation
            if percentage_offer_id:
                self.test_deactivate_offer(percentage_offer_id)
        else:
            print("⚠️ Skipping offers tests - no business created")
        
        # Test 6: Service Discovery
        print("\n🔍 Testing Service Discovery...")
        self.test_discover_nearby()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return passed == total

def main():
    # Get backend URL from environment or use default
    import os
    backend_url = "https://shop-nearby-3.preview.emergentagent.com"
    
    print(f"🔗 Backend URL: {backend_url}")
    
    tester = SheshAAPITester(backend_url)
    success = tester.run_full_test_suite()
    
    if success:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print("\n💥 Some tests failed!")
        return 1

if __name__ == "__main__":
    exit(main())