#!/usr/bin/env python3
"""
Photo Printing Service - Three Fixes Testing
Tests the three specific fixes as requested:
1. Order Status Fix: Orders should be "Na Čekanju" instead of "completed"
2. Products in TXT Fix: order_details.txt should contain products and correct prices
3. Image Display Fix: Product images should display correctly
"""

import requests
import json
import os
import tempfile
import zipfile
from pathlib import Path
from PIL import Image
import io
import time

# Configuration
BACKEND_URL = "https://photogift-admin.preview.emergentagent.com/api"

class PhotoPrintingFixesTester:
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

    def test_phase1_order_status_fix(self):
        """PHASE 1: Test Order Status Fix - Orders should be 'Na Čekanju' not 'completed'"""
        print("\n" + "="*80)
        print("PHASE 1: ORDER STATUS FIX TESTING")
        print("="*80)
        
        # Test 1: Create simple order with photos
        print("\n=== Test 1: Create Order and Verify Status ===")
        
        order_details = {
            "contactInfo": {
                "fullName": "Marko Petrović",
                "email": "marko@example.com",
                "phone": "0641234567",
                "street": "Knez Mihailova 42",
                "postalCode": "11000",
                "city": "Beograd",
                "notes": "Test order status fix"
            },
            "photoSettings": [
                {
                    "fileName": "test1.jpg",
                    "format": "10x15",
                    "quantity": 5,
                    "finish": "sjajni"
                },
                {
                    "fileName": "test2.jpg",
                    "format": "13x18",
                    "quantity": 3,
                    "finish": "mat"
                }
            ]
        }
        
        try:
            # Create test images
            photo1_data, _ = self.create_test_image("test1.jpg", 2)
            photo2_data, _ = self.create_test_image("test2.jpg", 2)
            
            files = [
                ('photos', ('test1.jpg', photo1_data, 'image/jpeg')),
                ('photos', ('test2.jpg', photo2_data, 'image/jpeg'))
            ]
            
            data = {
                'order_details': json.dumps(order_details)
            }
            
            # Create order
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code != 200:
                self.log_result(
                    "Phase 1 - Order Creation", 
                    False, 
                    f"Order creation failed: HTTP {response.status_code}: {response.text}"
                )
                return None
            
            result = response.json()
            if not result.get('success'):
                self.log_result(
                    "Phase 1 - Order Creation", 
                    False, 
                    "Order creation success flag is False"
                )
                return None
            
            order_number = result['orderNumber']
            
            # Verify order status in MongoDB by retrieving the order
            print(f"\n=== Test 2: Verify Order Status for {order_number} ===")
            
            order_response = requests.get(f"{self.backend_url}/orders/{order_number}")
            if order_response.status_code != 200:
                self.log_result(
                    "Phase 1 - Order Status Check", 
                    False, 
                    f"Cannot retrieve order: HTTP {order_response.status_code}"
                )
                return None
            
            order_data = order_response.json()
            order_status = order_data.get('status')
            
            if order_status == "Na Čekanju":
                self.log_result(
                    "Phase 1 - Order Status Fix", 
                    True, 
                    f"✅ Order status correctly set to 'Na Čekanju' (not 'completed')",
                    {
                        "order_number": order_number,
                        "status": order_status,
                        "expected": "Na Čekanju"
                    }
                )
            else:
                self.log_result(
                    "Phase 1 - Order Status Fix", 
                    False, 
                    f"❌ Order status is '{order_status}', expected 'Na Čekanju'",
                    {
                        "order_number": order_number,
                        "actual_status": order_status,
                        "expected_status": "Na Čekanju"
                    }
                )
            
            return order_number
            
        except Exception as e:
            self.log_result(
                "Phase 1 - Order Status Fix", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return None

    def test_phase1_multiple_orders_status(self):
        """PHASE 1: Test Multiple Orders All Have Correct Status"""
        print("\n=== Test 3: Create Multiple Orders and Verify All Have 'Na Čekanju' Status ===")
        
        created_orders = []
        
        for i in range(2):  # Reduce to 2 orders to avoid rate limiting
            order_details = {
                "contactInfo": {
                    "fullName": f"Test User {i+1}",
                    "email": f"test{i+1}@example.com",
                    "phone": f"064123456{i}",
                    "street": f"Test Street {i+1}",
                    "postalCode": "11000",
                    "city": "Beograd",
                    "notes": f"Test order {i+1} for status verification"
                },
                "photoSettings": [
                    {
                        "fileName": f"photo{i+1}.jpg",
                        "format": "10x15",
                        "quantity": 2,
                        "finish": "sjajni"
                    }
                ]
            }
            
            try:
                # Create test image
                photo_data, _ = self.create_test_image(f"photo{i+1}.jpg", 1)
                
                files = [
                    ('photos', (f'photo{i+1}.jpg', photo_data, 'image/jpeg'))
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
                        created_orders.append(order_number)
                        print(f"   Created order {i+1}: {order_number}")
                    else:
                        print(f"   Failed to create order {i+1}: success flag False")
                else:
                    print(f"   Failed to create order {i+1}: HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"   Exception creating order {i+1}: {str(e)}")
        
        # Verify all orders have correct status
        all_correct = True
        status_results = []
        
        for order_number in created_orders:
            try:
                order_response = requests.get(f"{self.backend_url}/orders/{order_number}")
                if order_response.status_code == 200:
                    order_data = order_response.json()
                    status = order_data.get('status')
                    status_results.append({
                        "order": order_number,
                        "status": status,
                        "correct": status == "Na Čekanju"
                    })
                    if status != "Na Čekanju":
                        all_correct = False
                else:
                    all_correct = False
                    status_results.append({
                        "order": order_number,
                        "status": "ERROR",
                        "correct": False
                    })
            except Exception as e:
                all_correct = False
                status_results.append({
                    "order": order_number,
                    "status": f"EXCEPTION: {str(e)}",
                    "correct": False
                })
        
        if all_correct and len(created_orders) == 3:
            self.log_result(
                "Phase 1 - Multiple Orders Status", 
                True, 
                f"✅ All {len(created_orders)} orders have correct status 'Na Čekanju'",
                {"orders": status_results}
            )
        else:
            self.log_result(
                "Phase 1 - Multiple Orders Status", 
                False, 
                f"❌ Not all orders have correct status. Created: {len(created_orders)}, All correct: {all_correct}",
                {"orders": status_results}
            )

    def test_phase2_products_in_txt_fix(self):
        """PHASE 2: Test Products in order_details.txt Fix"""
        print("\n" + "="*80)
        print("PHASE 2: PRODUCTS IN TXT FIX TESTING")
        print("="*80)
        
        # Test 1: Create order with products
        print("\n=== Test 1: Create Order with Photos + Products ===")
        
        order_details = {
            "contactInfo": {
                "fullName": "Ana Marković",
                "email": "ana@example.com",
                "phone": "0651234567",
                "street": "Terazije 25",
                "postalCode": "11000",
                "city": "Beograd",
                "notes": "Test order with products"
            },
            "photoSettings": [
                {
                    "fileName": "photo1.jpg",
                    "format": "10x15",
                    "quantity": 50,  # 50 photos
                    "finish": "sjajni"
                }
            ],
            "products": [
                {
                    "productId": "solja_001",
                    "variantId": "solja_variant_1",
                    "productName": "Šolja",
                    "productType": "mug",
                    "variantName": "Bela šolja 350ml",
                    "quantity": 1,
                    "price": 1500,
                    "customText": "",
                    "dedicatedPhotoCount": 0
                }
            ],
            "giftProducts": [
                {
                    "productId": "album_001",
                    "variantId": "album_variant_1",
                    "productName": "Album za Slike",
                    "productType": "album",
                    "variantName": "Album 20x30cm",
                    "quantity": 1,
                    "price": 0,
                    "customText": "",
                    "dedicatedPhotoCount": 0
                }
            ],
            "totalPrice": 900,  # 50 photos * 18 RSD
            "deliveryFee": 400,
            "grandTotal": 2800,  # 900 (photos) + 1500 (šolja) + 400 (delivery) = 2800
            "productsSubtotal": 1500,
            "prices": {
                "10x15": 18
            }
        }
        
        try:
            # Create test image
            photo_data, _ = self.create_test_image("photo1.jpg", 2)
            
            files = [
                ('photos', ('photo1.jpg', photo_data, 'image/jpeg'))
            ]
            
            data = {
                'order_details': json.dumps(order_details)
            }
            
            # Create order
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code != 200:
                self.log_result(
                    "Phase 2 - Order with Products Creation", 
                    False, 
                    f"Order creation failed: HTTP {response.status_code}: {response.text}"
                )
                return None
            
            result = response.json()
            if not result.get('success'):
                self.log_result(
                    "Phase 2 - Order with Products Creation", 
                    False, 
                    "Order creation success flag is False"
                )
                return None
            
            order_number = result['orderNumber']
            
            # Login as admin to download ZIP
            if not self.admin_token:
                login_success = self.admin_login()
                if not login_success:
                    self.log_result(
                        "Phase 2 - Products in TXT", 
                        False, 
                        "Cannot test - admin login failed"
                    )
                    return None
            
            # Test 2: Extract and verify order_details.txt
            print(f"\n=== Test 2: Extract and Verify order_details.txt for {order_number} ===")
            
            # Download ZIP file
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            zip_response = requests.get(f"{self.backend_url}/admin/orders/{order_number}/download", headers=headers)
            
            if zip_response.status_code != 200:
                self.log_result(
                    "Phase 2 - ZIP Download", 
                    False, 
                    f"ZIP download failed: HTTP {zip_response.status_code}"
                )
                return None
            
            # Save ZIP to temporary file and analyze content
            with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as temp_zip:
                temp_zip.write(zip_response.content)
                temp_zip_path = temp_zip.name
            
            try:
                # Extract and check order_details.txt content
                with zipfile.ZipFile(temp_zip_path, 'r') as zipf:
                    if 'order_details.txt' not in zipf.namelist():
                        self.log_result(
                            "Phase 2 - Products in TXT", 
                            False, 
                            "order_details.txt not found in ZIP"
                        )
                        return None
                    
                    order_details_content = zipf.read('order_details.txt').decode('utf-8')
                    
                    # Validation criteria for TXT
                    validation_results = {
                        "proizvodi_section": "PROIZVODI:" in order_details_content,
                        "product_name": "Šolja" in order_details_content and "Bela šolja 350ml" in order_details_content,
                        "product_price": "1500 RSD" in order_details_content,
                        "ukupna_cena_proizvoda": "Ukupna cena proizvoda:" in order_details_content,
                        "obracun_cene": "OBRAČUN CENE" in order_details_content or "OBRAČUN CENE:" in order_details_content,
                        "dodatni_proizvodi": "Dodatni proizvodi:" in order_details_content,
                        "ukupno_za_naplatu": "UKUPNO ZA NAPLATU:" in order_details_content,
                        "poklon_proizvodi": "POKLON PROIZVODI" in order_details_content,
                        "gift_product": "Album za Slike" in order_details_content and "BESPLATNO" in order_details_content
                    }
                    
                    # Check if all critical validations pass
                    critical_checks = [
                        "proizvodi_section", "product_name", "product_price", 
                        "obracun_cene", "ukupno_za_naplatu"
                    ]
                    
                    all_critical_pass = all(validation_results[check] for check in critical_checks)
                    
                    if all_critical_pass:
                        self.log_result(
                            "Phase 2 - Products in TXT Fix", 
                            True, 
                            f"✅ order_details.txt contains products and correct prices",
                            {
                                "order_number": order_number,
                                "validations": validation_results,
                                "content_sample": order_details_content[:500] + "..." if len(order_details_content) > 500 else order_details_content
                            }
                        )
                    else:
                        failed_checks = [check for check in critical_checks if not validation_results[check]]
                        self.log_result(
                            "Phase 2 - Products in TXT Fix", 
                            False, 
                            f"❌ order_details.txt missing required content. Failed: {failed_checks}",
                            {
                                "order_number": order_number,
                                "validations": validation_results,
                                "content": order_details_content
                            }
                        )
                    
                    return order_number
                    
            finally:
                # Clean up temp file
                os.unlink(temp_zip_path)
                
        except Exception as e:
            self.log_result(
                "Phase 2 - Products in TXT Fix", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return None

    def test_phase3_image_display_fix(self):
        """PHASE 3: Test Product Image Display Fix"""
        print("\n" + "="*80)
        print("PHASE 3: PRODUCT IMAGE DISPLAY FIX TESTING")
        print("="*80)
        
        # Test 1: Upload new product image
        print("\n=== Test 1: Upload Product Image ===")
        
        if not self.admin_token:
            login_success = self.admin_login()
            if not login_success:
                self.log_result(
                    "Phase 3 - Image Upload", 
                    False, 
                    "Cannot test - admin login failed"
                )
                return None
        
        try:
            # Create a test product image
            test_image_data, _ = self.create_test_image("test_product.jpg", 1)
            
            files = {
                'image': ('test_product.jpg', test_image_data, 'image/jpeg')
            }
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Upload image via admin endpoint
            response = requests.post(f"{self.backend_url}/admin/products/upload-image", files=files, headers=headers)
            
            if response.status_code != 200:
                self.log_result(
                    "Phase 3 - Image Upload", 
                    False, 
                    f"Image upload failed: HTTP {response.status_code}: {response.text}"
                )
                return None
            
            result = response.json()
            if not result.get('success'):
                self.log_result(
                    "Phase 3 - Image Upload", 
                    False, 
                    "Image upload success flag is False"
                )
                return None
            
            image_url = result.get('imageUrl')
            if not image_url:
                self.log_result(
                    "Phase 3 - Image Upload", 
                    False, 
                    "Image upload response missing imageUrl"
                )
                return None
            
            # Verify image URL format
            if image_url.startswith('/uploads/products/') and image_url.endswith('.jpg'):
                self.log_result(
                    "Phase 3 - Image Upload", 
                    True, 
                    f"✅ Image uploaded successfully with correct URL format",
                    {
                        "image_url": image_url,
                        "format": "relative path /uploads/products/UUID.jpg"
                    }
                )
            else:
                self.log_result(
                    "Phase 3 - Image Upload", 
                    False, 
                    f"❌ Image URL format incorrect: {image_url}"
                )
                return None
            
            # Test 2: Verify image stored on disk
            print("\n=== Test 2: Verify Image Stored on Disk ===")
            
            # Extract filename from URL
            filename = image_url.split('/')[-1]
            
            # Check if we can access the image via the backend
            image_access_url = f"{self.backend_url}/uploads/products/{filename}"
            image_response = requests.get(image_access_url)
            
            if image_response.status_code == 200:
                self.log_result(
                    "Phase 3 - Image Storage", 
                    True, 
                    f"✅ Image accessible via backend URL",
                    {
                        "access_url": image_access_url,
                        "content_type": image_response.headers.get('content-type'),
                        "size": len(image_response.content)
                    }
                )
            else:
                self.log_result(
                    "Phase 3 - Image Storage", 
                    False, 
                    f"❌ Image not accessible: HTTP {image_response.status_code}"
                )
            
            # Test 3: Test image accessibility via production URL
            print("\n=== Test 3: Test Image Accessibility via Production URL ===")
            
            production_url = f"https://photogift-admin.preview.emergentagent.com/uploads/products/{filename}"
            prod_response = requests.get(production_url)
            
            if prod_response.status_code == 200:
                self.log_result(
                    "Phase 3 - Production Image Access", 
                    True, 
                    f"✅ Image accessible via production URL",
                    {
                        "production_url": production_url,
                        "content_type": prod_response.headers.get('content-type')
                    }
                )
            else:
                self.log_result(
                    "Phase 3 - Production Image Access", 
                    False, 
                    f"❌ Image not accessible via production URL: HTTP {prod_response.status_code}"
                )
            
            # Test 4: Verify getImageUrl helper function behavior
            print("\n=== Test 4: Verify Image URL Handling ===")
            
            # Test both relative and absolute URL scenarios
            test_scenarios = [
                {
                    "name": "Relative URL",
                    "input": image_url,
                    "expected_accessible": True
                },
                {
                    "name": "Full URL", 
                    "input": production_url,
                    "expected_accessible": True
                }
            ]
            
            url_handling_success = True
            
            for scenario in test_scenarios:
                try:
                    test_response = requests.get(scenario["input"])
                    accessible = test_response.status_code == 200
                    
                    if accessible == scenario["expected_accessible"]:
                        print(f"   ✅ {scenario['name']}: {scenario['input']} - Accessible: {accessible}")
                    else:
                        print(f"   ❌ {scenario['name']}: {scenario['input']} - Expected: {scenario['expected_accessible']}, Got: {accessible}")
                        url_handling_success = False
                        
                except Exception as e:
                    print(f"   ❌ {scenario['name']}: Exception - {str(e)}")
                    url_handling_success = False
            
            if url_handling_success:
                self.log_result(
                    "Phase 3 - Image Display Fix", 
                    True, 
                    f"✅ Product image display fix working correctly",
                    {
                        "uploaded_image": image_url,
                        "backend_accessible": True,
                        "production_accessible": True,
                        "url_format": "Both relative and absolute URLs work"
                    }
                )
            else:
                self.log_result(
                    "Phase 3 - Image Display Fix", 
                    False, 
                    f"❌ Image URL handling has issues"
                )
            
            return image_url
            
        except Exception as e:
            self.log_result(
                "Phase 3 - Image Display Fix", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return None

    def run_all_tests(self):
        """Run all three phases of testing"""
        print("🧪 PHOTO PRINTING SERVICE - THREE FIXES TESTING")
        print("="*80)
        print("Testing fixes for:")
        print("1. Order Status: 'Na Čekanju' instead of 'completed'")
        print("2. Products in TXT: order_details.txt contains products and prices")
        print("3. Image Display: Product images display correctly")
        print("="*80)
        
        # Phase 1: Order Status Fix
        order_number = self.test_phase1_order_status_fix()
        self.test_phase1_multiple_orders_status()
        
        # Phase 2: Products in TXT Fix
        self.test_phase2_products_in_txt_fix()
        
        # Phase 3: Image Display Fix
        self.test_phase3_image_display_fix()
        
        # Summary
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        
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
            print(f"{status}: {result['test']}")
            if not result['success']:
                print(f"   Error: {result['message']}")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = PhotoPrintingFixesTester()
    passed, failed = tester.run_all_tests()
    
    if failed == 0:
        print(f"\n🎉 ALL TESTS PASSED! All three fixes are working correctly.")
        exit(0)
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please review the issues above.")
        exit(1)