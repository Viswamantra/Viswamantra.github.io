#!/usr/bin/env python3
"""
OshirO Backend API Testing Script
Focus: New Admin Endpoints + Quick Smoke Test
"""

import requests
import json
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://shop-nearby-3.preview.emergentagent.com/api"
ADMIN_KEY = "oshiro_admin_2024"

def test_health_endpoint():
    """Test GET /api/health"""
    print("\n🔍 Testing Health Endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_send_otp():
    """Test POST /api/auth/send-otp"""
    print("\n🔍 Testing Send OTP...")
    try:
        payload = {
            "contact": "+919876543210",
            "contact_type": "phone"
        }
        response = requests.post(f"{BACKEND_URL}/auth/send-otp", json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ OTP sent successfully: {data}")
            return True, data.get("demo_otp")
        else:
            print(f"❌ Send OTP failed: {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Send OTP error: {e}")
        return False, None

def test_verify_otp(otp_code):
    """Test POST /api/auth/verify-otp"""
    print("\n🔍 Testing Verify OTP...")
    try:
        payload = {
            "contact": "+919876543210",
            "contact_type": "phone",
            "otp_code": otp_code
        }
        response = requests.post(f"{BACKEND_URL}/auth/verify-otp", json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ OTP verified successfully: {data}")
            return True
        else:
            print(f"❌ Verify OTP failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Verify OTP error: {e}")
        return False

def test_admin_customers():
    """Test GET /api/admin/customers?admin_key=oshiro_admin_2024"""
    print("\n🔍 Testing Admin Customers Endpoint...")
    try:
        params = {"admin_key": ADMIN_KEY}
        response = requests.get(f"{BACKEND_URL}/admin/customers", params=params, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Admin customers endpoint working")
            print(f"Total customers: {data.get('total', 0)}")
            print(f"Showing: {data.get('showing', 0)}")
            
            # Check data structure
            customers = data.get('customers', [])
            if customers:
                sample_customer = customers[0]
                required_fields = ['id', 'phone_number', 'name', 'preferences']
                missing_fields = [field for field in required_fields if field not in sample_customer]
                if missing_fields:
                    print(f"⚠️ Missing fields in customer data: {missing_fields}")
                else:
                    print(f"✅ Customer data structure correct")
                    print(f"Sample customer: {json.dumps(sample_customer, indent=2, default=str)}")
            else:
                print("ℹ️ No customers found in database")
            return True
        else:
            print(f"❌ Admin customers failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Admin customers error: {e}")
        return False

def test_admin_merchants():
    """Test GET /api/admin/merchants?admin_key=oshiro_admin_2024"""
    print("\n🔍 Testing Admin Merchants Endpoint...")
    try:
        params = {"admin_key": ADMIN_KEY}
        response = requests.get(f"{BACKEND_URL}/admin/merchants", params=params, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Admin merchants endpoint working")
            print(f"Total merchants: {data.get('total', 0)}")
            print(f"Showing: {data.get('showing', 0)}")
            
            # Check data structure
            merchants = data.get('merchants', [])
            if merchants:
                sample_merchant = merchants[0]
                required_fields = ['id', 'phone_number', 'name', 'businesses']
                missing_fields = [field for field in required_fields if field not in sample_merchant]
                if missing_fields:
                    print(f"⚠️ Missing fields in merchant data: {missing_fields}")
                else:
                    print(f"✅ Merchant data structure correct")
                    print(f"Sample merchant: {json.dumps(sample_merchant, indent=2, default=str)}")
                    
                    # Check businesses array
                    businesses = sample_merchant.get('businesses', [])
                    if businesses:
                        sample_business = businesses[0]
                        business_fields = ['id', 'name', 'category', 'location']
                        missing_business_fields = [field for field in business_fields if field not in sample_business]
                        if missing_business_fields:
                            print(f"⚠️ Missing fields in business data: {missing_business_fields}")
                        else:
                            print(f"✅ Business data structure correct")
            else:
                print("ℹ️ No merchants found in database")
            return True
        else:
            print(f"❌ Admin merchants failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Admin merchants error: {e}")
        return False

def test_admin_invalid_key():
    """Test admin endpoints with invalid key"""
    print("\n🔍 Testing Admin Endpoints with Invalid Key...")
    try:
        params = {"admin_key": "invalid_key"}
        response = requests.get(f"{BACKEND_URL}/admin/customers", params=params, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 403:
            print(f"✅ Admin security working - invalid key rejected")
            return True
        else:
            print(f"❌ Admin security issue - invalid key accepted: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Admin security test error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("🚀 OshirO Backend API Testing")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Admin Key: {ADMIN_KEY}")
    print("=" * 60)
    
    results = {}
    
    # Priority 1: NEW Admin Endpoints
    print("\n" + "=" * 40)
    print("🎯 PRIORITY 1: NEW ADMIN ENDPOINTS")
    print("=" * 40)
    
    results['admin_customers'] = test_admin_customers()
    results['admin_merchants'] = test_admin_merchants()
    results['admin_security'] = test_admin_invalid_key()
    
    # Priority 2: Quick Smoke Test
    print("\n" + "=" * 40)
    print("🔥 PRIORITY 2: QUICK SMOKE TEST")
    print("=" * 40)
    
    results['health'] = test_health_endpoint()
    
    otp_sent, demo_otp = test_send_otp()
    results['send_otp'] = otp_sent
    
    if otp_sent and demo_otp:
        results['verify_otp'] = test_verify_otp(demo_otp)
    else:
        # Try with any 6-digit code as mentioned in requirements
        results['verify_otp'] = test_verify_otp("123456")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    success_rate = (passed_tests / total_tests) * 100
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    print(f"Success Rate: {success_rate:.1f}%")
    
    print("\nDetailed Results:")
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
    
    print("\n" + "=" * 60)
    
    return results

if __name__ == "__main__":
    main()