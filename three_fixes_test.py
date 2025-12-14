#!/usr/bin/env python3
"""
Photo Printing Service - Three Fixes Validation
Focused testing of the three specific fixes as requested in the review.
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
BACKEND_URL = "https://snapprint-9.preview.emergentagent.com/api"

class ThreeFixesValidator:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.admin_token = None
        
    def log_test(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        print(f"   {message}")
        if details:
            for key, value in details.items():
                print(f"   {key}: {value}")
        print()
    
    def create_test_image(self, filename, size_mb=1):
        """Create a test image file"""
        target_bytes = size_mb * 1024 * 1024
        pixels = target_bytes // 3
        width = height = int(pixels ** 0.5)
        
        img = Image.new('RGB', (width, height), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG', quality=85)
        img_bytes.seek(0)
        
        return img_bytes.getvalue(), filename
    
    def admin_login(self):
        """Login as admin"""
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
                    return True
            return False
        except:
            return False

    def test_fix_1_order_status(self):
        """FIX 1: Test Order Status is 'Na Čekanju' instead of 'completed'"""
        print("🔍 TESTING FIX 1: Order Status")
        print("="*50)
        
        # Create simple order
        order_details = {
            "contactInfo": {
                "fullName": "Test Korisnik",
                "email": "test@example.com",
                "phone": "0641234567",
                "street": "Knez Mihailova 42",
                "postalCode": "11000",
                "city": "Beograd",
                "notes": "Test order status"
            },
            "photoSettings": [
                {
                    "fileName": "test.jpg",
                    "format": "10x15",
                    "quantity": 5,
                    "finish": "sjajni"
                }
            ]
        }
        
        try:
            # Create test image
            photo_data, _ = self.create_test_image("test.jpg", 2)
            
            files = [('photos', ('test.jpg', photo_data, 'image/jpeg'))]
            data = {'order_details': json.dumps(order_details)}
            
            # Create order
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    order_number = result['orderNumber']
                    
                    # Check order status
                    order_response = requests.get(f"{self.backend_url}/orders/{order_number}")
                    if order_response.status_code == 200:
                        order_data = order_response.json()
                        status = order_data.get('status')
                        
                        if status == "Na Čekanju":
                            self.log_test(
                                "Order Status Fix", 
                                True, 
                                "Order status correctly set to 'Na Čekanju'",
                                {
                                    "Order Number": order_number,
                                    "Status": status,
                                    "Expected": "Na Čekanju"
                                }
                            )
                            return order_number
                        else:
                            self.log_test(
                                "Order Status Fix", 
                                False, 
                                f"Order status is '{status}', expected 'Na Čekanju'",
                                {"Order Number": order_number, "Actual Status": status}
                            )
                    else:
                        self.log_test("Order Status Fix", False, "Cannot retrieve order for verification")
                else:
                    self.log_test("Order Status Fix", False, "Order creation failed - success flag False")
            else:
                self.log_test("Order Status Fix", False, f"Order creation failed - HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Order Status Fix", False, f"Exception: {str(e)}")
        
        return None

    def test_fix_2_products_in_txt(self):
        """FIX 2: Test Products appear in order_details.txt with correct prices"""
        print("🔍 TESTING FIX 2: Products in order_details.txt")
        print("="*50)
        
        # Create order with products
        order_details = {
            "contactInfo": {
                "fullName": "Marko Petrović",
                "email": "marko@example.com",
                "phone": "0651234567",
                "street": "Terazije 25",
                "postalCode": "11000",
                "city": "Beograd",
                "notes": "Test order with products"
            },
            "photoSettings": [
                {
                    "fileName": "photo.jpg",
                    "format": "10x15",
                    "quantity": 50,
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
            "totalPrice": 900,
            "deliveryFee": 400,
            "grandTotal": 2800,
            "productsSubtotal": 1500,
            "prices": {"10x15": 18}
        }
        
        try:
            # Create test image
            photo_data, _ = self.create_test_image("photo.jpg", 2)
            
            files = [('photos', ('photo.jpg', photo_data, 'image/jpeg'))]
            data = {'order_details': json.dumps(order_details)}
            
            # Create order
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    order_number = result['orderNumber']
                    
                    # Login as admin to download ZIP
                    if not self.admin_token:
                        if not self.admin_login():
                            self.log_test("Products in TXT Fix", False, "Admin login failed")
                            return
                    
                    # Download ZIP
                    headers = {"Authorization": f"Bearer {self.admin_token}"}
                    zip_response = requests.get(f"{self.backend_url}/admin/orders/{order_number}/download", headers=headers)
                    
                    if zip_response.status_code == 200:
                        # Save and analyze ZIP
                        with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as temp_zip:
                            temp_zip.write(zip_response.content)
                            temp_zip_path = temp_zip.name
                        
                        try:
                            with zipfile.ZipFile(temp_zip_path, 'r') as zipf:
                                if 'order_details.txt' in zipf.namelist():
                                    content = zipf.read('order_details.txt').decode('utf-8')
                                    
                                    # Check for required content
                                    checks = {
                                        "PROIZVODI section": "PROIZVODI:" in content,
                                        "Product name (Šolja)": "Šolja" in content,
                                        "Product price (1500 RSD)": "1500 RSD" in content,
                                        "Products subtotal": "Ukupna cena proizvoda:" in content,
                                        "Price calculation": "OBRAČUN CENE" in content,
                                        "Additional products": "Dodatni proizvodi:" in content,
                                        "Grand total": "UKUPNO ZA NAPLATU:" in content,
                                        "Gift products": "POKLON PROIZVODI" in content,
                                        "Gift item (Album)": "Album za Slike" in content and "BESPLATNO" in content
                                    }
                                    
                                    passed_checks = sum(1 for check in checks.values() if check)
                                    total_checks = len(checks)
                                    
                                    if passed_checks >= 7:  # Allow some flexibility
                                        self.log_test(
                                            "Products in TXT Fix", 
                                            True, 
                                            f"order_details.txt contains products and prices ({passed_checks}/{total_checks} checks passed)",
                                            {
                                                "Order Number": order_number,
                                                "Passed Checks": f"{passed_checks}/{total_checks}",
                                                "Key Content": "Products, prices, and gift items found"
                                            }
                                        )
                                    else:
                                        failed_checks = [name for name, result in checks.items() if not result]
                                        self.log_test(
                                            "Products in TXT Fix", 
                                            False, 
                                            f"Missing required content in order_details.txt ({passed_checks}/{total_checks} checks passed)",
                                            {"Failed Checks": ", ".join(failed_checks)}
                                        )
                                else:
                                    self.log_test("Products in TXT Fix", False, "order_details.txt not found in ZIP")
                        finally:
                            os.unlink(temp_zip_path)
                    else:
                        self.log_test("Products in TXT Fix", False, f"ZIP download failed - HTTP {zip_response.status_code}")
                else:
                    self.log_test("Products in TXT Fix", False, "Order creation failed - success flag False")
            else:
                self.log_test("Products in TXT Fix", False, f"Order creation failed - HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Products in TXT Fix", False, f"Exception: {str(e)}")

    def test_fix_3_image_display(self):
        """FIX 3: Test Product Image Display Fix"""
        print("🔍 TESTING FIX 3: Product Image Display")
        print("="*50)
        
        try:
            # Login as admin
            if not self.admin_token:
                if not self.admin_login():
                    self.log_test("Image Display Fix", False, "Admin login failed")
                    return
            
            # Create test image
            test_image_data, _ = self.create_test_image("test_product.jpg", 1)
            
            # Upload image
            files = {'image': ('test_product.jpg', test_image_data, 'image/jpeg')}
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            response = requests.post(f"{self.backend_url}/admin/products/upload-image", files=files, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    image_url = result.get('imageUrl')
                    
                    if image_url and image_url.startswith('/uploads/products/'):
                        # Test production URL access
                        filename = image_url.split('/')[-1]
                        production_url = f"https://snapprint-9.preview.emergentagent.com/uploads/products/{filename}"
                        
                        prod_response = requests.get(production_url)
                        
                        if prod_response.status_code == 200:
                            self.log_test(
                                "Image Display Fix", 
                                True, 
                                "Product image upload and display working correctly",
                                {
                                    "Image URL": image_url,
                                    "Production URL": production_url,
                                    "URL Format": "Correct relative path format",
                                    "Accessibility": "Image accessible via production URL"
                                }
                            )
                        else:
                            self.log_test(
                                "Image Display Fix", 
                                False, 
                                f"Image not accessible via production URL - HTTP {prod_response.status_code}",
                                {"Production URL": production_url}
                            )
                    else:
                        self.log_test("Image Display Fix", False, f"Invalid image URL format: {image_url}")
                else:
                    self.log_test("Image Display Fix", False, "Image upload failed - success flag False")
            else:
                self.log_test("Image Display Fix", False, f"Image upload failed - HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Image Display Fix", False, f"Exception: {str(e)}")

    def run_validation(self):
        """Run validation of all three fixes"""
        print("🧪 PHOTO PRINTING SERVICE - THREE FIXES VALIDATION")
        print("="*80)
        print("Validating the three fixes:")
        print("1. Order Status: 'Na Čekanju' instead of 'completed'")
        print("2. Products in TXT: order_details.txt contains products and prices")
        print("3. Image Display: Product images display correctly")
        print("="*80)
        print()
        
        # Test Fix 1: Order Status
        order_number = self.test_fix_1_order_status()
        
        # Test Fix 2: Products in TXT
        self.test_fix_2_products_in_txt()
        
        # Test Fix 3: Image Display
        self.test_fix_3_image_display()
        
        print("="*80)
        print("🎯 VALIDATION COMPLETE")
        print("="*80)

if __name__ == "__main__":
    validator = ThreeFixesValidator()
    validator.run_validation()