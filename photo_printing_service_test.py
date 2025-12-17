#!/usr/bin/env python3
"""
Photo Printing Service - Specific Feature Testing
Tests the specific UI and feature updates mentioned in the review request:
1. Quantity Discounts Admin Toggle
2. Settings API with quantityDiscountsEnabled field
3. Order Text File Contains Promo Code
4. Admin Login with provided credentials
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
BACKEND_URL = "https://promo-system-3.preview.emergentagent.com/api"

class PhotoPrintingServiceTester:
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
        """Login as admin with provided credentials"""
        print("\n=== Admin Login with Provided Credentials ===")
        
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
                        "Successfully logged in as admin with provided credentials",
                        {"username": "Vlasnik", "token_length": len(result['token'])}
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
    
    def test_get_settings_quantity_discounts_enabled(self):
        """Test: GET /api/settings should return quantityDiscountsEnabled field"""
        print("\n=== Testing GET /api/settings - quantityDiscountsEnabled Field ===")
        
        try:
            response = requests.get(f"{self.backend_url}/settings")
            
            if response.status_code == 200:
                result = response.json()
                settings = result.get('settings', {})
                
                if 'quantityDiscountsEnabled' in settings:
                    quantity_discounts_enabled = settings['quantityDiscountsEnabled']
                    self.log_result(
                        "GET Settings - quantityDiscountsEnabled", 
                        True, 
                        f"quantityDiscountsEnabled field found: {quantity_discounts_enabled}",
                        {"field_type": type(quantity_discounts_enabled).__name__, "value": quantity_discounts_enabled}
                    )
                    return quantity_discounts_enabled
                else:
                    self.log_result(
                        "GET Settings - quantityDiscountsEnabled", 
                        False, 
                        "quantityDiscountsEnabled field missing from settings",
                        {"available_fields": list(settings.keys())}
                    )
                    return None
            else:
                self.log_result(
                    "GET Settings - quantityDiscountsEnabled", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return None
                
        except Exception as e:
            self.log_result(
                "GET Settings - quantityDiscountsEnabled", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return None
    
    def test_put_admin_settings_quantity_discounts_enabled(self):
        """Test: PUT /api/admin/settings should accept quantityDiscountsEnabled in settings object"""
        print("\n=== Testing PUT /api/admin/settings - quantityDiscountsEnabled Field ===")
        
        if not self.admin_token:
            login_success = self.admin_login()
            if not login_success:
                self.log_result(
                    "PUT Admin Settings - quantityDiscountsEnabled", 
                    False, 
                    "Cannot test - admin login failed"
                )
                return False
        
        try:
            # First get current settings
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            get_response = requests.get(f"{self.backend_url}/admin/settings", headers=headers)
            
            if get_response.status_code != 200:
                self.log_result(
                    "PUT Admin Settings - quantityDiscountsEnabled", 
                    False, 
                    f"Cannot get current settings: HTTP {get_response.status_code}"
                )
                return False
            
            current_settings = get_response.json().get('settings', {})
            
            # Toggle quantityDiscountsEnabled value
            current_value = current_settings.get('quantityDiscountsEnabled', True)
            new_value = not current_value
            
            # Update settings with new quantityDiscountsEnabled value
            updated_settings = current_settings.copy()
            updated_settings['quantityDiscountsEnabled'] = new_value
            
            data = {
                "settings": updated_settings
            }
            
            put_response = requests.put(f"{self.backend_url}/admin/settings", json=data, headers=headers)
            
            if put_response.status_code == 200:
                result = put_response.json()
                if result.get('success'):
                    # Verify the update by getting settings again
                    verify_response = requests.get(f"{self.backend_url}/admin/settings", headers=headers)
                    if verify_response.status_code == 200:
                        verify_settings = verify_response.json().get('settings', {})
                        if verify_settings.get('quantityDiscountsEnabled') == new_value:
                            self.log_result(
                                "PUT Admin Settings - quantityDiscountsEnabled", 
                                True, 
                                f"quantityDiscountsEnabled successfully updated and persisted: {current_value} → {new_value}",
                                {"old_value": current_value, "new_value": new_value}
                            )
                            return True
                        else:
                            self.log_result(
                                "PUT Admin Settings - quantityDiscountsEnabled", 
                                False, 
                                "quantityDiscountsEnabled update not persisted correctly"
                            )
                            return False
                    else:
                        self.log_result(
                            "PUT Admin Settings - quantityDiscountsEnabled", 
                            False, 
                            "Cannot verify update - verification request failed"
                        )
                        return False
                else:
                    self.log_result(
                        "PUT Admin Settings - quantityDiscountsEnabled", 
                        False, 
                        "Update response success flag is False"
                    )
                    return False
            else:
                self.log_result(
                    "PUT Admin Settings - quantityDiscountsEnabled", 
                    False, 
                    f"HTTP {put_response.status_code}: {put_response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "PUT Admin Settings - quantityDiscountsEnabled", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return False
    
    def test_order_creation_with_promo_code_unlimited(self):
        """Test: Create order with promo code UNLIMITED and verify it appears in order_details.txt"""
        print("\n=== Testing Order Creation with Promo Code UNLIMITED ===")
        
        # Test data with promo code UNLIMITED (5% discount)
        order_details = {
            "contactInfo": {
                "fullName": "Promo Test Korisnik",
                "email": "promo@example.com",
                "phone": "0641234567",
                "street": "Testna ulica 123",
                "postalCode": "11000",
                "city": "Beograd",
                "notes": "Test promo code UNLIMITED"
            },
            "photoSettings": [
                {
                    "fileName": "promo_test1.jpg",
                    "format": "10x15",
                    "quantity": 10,
                    "finish": "sjajni"
                },
                {
                    "fileName": "promo_test2.jpg",
                    "format": "13x18",
                    "quantity": 5,
                    "finish": "mat"
                }
            ],
            "promoCode": "UNLIMITED",
            "promoCodeDiscount": 5,
            "promoCodeDiscountAmount": 22.5,  # 5% of 450 RSD (10*18 + 5*25 = 305 RSD base price)
            "totalPrice": 450,
            "grandTotal": 427.5,
            "deliveryFee": 400
        }
        
        try:
            # Create test images
            photo1_data, _ = self.create_test_image("promo_test1.jpg", 2)
            photo2_data, _ = self.create_test_image("promo_test2.jpg", 2)
            
            files = [
                ('photos', ('promo_test1.jpg', photo1_data, 'image/jpeg')),
                ('photos', ('promo_test2.jpg', photo2_data, 'image/jpeg'))
            ]
            
            data = {
                'order_details': json.dumps(order_details)
            }
            
            # Create order
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code != 200:
                self.log_result(
                    "Order Creation with Promo Code UNLIMITED", 
                    False, 
                    f"Order creation failed: HTTP {response.status_code}: {response.text}"
                )
                return None
            
            result = response.json()
            if not result.get('success'):
                self.log_result(
                    "Order Creation with Promo Code UNLIMITED", 
                    False, 
                    "Order creation success flag is False"
                )
                return None
            
            order_number = result['orderNumber']
            
            # Verify order contains promo code data
            order_response = requests.get(f"{self.backend_url}/orders/{order_number}")
            if order_response.status_code != 200:
                self.log_result(
                    "Order Creation with Promo Code UNLIMITED", 
                    False, 
                    f"Cannot retrieve order for verification: HTTP {order_response.status_code}"
                )
                return None
            
            order_data = order_response.json()
            
            # Check promo code fields in database
            promo_code = order_data.get('promoCode')
            promo_discount = order_data.get('promoCodeDiscount')
            promo_amount = order_data.get('promoCodeDiscountAmount')
            
            if promo_code != "UNLIMITED":
                self.log_result(
                    "Order Creation with Promo Code UNLIMITED", 
                    False, 
                    f"Promo code not saved correctly: expected 'UNLIMITED', got '{promo_code}'"
                )
                return None
            
            if promo_discount != 5:
                self.log_result(
                    "Order Creation with Promo Code UNLIMITED", 
                    False, 
                    f"Promo discount not saved correctly: expected 5, got {promo_discount}"
                )
                return None
            
            self.log_result(
                "Order Creation with Promo Code UNLIMITED", 
                True, 
                f"Order created successfully with promo code: {order_number}",
                {
                    "promo_code": promo_code,
                    "promo_discount": promo_discount,
                    "promo_amount": promo_amount,
                    "total_photos": 15
                }
            )
            return order_number
                
        except Exception as e:
            self.log_result(
                "Order Creation with Promo Code UNLIMITED", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return None
    
    def test_order_text_file_contains_promo_code(self, order_number):
        """Test: Verify order ZIP contains order_details.txt with promo code information"""
        print("\n=== Testing Order Text File Contains Promo Code ===")
        
        if not order_number:
            self.log_result(
                "Order Text File Contains Promo Code", 
                False, 
                "No order number provided (previous test failed)"
            )
            return
        
        if not self.admin_token:
            login_success = self.admin_login()
            if not login_success:
                self.log_result(
                    "Order Text File Contains Promo Code", 
                    False, 
                    "Cannot test - admin login failed"
                )
                return
        
        try:
            # Download ZIP file
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            zip_response = requests.get(f"{self.backend_url}/admin/orders/{order_number}/download", headers=headers)
            
            if zip_response.status_code != 200:
                self.log_result(
                    "Order Text File Contains Promo Code", 
                    False, 
                    f"ZIP download failed: HTTP {zip_response.status_code}"
                )
                return
            
            # Save ZIP to temporary file and analyze content
            with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as temp_zip:
                temp_zip.write(zip_response.content)
                temp_zip_path = temp_zip.name
            
            try:
                # Analyze ZIP content
                with zipfile.ZipFile(temp_zip_path, 'r') as zipf:
                    file_list = zipf.namelist()
                    
                    # Check if order_details.txt exists
                    if 'order_details.txt' not in file_list:
                        self.log_result(
                            "Order Text File Contains Promo Code", 
                            False, 
                            "order_details.txt not found in ZIP file",
                            {"zip_files": file_list}
                        )
                        return
                    
                    # Read order_details.txt content
                    order_details_content = zipf.read('order_details.txt').decode('utf-8')
                    
                    # Check for promo code information
                    promo_checks = [
                        'PROMO KOD "UNLIMITED" (5%)',  # Expected format
                        'UNLIMITED',  # Promo code name
                        '5%'  # Discount percentage
                    ]
                    
                    missing_promo_info = []
                    for check in promo_checks:
                        if check not in order_details_content:
                            missing_promo_info.append(check)
                    
                    # Check for discount amount (should be negative value)
                    promo_discount_found = False
                    lines = order_details_content.split('\n')
                    for line in lines:
                        if 'UNLIMITED' in line and '-' in line and 'RSD' in line:
                            promo_discount_found = True
                            break
                    
                    if missing_promo_info:
                        self.log_result(
                            "Order Text File Contains Promo Code", 
                            False, 
                            f"Promo code information missing from order_details.txt: {missing_promo_info}",
                            {"content_preview": order_details_content[:500] + "..."}
                        )
                        return
                    
                    if not promo_discount_found:
                        self.log_result(
                            "Order Text File Contains Promo Code", 
                            False, 
                            "Promo code discount amount not found in order_details.txt",
                            {"content_preview": order_details_content[:500] + "..."}
                        )
                        return
                    
                    # Check for total savings section
                    total_savings_found = 'UKUPNO ZA NAPLATU' in order_details_content or 'UKUPNO ZA PLAĆANJE' in order_details_content
                    
                    if not total_savings_found:
                        self.log_result(
                            "Order Text File Contains Promo Code", 
                            False, 
                            "Total payment section not found in order_details.txt"
                        )
                        return
                    
                    self.log_result(
                        "Order Text File Contains Promo Code", 
                        True, 
                        f"✅ Order text file correctly contains promo code information for order {order_number}",
                        {
                            "promo_code_section": "PROMO KOD \"UNLIMITED\" (5%) found",
                            "discount_amount": "Negative RSD amount found",
                            "total_section": "UKUPNO ZA PLAĆANJE section present"
                        }
                    )
                    
            finally:
                # Clean up temp file
                os.unlink(temp_zip_path)
                
        except Exception as e:
            self.log_result(
                "Order Text File Contains Promo Code", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
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
        """Run all tests in sequence"""
        print("=" * 80)
        print("PHOTO PRINTING SERVICE - SPECIFIC FEATURE TESTING")
        print("Testing UI and feature updates as per review request")
        print("=" * 80)
        
        # Test 1: API Connectivity
        self.test_api_connectivity()
        
        # Test 2: Admin Login with provided credentials
        admin_login_success = self.admin_login()
        
        # Test 3: GET /api/settings - quantityDiscountsEnabled field
        self.test_get_settings_quantity_discounts_enabled()
        
        # Test 4: PUT /api/admin/settings - quantityDiscountsEnabled field
        if admin_login_success:
            self.test_put_admin_settings_quantity_discounts_enabled()
        
        # Test 5: Order creation with promo code UNLIMITED
        promo_order_number = self.test_order_creation_with_promo_code_unlimited()
        
        # Test 6: Verify order text file contains promo code
        if promo_order_number and admin_login_success:
            self.test_order_text_file_contains_promo_code(promo_order_number)
        
        # Summary
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\nDETAILED RESULTS:")
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status}: {result['test']} - {result['message']}")
        
        if failed_tests > 0:
            print(f"\n⚠️  {failed_tests} test(s) failed. Please review the issues above.")
        else:
            print("\n🎉 All tests passed successfully!")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = PhotoPrintingServiceTester()
    passed, failed = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if failed == 0 else 1)