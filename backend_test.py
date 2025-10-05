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
    
    def run_full_test_suite(self):
        """Run complete test suite"""
        print("🚀 Starting SheshA Backend API Test Suite")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Health Check
        if not self.test_health_endpoint():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Test 2: Authentication Flow
        print("\n📱 Testing Authentication Flow...")
        test_phone = "+919182653234"
        otp_code = self.test_send_otp(test_phone, "phone")
        
        if not otp_code:
            print("❌ OTP sending failed - stopping tests")
            return False
        
        if not self.test_verify_otp(test_phone, "phone", otp_code):
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
        
        # Test 5: Service Discovery
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
    backend_url = "https://shesha-finder.preview.emergentagent.com"
    
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