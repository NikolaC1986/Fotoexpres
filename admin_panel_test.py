#!/usr/bin/env python3
"""
Admin Panel Backend API Testing for Fotoexpres Photo Printing Application
Tests all admin panel functionality including authentication, order management, and settings.
"""

import requests
import json
import os
from pathlib import Path
from PIL import Image
import io

# Configuration
BACKEND_URL = "https://photo-print-app.preview.emergentagent.com/api"

# Admin credentials (as specified in review request)
ADMIN_USERNAME = "Vlasnik"
ADMIN_PASSWORD = "Fotoexpres2025!"

class AdminPanelTester:
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
        print(f"{status}: {test_name}")
        print(f"   {message}")
        if details:
            print(f"   Details: {details}")
    
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
    
    def create_test_order(self):
        """Helper: Create a test order for admin operations"""
        order_details = {
            "contactInfo": {
                "fullName": "Marko Petrović",
                "email": "marko.petrovic@example.com",
                "phone": "+381641234567",
                "address": "Kneza Miloša 15, Beograd, 11000",
                "notes": "Molim vas da slike budu sjajne"
            },
            "photoSettings": [
                {
                    "fileName": "porodica.jpg",
                    "format": "10x15",
                    "quantity": 5,
                    "finish": "glossy"
                },
                {
                    "fileName": "letovanje.jpg",
                    "format": "13x18",
                    "quantity": 2,
                    "finish": "matte"
                }
            ]
        }
        
        try:
            photo1_data, _ = self.create_test_image("porodica.jpg", 2)
            photo2_data, _ = self.create_test_image("letovanje.jpg", 3)
            
            files = [
                ('photos', ('porodica.jpg', photo1_data, 'image/jpeg')),
                ('photos', ('letovanje.jpg', photo2_data, 'image/jpeg'))
            ]
            
            data = {'order_details': json.dumps(order_details)}
            
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    return result['orderNumber']
            return None
        except Exception as e:
            print(f"   Error creating test order: {str(e)}")
            return None
    
    # ========== PRIORITY 1: ADMIN LOGIN API (CRITICAL) ==========
    
    def test_admin_login_correct_credentials(self):
        """Test 1.1: Admin Login - Correct Credentials (CRITICAL)"""
        print("\n=== Test 1.1: Admin Login - Correct Credentials ===")
        
        try:
            login_data = {
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            }
            
            response = requests.post(f"{self.backend_url}/admin/login", json=login_data)
            
            if response.status_code == 200:
                result = response.json()
                
                # Verify response structure
                if not result.get('success'):
                    self.log_result(
                        "Admin Login - Correct Credentials",
                        False,
                        "Login response has success=false",
                        {"response": result}
                    )
                    return False
                
                if not result.get('token'):
                    self.log_result(
                        "Admin Login - Correct Credentials",
                        False,
                        "Login response missing JWT token",
                        {"response": result}
                    )
                    return False
                
                # Store token for subsequent tests
                self.admin_token = result['token']
                
                self.log_result(
                    "Admin Login - Correct Credentials",
                    True,
                    f"Successfully logged in as {ADMIN_USERNAME}",
                    {"token_length": len(self.admin_token), "message": result.get('message')}
                )
                return True
            else:
                self.log_result(
                    "Admin Login - Correct Credentials",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Admin Login - Correct Credentials",
                False,
                f"Exception occurred: {str(e)}"
            )
            return False
    
    def test_admin_login_wrong_credentials(self):
        """Test 1.2: Admin Login - Wrong Credentials"""
        print("\n=== Test 1.2: Admin Login - Wrong Credentials ===")
        
        try:
            login_data = {
                "username": "WrongUser",
                "password": "WrongPassword123"
            }
            
            response = requests.post(f"{self.backend_url}/admin/login", json=login_data)
            
            if response.status_code == 401:
                self.log_result(
                    "Admin Login - Wrong Credentials",
                    True,
                    "Correctly rejected wrong credentials with 401",
                    {"response": response.text}
                )
            else:
                self.log_result(
                    "Admin Login - Wrong Credentials",
                    False,
                    f"Expected 401, got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Admin Login - Wrong Credentials",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    # ========== PRIORITY 2: ADMIN ORDERS API (CRITICAL) ==========
    
    def test_admin_orders_with_valid_token(self):
        """Test 2.1: Admin Orders - With Valid JWT Token (CRITICAL)"""
        print("\n=== Test 2.1: Admin Orders - With Valid JWT Token ===")
        
        if not self.admin_token:
            self.log_result(
                "Admin Orders - Valid Token",
                False,
                "No admin token available (login failed)"
            )
            return
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            response = requests.get(f"{self.backend_url}/admin/orders", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                
                # Verify response structure
                if 'orders' not in result:
                    self.log_result(
                        "Admin Orders - Valid Token",
                        False,
                        "Response missing 'orders' field",
                        {"response": result}
                    )
                    return
                
                if 'stats' not in result:
                    self.log_result(
                        "Admin Orders - Valid Token",
                        False,
                        "Response missing 'stats' field",
                        {"response": result}
                    )
                    return
                
                # Verify stats structure
                stats = result['stats']
                required_stats = ['total', 'pending', 'completed']
                missing_stats = [s for s in required_stats if s not in stats]
                
                if missing_stats:
                    self.log_result(
                        "Admin Orders - Valid Token",
                        False,
                        f"Stats missing fields: {missing_stats}",
                        {"stats": stats}
                    )
                    return
                
                self.log_result(
                    "Admin Orders - Valid Token",
                    True,
                    "Successfully retrieved orders with stats",
                    {
                        "total_orders": stats['total'],
                        "pending": stats['pending'],
                        "completed": stats['completed'],
                        "orders_count": len(result['orders'])
                    }
                )
            else:
                self.log_result(
                    "Admin Orders - Valid Token",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Admin Orders - Valid Token",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    def test_admin_orders_without_token(self):
        """Test 2.2: Admin Orders - Without Token"""
        print("\n=== Test 2.2: Admin Orders - Without Token ===")
        
        try:
            response = requests.get(f"{self.backend_url}/admin/orders")
            
            if response.status_code == 401:
                self.log_result(
                    "Admin Orders - Without Token",
                    True,
                    "Correctly returned 401 for missing token"
                )
            else:
                self.log_result(
                    "Admin Orders - Without Token",
                    False,
                    f"Expected 401, got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Admin Orders - Without Token",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    def test_admin_orders_with_invalid_token(self):
        """Test 2.3: Admin Orders - With Invalid Token"""
        print("\n=== Test 2.3: Admin Orders - With Invalid Token ===")
        
        try:
            headers = {
                "Authorization": "Bearer invalid_token_12345"
            }
            
            response = requests.get(f"{self.backend_url}/admin/orders", headers=headers)
            
            if response.status_code == 401:
                self.log_result(
                    "Admin Orders - Invalid Token",
                    True,
                    "Correctly returned 401 for invalid token"
                )
            else:
                self.log_result(
                    "Admin Orders - Invalid Token",
                    False,
                    f"Expected 401, got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Admin Orders - Invalid Token",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    # ========== PRIORITY 3: ADMIN ORDER MANAGEMENT ==========
    
    def test_admin_download_order_zip(self, order_number):
        """Test 3.1: Download Order ZIP"""
        print(f"\n=== Test 3.1: Download Order ZIP - {order_number} ===")
        
        if not self.admin_token:
            self.log_result(
                "Download Order ZIP",
                False,
                "No admin token available"
            )
            return
        
        if not order_number:
            self.log_result(
                "Download Order ZIP",
                False,
                "No order number provided"
            )
            return
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            response = requests.get(
                f"{self.backend_url}/admin/orders/{order_number}/download",
                headers=headers
            )
            
            if response.status_code == 200:
                # Verify it's a ZIP file
                content_type = response.headers.get('Content-Type', '')
                if 'zip' in content_type or 'application/zip' in content_type:
                    self.log_result(
                        "Download Order ZIP",
                        True,
                        f"Successfully downloaded ZIP for order {order_number}",
                        {"content_type": content_type, "size_bytes": len(response.content)}
                    )
                else:
                    self.log_result(
                        "Download Order ZIP",
                        False,
                        f"Response is not a ZIP file: {content_type}"
                    )
            elif response.status_code == 404:
                self.log_result(
                    "Download Order ZIP",
                    False,
                    f"Order or ZIP file not found: {response.text}"
                )
            else:
                self.log_result(
                    "Download Order ZIP",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Download Order ZIP",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    def test_admin_update_order_status(self, order_number):
        """Test 3.2: Update Order Status"""
        print(f"\n=== Test 3.2: Update Order Status - {order_number} ===")
        
        if not self.admin_token:
            self.log_result(
                "Update Order Status",
                False,
                "No admin token available"
            )
            return
        
        if not order_number:
            self.log_result(
                "Update Order Status",
                False,
                "No order number provided"
            )
            return
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            # Test updating to "processing"
            status_data = {"status": "processing"}
            
            response = requests.put(
                f"{self.backend_url}/admin/orders/{order_number}/status",
                headers=headers,
                json=status_data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log_result(
                        "Update Order Status",
                        True,
                        f"Successfully updated order {order_number} to 'processing'",
                        {"message": result.get('message')}
                    )
                else:
                    self.log_result(
                        "Update Order Status",
                        False,
                        "Update response has success=false"
                    )
            elif response.status_code == 404:
                self.log_result(
                    "Update Order Status",
                    False,
                    f"Order not found: {response.text}"
                )
            else:
                self.log_result(
                    "Update Order Status",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Update Order Status",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    def test_admin_delete_order(self, order_number):
        """Test 3.3: Delete Order"""
        print(f"\n=== Test 3.3: Delete Order - {order_number} ===")
        
        if not self.admin_token:
            self.log_result(
                "Delete Order",
                False,
                "No admin token available"
            )
            return
        
        if not order_number:
            self.log_result(
                "Delete Order",
                False,
                "No order number provided"
            )
            return
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            response = requests.delete(
                f"{self.backend_url}/admin/orders/{order_number}",
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log_result(
                        "Delete Order",
                        True,
                        f"Successfully deleted order {order_number}",
                        {"message": result.get('message')}
                    )
                else:
                    self.log_result(
                        "Delete Order",
                        False,
                        "Delete response has success=false"
                    )
            elif response.status_code == 404:
                self.log_result(
                    "Delete Order",
                    False,
                    f"Order not found: {response.text}"
                )
            else:
                self.log_result(
                    "Delete Order",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Delete Order",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    # ========== PRIORITY 4: ADMIN SETTINGS APIs ==========
    
    def test_admin_get_prices(self):
        """Test 4.1: Get Prices"""
        print("\n=== Test 4.1: Get Prices ===")
        
        if not self.admin_token:
            self.log_result(
                "Get Prices",
                False,
                "No admin token available"
            )
            return
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            response = requests.get(f"{self.backend_url}/admin/prices", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                
                if 'prices' not in result:
                    self.log_result(
                        "Get Prices",
                        False,
                        "Response missing 'prices' field",
                        {"response": result}
                    )
                    return
                
                prices = result['prices']
                
                self.log_result(
                    "Get Prices",
                    True,
                    "Successfully retrieved prices",
                    {"prices": prices}
                )
            else:
                self.log_result(
                    "Get Prices",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Get Prices",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    def test_admin_update_prices(self):
        """Test 4.2: Update Prices"""
        print("\n=== Test 4.2: Update Prices ===")
        
        if not self.admin_token:
            self.log_result(
                "Update Prices",
                False,
                "No admin token available"
            )
            return
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            # Test updating prices
            price_data = {
                "prices": {
                    '9x13': 12,
                    '10x15': 18,
                    '13x18': 25,
                    '15x21': 50,
                    '20x30': 150,
                    '30x45': 250
                }
            }
            
            response = requests.put(
                f"{self.backend_url}/admin/prices",
                headers=headers,
                json=price_data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log_result(
                        "Update Prices",
                        True,
                        "Successfully updated prices",
                        {"message": result.get('message')}
                    )
                else:
                    self.log_result(
                        "Update Prices",
                        False,
                        "Update response has success=false"
                    )
            else:
                self.log_result(
                    "Update Prices",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Update Prices",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    def test_admin_get_settings(self):
        """Test 4.3: Get Settings"""
        print("\n=== Test 4.3: Get Settings ===")
        
        if not self.admin_token:
            self.log_result(
                "Get Settings",
                False,
                "No admin token available"
            )
            return
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            response = requests.get(f"{self.backend_url}/admin/settings", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                
                if 'settings' not in result:
                    self.log_result(
                        "Get Settings",
                        False,
                        "Response missing 'settings' field",
                        {"response": result}
                    )
                    return
                
                settings = result['settings']
                
                self.log_result(
                    "Get Settings",
                    True,
                    "Successfully retrieved settings",
                    {"settings": settings}
                )
            else:
                self.log_result(
                    "Get Settings",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Get Settings",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    def test_admin_update_settings(self):
        """Test 4.4: Update Settings"""
        print("\n=== Test 4.4: Update Settings ===")
        
        if not self.admin_token:
            self.log_result(
                "Update Settings",
                False,
                "No admin token available"
            )
            return
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            # Test updating settings
            settings_data = {
                "settings": {
                    'freeDeliveryLimit': 5000,
                    'deliveryPrice': 400,
                    'contactPhone': '+381 65 46 000 46',
                    'contactEmail': 'kontakt@fotoexpres.rs'
                }
            }
            
            response = requests.put(
                f"{self.backend_url}/admin/settings",
                headers=headers,
                json=settings_data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log_result(
                        "Update Settings",
                        True,
                        "Successfully updated settings",
                        {"message": result.get('message')}
                    )
                else:
                    self.log_result(
                        "Update Settings",
                        False,
                        "Update response has success=false"
                    )
            else:
                self.log_result(
                    "Update Settings",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Update Settings",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    def test_admin_get_discounts(self):
        """Test 4.5: Get Discounts"""
        print("\n=== Test 4.5: Get Discounts ===")
        
        if not self.admin_token:
            self.log_result(
                "Get Discounts",
                False,
                "No admin token available"
            )
            return
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            response = requests.get(f"{self.backend_url}/admin/discounts", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                
                if 'discounts' not in result:
                    self.log_result(
                        "Get Discounts",
                        False,
                        "Response missing 'discounts' field",
                        {"response": result}
                    )
                    return
                
                discounts = result['discounts']
                
                self.log_result(
                    "Get Discounts",
                    True,
                    "Successfully retrieved discounts",
                    {"discounts": discounts}
                )
            else:
                self.log_result(
                    "Get Discounts",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Get Discounts",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    def test_admin_update_discounts(self):
        """Test 4.6: Update Discounts"""
        print("\n=== Test 4.6: Update Discounts ===")
        
        if not self.admin_token:
            self.log_result(
                "Update Discounts",
                False,
                "No admin token available"
            )
            return
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            # Test updating discounts
            discount_data = {
                "discounts": {
                    '50': 5,
                    '100': 10,
                    '200': 15
                }
            }
            
            response = requests.put(
                f"{self.backend_url}/admin/discounts",
                headers=headers,
                json=discount_data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log_result(
                        "Update Discounts",
                        True,
                        "Successfully updated discounts",
                        {"message": result.get('message')}
                    )
                else:
                    self.log_result(
                        "Update Discounts",
                        False,
                        "Update response has success=false"
                    )
            else:
                self.log_result(
                    "Update Discounts",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Update Discounts",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    def test_admin_get_promotion(self):
        """Test 4.7: Get Promotion"""
        print("\n=== Test 4.7: Get Promotion ===")
        
        if not self.admin_token:
            self.log_result(
                "Get Promotion",
                False,
                "No admin token available"
            )
            return
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            response = requests.get(f"{self.backend_url}/admin/promotion", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                
                if 'promotion' not in result:
                    self.log_result(
                        "Get Promotion",
                        False,
                        "Response missing 'promotion' field",
                        {"response": result}
                    )
                    return
                
                promotion = result['promotion']
                
                self.log_result(
                    "Get Promotion",
                    True,
                    "Successfully retrieved promotion",
                    {"promotion": promotion}
                )
            else:
                self.log_result(
                    "Get Promotion",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Get Promotion",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    def test_admin_update_promotion(self):
        """Test 4.8: Update Promotion"""
        print("\n=== Test 4.8: Update Promotion ===")
        
        if not self.admin_token:
            self.log_result(
                "Update Promotion",
                False,
                "No admin token available"
            )
            return
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            # Test updating promotion
            promotion_data = {
                "promotion": {
                    'isActive': True,
                    'format': 'all',
                    'discountPercent': 10,
                    'validUntil': '2025-12-31T23:59',
                    'message': '10% popusta na sve porudžbine!'
                }
            }
            
            response = requests.put(
                f"{self.backend_url}/admin/promotion",
                headers=headers,
                json=promotion_data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log_result(
                        "Update Promotion",
                        True,
                        "Successfully updated promotion",
                        {"message": result.get('message')}
                    )
                else:
                    self.log_result(
                        "Update Promotion",
                        False,
                        "Update response has success=false"
                    )
            else:
                self.log_result(
                    "Update Promotion",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Update Promotion",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    def run_all_tests(self):
        """Run all admin panel tests in priority order"""
        print("=" * 80)
        print("FOTOEXPRES ADMIN PANEL BACKEND API TESTING")
        print("=" * 80)
        print(f"Backend URL: {self.backend_url}")
        print(f"Admin Credentials: {ADMIN_USERNAME} / {ADMIN_PASSWORD}")
        print("=" * 80)
        
        # PRIORITY 1: Admin Login (CRITICAL)
        print("\n" + "=" * 80)
        print("PRIORITY 1: ADMIN LOGIN API (CRITICAL - JUST FIXED)")
        print("=" * 80)
        login_success = self.test_admin_login_correct_credentials()
        self.test_admin_login_wrong_credentials()
        
        if not login_success:
            print("\n❌ CRITICAL: Admin login failed. Cannot proceed with other tests.")
            self.print_summary()
            return
        
        # PRIORITY 2: Admin Orders API (CRITICAL)
        print("\n" + "=" * 80)
        print("PRIORITY 2: ADMIN ORDERS API (CRITICAL - WAS FAILING, NOW FIXED)")
        print("=" * 80)
        self.test_admin_orders_with_valid_token()
        self.test_admin_orders_without_token()
        self.test_admin_orders_with_invalid_token()
        
        # PRIORITY 3: Admin Order Management
        print("\n" + "=" * 80)
        print("PRIORITY 3: ADMIN ORDER MANAGEMENT")
        print("=" * 80)
        
        # Test with existing orders from review request
        print("\nTesting with existing order: ORD-869094")
        self.test_admin_download_order_zip("ORD-869094")
        self.test_admin_update_order_status("ORD-869094")
        
        print("\nTesting with existing order: ORD-888952")
        self.test_admin_download_order_zip("ORD-888952")
        self.test_admin_update_order_status("ORD-888952")
        
        # Create a new order for delete test
        print("\nCreating new order for delete test...")
        new_order = self.create_test_order()
        if new_order:
            print(f"Created test order: {new_order}")
            self.test_admin_delete_order(new_order)
        else:
            print("Failed to create test order for delete test")
        
        # PRIORITY 4: Admin Settings APIs
        print("\n" + "=" * 80)
        print("PRIORITY 4: ADMIN SETTINGS APIs")
        print("=" * 80)
        self.test_admin_get_prices()
        self.test_admin_update_prices()
        self.test_admin_get_settings()
        self.test_admin_update_settings()
        self.test_admin_get_discounts()
        self.test_admin_update_discounts()
        self.test_admin_get_promotion()
        self.test_admin_update_promotion()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        failed = total - passed
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if failed > 0:
            print("\n" + "=" * 80)
            print("FAILED TESTS:")
            print("=" * 80)
            for result in self.test_results:
                if not result['success']:
                    print(f"\n❌ {result['test']}")
                    print(f"   {result['message']}")
                    if result['details']:
                        print(f"   Details: {result['details']}")
        
        print("\n" + "=" * 80)
        print("PASSED TESTS:")
        print("=" * 80)
        for result in self.test_results:
            if result['success']:
                print(f"✅ {result['test']}")

if __name__ == "__main__":
    tester = AdminPanelTester()
    tester.run_all_tests()
