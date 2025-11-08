#!/usr/bin/env python3
"""
Backend API Testing for Photo Printing Order Management System
Tests all endpoints and functionality as specified in the review request.
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
BACKEND_URL = "https://print-admin-panel.preview.emergentagent.com/api"

class PhotoOrderTester:
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
    
    def test_order_creation_success(self):
        """Test 1: Order Creation - Success Case"""
        print("\n=== Testing Order Creation - Success Case ===")
        
        # Test data as specified in review request
        order_details = {
            "contactInfo": {
                "fullName": "Test User",
                "email": "test@example.com",
                "phone": "+381661234567",
                "address": "123 Test Street, Belgrade, 11000",
                "notes": "Please handle with care"
            },
            "photoSettings": [
                {
                    "fileName": "photo1.jpg",
                    "format": "10x15",
                    "quantity": 2,
                    "finish": "glossy"
                },
                {
                    "fileName": "photo2.jpg",
                    "format": "13x18",
                    "quantity": 1,
                    "finish": "matte"
                },
                {
                    "fileName": "photo3.jpg",
                    "format": "20x30",
                    "quantity": 3,
                    "finish": "glossy"
                }
            ]
        }
        
        try:
            # Create test images
            photo1_data, _ = self.create_test_image("photo1.jpg", 2)
            photo2_data, _ = self.create_test_image("photo2.jpg", 3)
            photo3_data, _ = self.create_test_image("photo3.jpg", 5)
            
            # Prepare multipart form data
            files = [
                ('photos', ('photo1.jpg', photo1_data, 'image/jpeg')),
                ('photos', ('photo2.jpg', photo2_data, 'image/jpeg')),
                ('photos', ('photo3.jpg', photo3_data, 'image/jpeg'))
            ]
            
            data = {
                'order_details': json.dumps(order_details)
            }
            
            # Make request
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                
                # Verify response structure
                required_fields = ['success', 'orderNumber', 'message', 'zipFilePath']
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    self.log_result(
                        "Order Creation Success", 
                        False, 
                        f"Missing required fields: {missing_fields}",
                        {"response": result}
                    )
                    return None
                
                # Verify order number format
                if not result['orderNumber'].startswith('ORD-'):
                    self.log_result(
                        "Order Creation Success", 
                        False, 
                        f"Invalid order number format: {result['orderNumber']}"
                    )
                    return None
                
                # Verify success flag
                if not result['success']:
                    self.log_result(
                        "Order Creation Success", 
                        False, 
                        "Success flag is False"
                    )
                    return None
                
                self.log_result(
                    "Order Creation Success", 
                    True, 
                    f"Order created successfully: {result['orderNumber']}",
                    {"total_photos_expected": 6, "zip_path": result['zipFilePath']}
                )
                return result['orderNumber']
                
            else:
                self.log_result(
                    "Order Creation Success", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return None
                
        except Exception as e:
            self.log_result(
                "Order Creation Success", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return None
    
    def test_order_creation_no_photos(self):
        """Test 2a: Order Creation - No Photos Validation"""
        print("\n=== Testing Order Creation - No Photos ===")
        
        order_details = {
            "contactInfo": {
                "fullName": "Test User",
                "email": "test@example.com",
                "phone": "+381661234567",
                "address": "123 Test Street, Belgrade, 11000",
                "notes": "Please handle with care"
            },
            "photoSettings": []
        }
        
        try:
            data = {
                'order_details': json.dumps(order_details)
            }
            
            # Make request without photos
            response = requests.post(f"{self.backend_url}/orders/create", data=data)
            
            if response.status_code == 422:
                self.log_result(
                    "Order Creation No Photos", 
                    True, 
                    "Correctly rejected order without photos (422)"
                )
            else:
                self.log_result(
                    "Order Creation No Photos", 
                    False, 
                    f"Expected 422, got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Order Creation No Photos", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_order_creation_invalid_json(self):
        """Test 2b: Order Creation - Invalid JSON"""
        print("\n=== Testing Order Creation - Invalid JSON ===")
        
        try:
            # Create a test image
            photo_data, _ = self.create_test_image("test.jpg", 1)
            
            files = [
                ('photos', ('test.jpg', photo_data, 'image/jpeg'))
            ]
            
            data = {
                'order_details': 'invalid json string'
            }
            
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code == 400 and "Invalid order details format" in response.text:
                self.log_result(
                    "Order Creation Invalid JSON", 
                    True, 
                    "Correctly rejected invalid JSON (400)"
                )
            else:
                self.log_result(
                    "Order Creation Invalid JSON", 
                    False, 
                    f"Expected 400 with 'Invalid order details format', got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Order Creation Invalid JSON", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_order_creation_missing_contact_fields(self):
        """Test 2c: Order Creation - Missing Contact Fields"""
        print("\n=== Testing Order Creation - Missing Contact Fields ===")
        
        order_details = {
            "contactInfo": {
                "fullName": "Test User"
                # Missing required fields: email, phone, address
            },
            "photoSettings": [
                {
                    "fileName": "photo1.jpg",
                    "format": "10x15",
                    "quantity": 1,
                    "finish": "glossy"
                }
            ]
        }
        
        try:
            photo_data, _ = self.create_test_image("photo1.jpg", 1)
            
            files = [
                ('photos', ('photo1.jpg', photo_data, 'image/jpeg'))
            ]
            
            data = {
                'order_details': json.dumps(order_details)
            }
            
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code == 422:
                self.log_result(
                    "Order Creation Missing Fields", 
                    True, 
                    "Correctly rejected missing contact fields (422)"
                )
            else:
                self.log_result(
                    "Order Creation Missing Fields", 
                    False, 
                    f"Expected 422, got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Order Creation Missing Fields", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_order_retrieval_existing(self, order_number):
        """Test 3a: Order Retrieval - Existing Order"""
        print("\n=== Testing Order Retrieval - Existing Order ===")
        
        if not order_number:
            self.log_result(
                "Order Retrieval Existing", 
                False, 
                "No order number provided (previous test failed)"
            )
            return
        
        try:
            response = requests.get(f"{self.backend_url}/orders/{order_number}")
            
            if response.status_code == 200:
                order_data = response.json()
                
                # Verify required fields
                required_fields = ['orderNumber', 'status', 'contactInfo', 'photoSettings', 'zipFilePath', 'totalPhotos']
                missing_fields = [field for field in required_fields if field not in order_data]
                
                if missing_fields:
                    self.log_result(
                        "Order Retrieval Existing", 
                        False, 
                        f"Missing required fields: {missing_fields}",
                        {"response": order_data}
                    )
                else:
                    self.log_result(
                        "Order Retrieval Existing", 
                        True, 
                        f"Successfully retrieved order: {order_number}",
                        {"total_photos": order_data.get('totalPhotos')}
                    )
            else:
                self.log_result(
                    "Order Retrieval Existing", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Order Retrieval Existing", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_order_retrieval_nonexistent(self):
        """Test 3b: Order Retrieval - Non-existent Order"""
        print("\n=== Testing Order Retrieval - Non-existent Order ===")
        
        fake_order_number = "ORD-999999"
        
        try:
            response = requests.get(f"{self.backend_url}/orders/{fake_order_number}")
            
            if response.status_code == 404 and "Order not found" in response.text:
                self.log_result(
                    "Order Retrieval Non-existent", 
                    True, 
                    "Correctly returned 404 for non-existent order"
                )
            else:
                self.log_result(
                    "Order Retrieval Non-existent", 
                    False, 
                    f"Expected 404 with 'Order not found', got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Order Retrieval Non-existent", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_large_file_upload(self):
        """Test 4: File Upload Validation - Large Files"""
        print("\n=== Testing Large File Upload ===")
        
        order_details = {
            "contactInfo": {
                "fullName": "Large File Test User",
                "email": "largefile@example.com",
                "phone": "+381661234567",
                "address": "123 Test Street, Belgrade, 11000",
                "notes": "Testing large file upload"
            },
            "photoSettings": [
                {
                    "fileName": "large_photo.jpg",
                    "format": "20x30",
                    "quantity": 1,
                    "finish": "glossy"
                }
            ]
        }
        
        try:
            # Create a 5MB+ test image
            large_photo_data, _ = self.create_test_image("large_photo.jpg", 6)
            
            files = [
                ('photos', ('large_photo.jpg', large_photo_data, 'image/jpeg'))
            ]
            
            data = {
                'order_details': json.dumps(order_details)
            }
            
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log_result(
                        "Large File Upload", 
                        True, 
                        f"Successfully uploaded large file: {result['orderNumber']}",
                        {"file_size": "6MB"}
                    )
                else:
                    self.log_result(
                        "Large File Upload", 
                        False, 
                        "Upload succeeded but success flag is False"
                    )
            else:
                self.log_result(
                    "Large File Upload", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Large File Upload", 
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
    
    def admin_login(self):
        """Login as admin and get token"""
        print("\n=== Admin Login ===")
        
        try:
            login_data = {
                "username": "admin",
                "password": "admin123"
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
    
    def test_delete_order_success(self, order_number):
        """Test NEW: Delete Order API - Success Case"""
        print("\n=== Testing Delete Order API - Success Case ===")
        
        if not order_number:
            self.log_result(
                "Delete Order Success", 
                False, 
                "No order number provided (previous test failed)"
            )
            return
        
        if not self.admin_token:
            self.log_result(
                "Delete Order Success", 
                False, 
                "No admin token available (admin login failed)"
            )
            return
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            response = requests.delete(f"{self.backend_url}/admin/orders/{order_number}", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log_result(
                        "Delete Order Success", 
                        True, 
                        f"Successfully deleted order: {order_number}",
                        {"message": result.get('message')}
                    )
                else:
                    self.log_result(
                        "Delete Order Success", 
                        False, 
                        "Delete response success flag is False"
                    )
            else:
                self.log_result(
                    "Delete Order Success", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Delete Order Success", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_delete_order_nonexistent(self):
        """Test NEW: Delete Order API - Non-existent Order"""
        print("\n=== Testing Delete Order API - Non-existent Order ===")
        
        if not self.admin_token:
            self.log_result(
                "Delete Order Non-existent", 
                False, 
                "No admin token available (admin login failed)"
            )
            return
        
        fake_order_number = "ORD-999999"
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}"
            }
            
            response = requests.delete(f"{self.backend_url}/admin/orders/{fake_order_number}", headers=headers)
            
            if response.status_code == 404:
                self.log_result(
                    "Delete Order Non-existent", 
                    True, 
                    "Correctly returned 404 for non-existent order"
                )
            else:
                self.log_result(
                    "Delete Order Non-existent", 
                    False, 
                    f"Expected 404, got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Delete Order Non-existent", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_delete_order_unauthorized(self):
        """Test NEW: Delete Order API - Unauthorized Access"""
        print("\n=== Testing Delete Order API - Unauthorized ===")
        
        fake_order_number = "ORD-123456"
        
        try:
            # Try without authorization header
            response = requests.delete(f"{self.backend_url}/admin/orders/{fake_order_number}")
            
            if response.status_code == 401:
                self.log_result(
                    "Delete Order Unauthorized", 
                    True, 
                    "Correctly returned 401 for unauthorized access"
                )
            else:
                self.log_result(
                    "Delete Order Unauthorized", 
                    False, 
                    f"Expected 401, got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Delete Order Unauthorized", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_large_file_upload_multiple_photos(self):
        """Test NEW: Large File Upload Support - Multiple Photos (20-30 photos)"""
        print("\n=== Testing Large File Upload - Multiple Photos (25 photos) ===")
        
        # Create order details for 25 photos
        photo_settings = []
        for i in range(25):
            photo_settings.append({
                "fileName": f"photo_{i+1:02d}.jpg",
                "format": "10x15",
                "quantity": 1,
                "finish": "glossy" if i % 2 == 0 else "matte"
            })
        
        order_details = {
            "contactInfo": {
                "fullName": "Large Upload Test User",
                "email": "largeupload@example.com",
                "phone": "+381661234567",
                "address": "123 Test Street, Belgrade, 11000",
                "notes": "Testing large upload with 25 photos"
            },
            "photoSettings": photo_settings
        }
        
        try:
            # Create 25 test images (smaller size to avoid timeout)
            files = []
            for i in range(25):
                photo_data, _ = self.create_test_image(f"photo_{i+1:02d}.jpg", 1)  # 1MB each
                files.append(('photos', (f'photo_{i+1:02d}.jpg', photo_data, 'image/jpeg')))
            
            data = {
                'order_details': json.dumps(order_details)
            }
            
            print("   Uploading 25 photos (25MB total)...")
            
            # Set longer timeout for large upload
            response = requests.post(
                f"{self.backend_url}/orders/create", 
                files=files, 
                data=data,
                timeout=300  # 5 minute timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log_result(
                        "Large Upload Multiple Photos", 
                        True, 
                        f"Successfully uploaded 25 photos: {result['orderNumber']}",
                        {"total_photos": 25, "total_size": "25MB"}
                    )
                    return result['orderNumber']
                else:
                    self.log_result(
                        "Large Upload Multiple Photos", 
                        False, 
                        "Upload succeeded but success flag is False"
                    )
                    return None
            else:
                self.log_result(
                    "Large Upload Multiple Photos", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return None
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Large Upload Multiple Photos", 
                False, 
                "Upload timed out after 5 minutes"
            )
            return None
        except Exception as e:
            self.log_result(
                "Large Upload Multiple Photos", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return None
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"Starting Photo Order Management System Tests")
        print(f"Backend URL: {self.backend_url}")
        print("=" * 60)
        
        # Test 0: Basic connectivity
        self.test_api_connectivity()
        
        # Test 1: Order creation success case
        order_number = self.test_order_creation_success()
        
        # Test 2: Order creation validation
        self.test_order_creation_no_photos()
        self.test_order_creation_invalid_json()
        self.test_order_creation_missing_contact_fields()
        
        # Test 3: Order retrieval
        self.test_order_retrieval_existing(order_number)
        self.test_order_retrieval_nonexistent()
        
        # Test 4: Large file upload (original)
        self.test_large_file_upload()
        
        # NEW TESTS - Admin Authentication
        admin_login_success = self.admin_login()
        
        # NEW TESTS - Delete Order API
        if admin_login_success:
            self.test_delete_order_unauthorized()  # Test without auth first
            
            # Create a new order for deletion test
            delete_test_order = self.test_order_creation_success()
            if delete_test_order:
                self.test_delete_order_success(delete_test_order)
            
            self.test_delete_order_nonexistent()
        
        # NEW TESTS - Large File Upload Support (Multiple Photos)
        large_upload_order = self.test_large_file_upload_multiple_photos()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        print("\nFailed Tests:")
        for result in self.test_results:
            if not result['success']:
                print(f"❌ {result['test']}: {result['message']}")
        
        print("\nPassed Tests:")
        for result in self.test_results:
            if result['success']:
                print(f"✅ {result['test']}: {result['message']}")

if __name__ == "__main__":
    tester = PhotoOrderTester()
    tester.run_all_tests()