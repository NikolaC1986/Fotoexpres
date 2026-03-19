#!/usr/bin/env python3
"""
Promo Code System Testing for Photo Printing Service
Tests all promo code functionality as specified in the review request.
"""

import requests
import json
import os
import tempfile
import zipfile
from pathlib import Path
from PIL import Image
import io

# Configuration
BACKEND_URL = "https://promo-checkout-5.preview.emergentagent.com/api"

class PromoCodeTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.admin_token = None
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def create_test_image(self, filename, size_mb=1):
        """Create a test image file"""
        # Calculate dimensions for target file size
        # Rough calculation: RGB image = width * height * 3 bytes
        target_bytes = size_mb * 1024 * 1024
        pixels = target_bytes // 3
        width = height = int(pixels ** 0.5)
        
        # Create image
        img = Image.new('RGB', (width, height), color='red')
        
        # Save to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG', quality=85)
        img_bytes.seek(0)
        
        return img_bytes.getvalue(), filename
    
    def admin_login(self):
        """Login as admin and get token"""
        print("\n=== Admin Login ===")
        
        try:
            login_data = {
                "username": "Vlasnik",
                "password": "$ta$Graca25"
            }
            
            response = requests.post(f"{self.backend_url}/admin/login", json=login_data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('token'):
                    self.admin_token = result['token']
                    self.log_result(
                        "Admin Login", 
                        True, 
                        "Successfully logged in as admin"
                    )
                    return True
                else:
                    self.log_result(
                        "Admin Login", 
                        False, 
                        "Login response missing success or token"
                    )
                    return False
            else:
                self.log_result(
                    "Admin Login", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Admin Login", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return False
    
    def test_setup_test1_promo_code(self):
        """SETUP: Create TEST1 promo code if it doesn't exist"""
        print("\n=== SETUP: Creating TEST1 Promo Code ===")
        
        if not self.admin_token:
            login_success = self.admin_login()
            if not login_success:
                self.log_result(
                    "Setup TEST1 Promo Code", 
                    False, 
                    "Cannot setup - admin login failed"
                )
                return False
        
        try:
            # First check if TEST1 already exists
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.backend_url}/admin/promo-codes", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                codes = result.get('codes', [])
                
                # Check if TEST1 exists
                test1_exists = any(code.get('code') == 'TEST1' for code in codes)
                
                if test1_exists:
                    self.log_result(
                        "Setup TEST1 Promo Code", 
                        True, 
                        "TEST1 promo code already exists"
                    )
                    return True
                
                # Create TEST1 promo code
                create_data = {
                    "code": "TEST1",
                    "discountPercent": 15,
                    "description": "Test promo code for testing - 15% discount",
                    "isActive": True
                }
                
                create_response = requests.post(f"{self.backend_url}/admin/promo-codes", json=create_data, headers=headers)
                
                if create_response.status_code == 200:
                    create_result = create_response.json()
                    
                    if create_result.get('success'):
                        self.log_result(
                            "Setup TEST1 Promo Code", 
                            True, 
                            "TEST1 promo code created successfully",
                            {"code": "TEST1", "discount": "15%"}
                        )
                        return True
                    else:
                        self.log_result(
                            "Setup TEST1 Promo Code", 
                            False, 
                            "Create response success flag is False"
                        )
                        return False
                else:
                    self.log_result(
                        "Setup TEST1 Promo Code", 
                        False, 
                        f"Create failed: HTTP {create_response.status_code}: {create_response.text}"
                    )
                    return False
            else:
                self.log_result(
                    "Setup TEST1 Promo Code", 
                    False, 
                    f"Cannot check existing codes: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Setup TEST1 Promo Code", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return False
    
    def test_promo_code_validation_valid(self):
        """Test PROMO CODE 1: Validate existing promo code TEST1"""
        print("\n=== Testing Promo Code Validation - Valid Code (TEST1) ===")
        
        try:
            data = {"code": "TEST1"}
            response = requests.post(f"{self.backend_url}/promo-codes/validate", json=data)
            
            if response.status_code == 200:
                result = response.json()
                
                # Check required fields
                if result.get('success') and result.get('discount') == 15:
                    self.log_result(
                        "Promo Code Validation Valid", 
                        True, 
                        f"TEST1 promo code validated successfully - 15% discount",
                        {"discount": result.get('discount'), "message": result.get('message')}
                    )
                else:
                    self.log_result(
                        "Promo Code Validation Valid", 
                        False, 
                        f"Invalid response structure or discount: {result}"
                    )
            else:
                self.log_result(
                    "Promo Code Validation Valid", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Promo Code Validation Valid", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_promo_code_validation_invalid(self):
        """Test PROMO CODE 2: Validate invalid promo code"""
        print("\n=== Testing Promo Code Validation - Invalid Code (WRONG) ===")
        
        try:
            data = {"code": "WRONG"}
            response = requests.post(f"{self.backend_url}/promo-codes/validate", json=data)
            
            if response.status_code == 200:
                result = response.json()
                
                # Should return success=false for invalid code
                if not result.get('success'):
                    self.log_result(
                        "Promo Code Validation Invalid", 
                        True, 
                        "Invalid promo code correctly rejected",
                        {"message": result.get('message')}
                    )
                else:
                    self.log_result(
                        "Promo Code Validation Invalid", 
                        False, 
                        f"Invalid code was accepted: {result}"
                    )
            else:
                self.log_result(
                    "Promo Code Validation Invalid", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Promo Code Validation Invalid", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_promo_code_validation_short(self):
        """Test PROMO CODE 3: Validate short promo code (should error)"""
        print("\n=== Testing Promo Code Validation - Short Code (AB) ===")
        
        try:
            data = {"code": "AB"}
            response = requests.post(f"{self.backend_url}/promo-codes/validate", json=data)
            
            # Should return error for code less than 5 characters
            if response.status_code == 400:
                self.log_result(
                    "Promo Code Validation Short", 
                    True, 
                    "Short promo code correctly rejected with 400 error"
                )
            else:
                result = response.json() if response.status_code == 200 else {}
                self.log_result(
                    "Promo Code Validation Short", 
                    False, 
                    f"Expected 400 error, got {response.status_code}: {result}"
                )
                
        except Exception as e:
            self.log_result(
                "Promo Code Validation Short", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_promo_code_usage_increment(self):
        """Test PROMO CODE 4: Increment promo code usage"""
        print("\n=== Testing Promo Code Usage Increment (TEST1) ===")
        
        try:
            # First get current usage count via admin API
            if not self.admin_token:
                login_success = self.admin_login()
                if not login_success:
                    self.log_result(
                        "Promo Code Usage Increment", 
                        False, 
                        "Cannot test - admin login failed"
                    )
                    return
            
            # Get current promo codes to check initial usage
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            admin_response = requests.get(f"{self.backend_url}/admin/promo-codes", headers=headers)
            
            if admin_response.status_code != 200:
                self.log_result(
                    "Promo Code Usage Increment", 
                    False, 
                    f"Cannot get initial usage count: HTTP {admin_response.status_code}"
                )
                return
            
            admin_result = admin_response.json()
            test1_code = None
            initial_usage = 0
            
            for code in admin_result.get('codes', []):
                if code.get('code') == 'TEST1':
                    test1_code = code
                    initial_usage = code.get('timesUsed', 0)
                    break
            
            if not test1_code:
                self.log_result(
                    "Promo Code Usage Increment", 
                    False, 
                    "TEST1 promo code not found in admin list"
                )
                return
            
            # Now increment usage
            data = {"code": "TEST1"}
            response = requests.post(f"{self.backend_url}/promo-codes/use", json=data)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('success'):
                    # Verify usage was incremented by checking admin API again
                    verify_response = requests.get(f"{self.backend_url}/admin/promo-codes", headers=headers)
                    
                    if verify_response.status_code == 200:
                        verify_result = verify_response.json()
                        
                        for code in verify_result.get('codes', []):
                            if code.get('code') == 'TEST1':
                                new_usage = code.get('timesUsed', 0)
                                
                                if new_usage == initial_usage + 1:
                                    self.log_result(
                                        "Promo Code Usage Increment", 
                                        True, 
                                        f"Usage incremented successfully: {initial_usage} → {new_usage}",
                                        {"initial_usage": initial_usage, "new_usage": new_usage}
                                    )
                                else:
                                    self.log_result(
                                        "Promo Code Usage Increment", 
                                        False, 
                                        f"Usage not incremented correctly: {initial_usage} → {new_usage}"
                                    )
                                return
                        
                        self.log_result(
                            "Promo Code Usage Increment", 
                            False, 
                            "TEST1 code not found in verification response"
                        )
                    else:
                        self.log_result(
                            "Promo Code Usage Increment", 
                            False, 
                            f"Cannot verify usage increment: HTTP {verify_response.status_code}"
                        )
                else:
                    self.log_result(
                        "Promo Code Usage Increment", 
                        False, 
                        "Usage increment response success flag is False"
                    )
            else:
                self.log_result(
                    "Promo Code Usage Increment", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Promo Code Usage Increment", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_promo_code_admin_log(self):
        """Test PROMO CODE 5: Get promo code usage log"""
        print("\n=== Testing Promo Code Admin Log ===")
        
        if not self.admin_token:
            login_success = self.admin_login()
            if not login_success:
                self.log_result(
                    "Promo Code Admin Log", 
                    False, 
                    "Cannot test - admin login failed"
                )
                return
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.backend_url}/admin/promo-codes/log", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                
                # Check response structure
                if 'success' in result and 'log' in result and 'total' in result:
                    log_entries = result.get('log', [])
                    total_count = result.get('total', 0)
                    
                    self.log_result(
                        "Promo Code Admin Log", 
                        True, 
                        f"Admin log retrieved successfully - {total_count} orders with promo codes",
                        {"total_orders": total_count, "log_entries": len(log_entries)}
                    )
                else:
                    self.log_result(
                        "Promo Code Admin Log", 
                        False, 
                        f"Invalid response structure: {result}"
                    )
            else:
                self.log_result(
                    "Promo Code Admin Log", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Promo Code Admin Log", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_order_with_promo_code(self):
        """Test PROMO CODE 6: Create order with promo code"""
        print("\n=== Testing Order Creation with Promo Code ===")
        
        # Test data with promo code
        order_details = {
            "contactInfo": {
                "fullName": "Test User",
                "email": "test@test.com",
                "phone": "0601234567",
                "street": "Test Street 1",
                "postalCode": "11000",
                "city": "Belgrade",
                "notes": "Test order with promo code"
            },
            "photoSettings": [
                {
                    "fileName": "promo_test1.jpg",
                    "format": "10x15",
                    "quantity": 5,
                    "finish": "sjajni"
                }
            ],
            "promoCode": "TEST1",
            "promoCodeDiscount": 15,
            "promoCodeDiscountAmount": 13.5,  # 15% of 90 RSD (5 photos * 18 RSD)
            "totalPrice": 90,
            "grandTotal": 76.5  # 90 - 13.5
        }
        
        try:
            # Create test image
            photo_data, _ = self.create_test_image("promo_test1.jpg", 2)
            
            files = [
                ('photos', ('promo_test1.jpg', photo_data, 'image/jpeg'))
            ]
            
            data = {
                'order_details': json.dumps(order_details)
            }
            
            # Create order
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('success'):
                    order_number = result['orderNumber']
                    
                    # Verify order contains promo code data
                    order_response = requests.get(f"{self.backend_url}/orders/{order_number}")
                    
                    if order_response.status_code == 200:
                        order_data = order_response.json()
                        
                        # Check promo code fields
                        promo_code = order_data.get('promoCode')
                        promo_discount = order_data.get('promoCodeDiscount')
                        promo_amount = order_data.get('promoCodeDiscountAmount')
                        
                        if promo_code == 'TEST1' and promo_discount == 15 and promo_amount == 13.5:
                            self.log_result(
                                "Order with Promo Code", 
                                True, 
                                f"Order created with promo code: {order_number}",
                                {
                                    "promo_code": promo_code,
                                    "discount_percent": promo_discount,
                                    "discount_amount": promo_amount
                                }
                            )
                            return order_number
                        else:
                            self.log_result(
                                "Order with Promo Code", 
                                False, 
                                f"Promo code data not saved correctly: code={promo_code}, discount={promo_discount}, amount={promo_amount}"
                            )
                    else:
                        self.log_result(
                            "Order with Promo Code", 
                            False, 
                            f"Cannot retrieve order for verification: HTTP {order_response.status_code}"
                        )
                else:
                    self.log_result(
                        "Order with Promo Code", 
                        False, 
                        "Order creation success flag is False"
                    )
            else:
                self.log_result(
                    "Order with Promo Code", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Order with Promo Code", 
                False, 
                f"Exception occurred: {str(e)}"
            )
        
        return None
    
    def test_api_connectivity(self):
        """Test basic API connectivity"""
        print("\n=== Testing API Connectivity ===")
        
        try:
            response = requests.get(f"{self.backend_url}/")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('message') == 'Hello World':
                    self.log_result(
                        "API Connectivity", 
                        True, 
                        "Backend API is accessible"
                    )
                else:
                    self.log_result(
                        "API Connectivity", 
                        False, 
                        f"Unexpected response: {result}"
                    )
            else:
                self.log_result(
                    "API Connectivity", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "API Connectivity", 
                False, 
                f"Cannot connect to backend: {str(e)}"
            )

    def run_all_tests(self):
        """Run all promo code tests in sequence"""
        print("🚀 Starting Backend API Testing for PROMO CODE SYSTEM")
        print("=" * 80)
        
        # Phase 1: Basic functionality tests
        print("\n📋 PHASE 1: BASIC FUNCTIONALITY TESTS")
        self.test_api_connectivity()
        
        # Phase 2: Admin login (required for promo code setup)
        print("\n📋 PHASE 2: ADMIN AUTHENTICATION")
        admin_login_success = self.admin_login()
        
        if not admin_login_success:
            print("❌ Admin login failed - cannot proceed with promo code tests")
            return False
        
        # Phase 3: Promo Code System Setup
        print("\n📋 PHASE 3: PROMO CODE SYSTEM SETUP")
        setup_success = self.test_setup_test1_promo_code()
        
        if not setup_success:
            print("❌ Promo code setup failed - cannot proceed with validation tests")
            return False
        
        # Phase 4: Promo Code Backend API Tests (Priority 1 - Critical)
        print("\n📋 PHASE 4: PROMO CODE BACKEND API TESTS (PRIORITY 1 - CRITICAL)")
        self.test_promo_code_validation_valid()
        self.test_promo_code_validation_invalid()
        self.test_promo_code_validation_short()
        self.test_promo_code_usage_increment()
        self.test_promo_code_admin_log()
        
        # Phase 5: Order Integration with Promo Codes
        print("\n📋 PHASE 5: ORDER INTEGRATION WITH PROMO CODES")
        promo_order = self.test_order_with_promo_code()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 PROMO CODE SYSTEM TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print(f"\n✅ Promo Code System testing completed with {success_rate:.1f}% success rate")
        return success_rate > 80  # Consider 80%+ as overall success

if __name__ == "__main__":
    tester = PromoCodeTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All promo code tests completed successfully!")
        exit(0)
    else:
        print("\n💥 Some promo code tests failed!")
        exit(1)