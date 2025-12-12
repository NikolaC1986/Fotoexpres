#!/usr/bin/env python3
"""
Backend API Testing for Photo Printing Order Management System
Tests all endpoints and functionality as specified in the review request.
UPDATED: Testing new address fields (street, postalCode, city) and ZIP structure
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
BACKEND_URL = "https://photogifts-1.preview.emergentagent.com/api"

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
        """Test 1: Order Creation - Success Case with NEW ADDRESS FIELDS"""
        print("\n=== Testing Order Creation - Success Case with New Address Fields ===")
        
        # Test data with NEW ADDRESS STRUCTURE as specified in review request
        order_details = {
            "contactInfo": {
                "fullName": "Test Korisnik",
                "email": "test@example.com",
                "phone": "0641234567",
                "street": "Kralja Petra 15",
                "postalCode": "11000", 
                "city": "Beograd",
                "notes": "Test napomena"
            },
            "photoSettings": [
                {
                    "fileName": "test1.jpg",
                    "format": "9x13",
                    "quantity": 2,
                    "finish": "sjajni"
                },
                {
                    "fileName": "test2.jpg",
                    "format": "10x15",
                    "quantity": 3,
                    "finish": "mat"
                }
            ]
        }
        
        try:
            # Create test images
            photo1_data, _ = self.create_test_image("test1.jpg", 2)
            photo2_data, _ = self.create_test_image("test2.jpg", 3)
            
            # Prepare multipart form data
            files = [
                ('photos', ('test1.jpg', photo1_data, 'image/jpeg')),
                ('photos', ('test2.jpg', photo2_data, 'image/jpeg'))
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
                    f"Order created successfully with new address fields: {result['orderNumber']}",
                    {"total_photos_expected": 5, "zip_path": result['zipFilePath']}
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
                "street": "123 Test Street",
                "postalCode": "11000",
                "city": "Belgrade",
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
                # Missing required fields: email, phone, street, postalCode, city
            },
            "photoSettings": [
                {
                    "fileName": "photo1.jpg",
                    "format": "10x15",
                    "quantity": 1,
                    "finish": "sjajni"
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
    
    def test_new_zip_structure_and_address_fields(self):
        """Test NEW: ZIP Structure and Address Fields as per Review Request"""
        print("\n=== Testing NEW ZIP Structure and Address Fields ===")
        
        # Test data exactly as specified in review request
        order_details = {
            "contactInfo": {
                "fullName": "Test Korisnik",
                "email": "test@example.com",
                "phone": "0641234567",
                "street": "Kralja Petra 15",
                "postalCode": "11000",
                "city": "Beograd",
                "notes": "Test napomena"
            },
            "photoSettings": [
                {
                    "fileName": "test1.jpg",
                    "format": "9x13",
                    "quantity": 2,
                    "finish": "sjajni"
                },
                {
                    "fileName": "test2.jpg",
                    "format": "10x15",
                    "quantity": 3,
                    "finish": "mat"
                }
            ]
        }
        
        try:
            # Create test images
            photo1_data, _ = self.create_test_image("test1.jpg", 2)
            photo2_data, _ = self.create_test_image("test2.jpg", 3)
            
            # Prepare multipart form data
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
                    "ZIP Structure Test", 
                    False, 
                    f"Order creation failed: HTTP {response.status_code}: {response.text}"
                )
                return
            
            result = response.json()
            if not result.get('success'):
                self.log_result(
                    "ZIP Structure Test", 
                    False, 
                    "Order creation success flag is False"
                )
                return
            
            order_number = result['orderNumber']
            
            # Now test admin login and download ZIP to verify structure
            if not self.admin_token:
                login_success = self.admin_login()
                if not login_success:
                    self.log_result(
                        "ZIP Structure Test", 
                        False, 
                        "Cannot test ZIP structure - admin login failed"
                    )
                    return
            
            # Download ZIP file
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            zip_response = requests.get(f"{self.backend_url}/admin/orders/{order_number}/download", headers=headers)
            
            if zip_response.status_code != 200:
                self.log_result(
                    "ZIP Structure Test", 
                    False, 
                    f"ZIP download failed: HTTP {zip_response.status_code}"
                )
                return
            
            # Save ZIP to temporary file and analyze structure
            with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as temp_zip:
                temp_zip.write(zip_response.content)
                temp_zip_path = temp_zip.name
            
            try:
                # Analyze ZIP structure
                with zipfile.ZipFile(temp_zip_path, 'r') as zipf:
                    file_list = zipf.namelist()
                    
                    # Expected structure:
                    # order_details.txt
                    # 9x13/sjajni/test1.jpg
                    # 10x15/mat/test2.jpg
                    
                    expected_files = [
                        'order_details.txt',
                        '9x13/sjajni/test1.jpg',
                        '10x15/mat/test2.jpg'
                    ]
                    
                    structure_correct = True
                    missing_files = []
                    
                    for expected_file in expected_files:
                        if expected_file not in file_list:
                            missing_files.append(expected_file)
                            structure_correct = False
                    
                    if not structure_correct:
                        self.log_result(
                            "ZIP Structure Test", 
                            False, 
                            f"ZIP structure incorrect. Missing files: {missing_files}",
                            {"actual_files": file_list, "expected_files": expected_files}
                        )
                        return
                    
                    # Test order_details.txt content for new address format
                    order_details_content = zipf.read('order_details.txt').decode('utf-8')
                    
                    # Check for new address fields in separate lines
                    address_checks = [
                        "Ulica i broj: Kralja Petra 15",
                        "Poštanski broj: 11000", 
                        "Grad: Beograd"
                    ]
                    
                    address_format_correct = True
                    missing_address_lines = []
                    
                    for address_line in address_checks:
                        if address_line not in order_details_content:
                            missing_address_lines.append(address_line)
                            address_format_correct = False
                    
                    # Check for rekapitulacija section
                    rekapitulacija_present = "REKAPITULACIJA PO FORMATIMA:" in order_details_content
                    format_counts_present = "Format 9x13 cm: 2 fotografija" in order_details_content and "Format 10x15 cm: 3 fotografija" in order_details_content
                    
                    if not address_format_correct:
                        self.log_result(
                            "ZIP Structure Test", 
                            False, 
                            f"Address format incorrect. Missing lines: {missing_address_lines}"
                        )
                        return
                    
                    if not rekapitulacija_present or not format_counts_present:
                        self.log_result(
                            "ZIP Structure Test", 
                            False, 
                            "Rekapitulacija section missing or incorrect format counts"
                        )
                        return
                    
                    self.log_result(
                        "ZIP Structure Test", 
                        True, 
                        f"✅ ZIP structure and address fields correct for order {order_number}",
                        {
                            "zip_files": file_list,
                            "address_format": "3 separate fields verified",
                            "rekapitulacija": "Present with correct counts"
                        }
                    )
                    
            finally:
                # Clean up temp file
                os.unlink(temp_zip_path)
                
        except Exception as e:
            self.log_result(
                "ZIP Structure Test", 
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
                "street": "123 Test Street",
                "postalCode": "11000", 
                "city": "Belgrade",
                "notes": "Testing large file upload"
            },
            "photoSettings": [
                {
                    "fileName": "large_photo.jpg",
                    "format": "20x30",
                    "quantity": 1,
                    "finish": "sjajni"
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
                "finish": "sjajni" if i % 2 == 0 else "mat"
            })
        
        order_details = {
            "contactInfo": {
                "fullName": "Large Upload Test User",
                "email": "largeupload@example.com",
                "phone": "+381661234567",
                "street": "123 Test Street",
                "postalCode": "11000",
                "city": "Belgrade", 
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
    
    def test_zip_structure_with_quantity_folders(self):
        """Test NEW FEATURE 1: ZIP Structure with Quantity Folders"""
        print("\n=== Testing ZIP Structure with Quantity Folders ===")
        
        # Test data with mixed quantities as specified in review request
        order_details = {
            "contactInfo": {
                "fullName": "Marko Petrović",
                "email": "marko@example.com",
                "phone": "0641234567",
                "street": "Knez Mihailova 42",
                "postalCode": "11000",
                "city": "Beograd",
                "notes": "Test ZIP strukture sa količinama"
            },
            "photoSettings": [
                {
                    "fileName": "photo1.jpg",
                    "format": "9x13",
                    "quantity": 5,
                    "finish": "sjajni"
                },
                {
                    "fileName": "photo2.jpg",
                    "format": "9x13", 
                    "quantity": 10,
                    "finish": "sjajni"
                },
                {
                    "fileName": "photo3.jpg",
                    "format": "10x15",
                    "quantity": 1,
                    "finish": "mat"
                }
            ]
        }
        
        try:
            # Create test images
            photo1_data, _ = self.create_test_image("photo1.jpg", 2)
            photo2_data, _ = self.create_test_image("photo2.jpg", 2)
            photo3_data, _ = self.create_test_image("photo3.jpg", 2)
            
            files = [
                ('photos', ('photo1.jpg', photo1_data, 'image/jpeg')),
                ('photos', ('photo2.jpg', photo2_data, 'image/jpeg')),
                ('photos', ('photo3.jpg', photo3_data, 'image/jpeg'))
            ]
            
            data = {
                'order_details': json.dumps(order_details)
            }
            
            # Create order
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code != 200:
                self.log_result(
                    "ZIP Structure with Quantity Folders", 
                    False, 
                    f"Order creation failed: HTTP {response.status_code}: {response.text}"
                )
                return
            
            result = response.json()
            if not result.get('success'):
                self.log_result(
                    "ZIP Structure with Quantity Folders", 
                    False, 
                    "Order creation success flag is False"
                )
                return
            
            order_number = result['orderNumber']
            
            # Login as admin to download ZIP
            if not self.admin_token:
                login_success = self.admin_login()
                if not login_success:
                    self.log_result(
                        "ZIP Structure with Quantity Folders", 
                        False, 
                        "Cannot test ZIP structure - admin login failed"
                    )
                    return
            
            # Download ZIP file
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            zip_response = requests.get(f"{self.backend_url}/admin/orders/{order_number}/download", headers=headers)
            
            if zip_response.status_code != 200:
                self.log_result(
                    "ZIP Structure with Quantity Folders", 
                    False, 
                    f"ZIP download failed: HTTP {zip_response.status_code}"
                )
                return
            
            # Save ZIP to temporary file and analyze structure
            with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as temp_zip:
                temp_zip.write(zip_response.content)
                temp_zip_path = temp_zip.name
            
            try:
                # Analyze ZIP structure
                with zipfile.ZipFile(temp_zip_path, 'r') as zipf:
                    file_list = zipf.namelist()
                    
                    # Expected structure: format/finish/quantity/photo.jpg
                    expected_files = [
                        'order_details.txt',
                        '9x13/sjajni/5/photo1.jpg',
                        '9x13/sjajni/10/photo2.jpg', 
                        '10x15/mat/1/photo3.jpg'
                    ]
                    
                    structure_correct = True
                    missing_files = []
                    
                    for expected_file in expected_files:
                        if expected_file not in file_list:
                            missing_files.append(expected_file)
                            structure_correct = False
                    
                    if not structure_correct:
                        self.log_result(
                            "ZIP Structure with Quantity Folders", 
                            False, 
                            f"ZIP structure incorrect. Missing files: {missing_files}",
                            {"actual_files": file_list, "expected_files": expected_files}
                        )
                        return
                    
                    self.log_result(
                        "ZIP Structure with Quantity Folders", 
                        True, 
                        f"✅ ZIP structure with quantity folders correct for order {order_number}",
                        {
                            "zip_files": file_list,
                            "structure": "format/finish/quantity/photo.jpg verified",
                            "example": "9x13/sjajni/5/photo1.jpg, 10x15/mat/1/photo3.jpg"
                        }
                    )
                    
            finally:
                # Clean up temp file
                os.unlink(temp_zip_path)
                
        except Exception as e:
            self.log_result(
                "ZIP Structure with Quantity Folders", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_change_viewer_password_admin_success(self):
        """Test NEW FEATURE 2a: Change Viewer Password - Admin Success"""
        print("\n=== Testing Change Viewer Password - Admin Success ===")
        
        if not self.admin_token:
            login_success = self.admin_login()
            if not login_success:
                self.log_result(
                    "Change Viewer Password Admin Success", 
                    False, 
                    "Cannot test - admin login failed"
                )
                return
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            data = {
                "newViewerPassword": "NovaŠifra123!"
            }
            
            response = requests.post(f"{self.backend_url}/admin/change-viewer-password", json=data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log_result(
                        "Change Viewer Password Admin Success", 
                        True, 
                        "Admin successfully changed viewer password",
                        {"message": result.get('message')}
                    )
                else:
                    self.log_result(
                        "Change Viewer Password Admin Success", 
                        False, 
                        "Response success flag is False"
                    )
            else:
                self.log_result(
                    "Change Viewer Password Admin Success", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Change Viewer Password Admin Success", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_change_viewer_password_viewer_forbidden(self):
        """Test NEW FEATURE 2b: Change Viewer Password - Viewer Forbidden"""
        print("\n=== Testing Change Viewer Password - Viewer Forbidden ===")
        
        # First login as viewer
        try:
            login_data = {
                "username": "Menadzer",
                "password": "Menadzer2025!"
            }
            
            response = requests.post(f"{self.backend_url}/admin/login", json=login_data)
            
            if response.status_code != 200:
                self.log_result(
                    "Change Viewer Password Viewer Forbidden", 
                    False, 
                    f"Viewer login failed: HTTP {response.status_code}: {response.text}"
                )
                return
            
            result = response.json()
            if not result.get('success') or not result.get('token'):
                self.log_result(
                    "Change Viewer Password Viewer Forbidden", 
                    False, 
                    "Viewer login response missing success or token"
                )
                return
            
            viewer_token = result['token']
            
            # Now try to change viewer password with viewer token (should fail)
            headers = {"Authorization": f"Bearer {viewer_token}"}
            data = {
                "newViewerPassword": "NovaŠifra123!"
            }
            
            response = requests.post(f"{self.backend_url}/admin/change-viewer-password", json=data, headers=headers)
            
            if response.status_code == 403:
                self.log_result(
                    "Change Viewer Password Viewer Forbidden", 
                    True, 
                    "Correctly rejected viewer attempt to change password (403)"
                )
            else:
                self.log_result(
                    "Change Viewer Password Viewer Forbidden", 
                    False, 
                    f"Expected 403, got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Change Viewer Password Viewer Forbidden", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_change_viewer_password_validation(self):
        """Test NEW FEATURE 2c: Change Viewer Password - Validation"""
        print("\n=== Testing Change Viewer Password - Validation ===")
        
        if not self.admin_token:
            login_success = self.admin_login()
            if not login_success:
                self.log_result(
                    "Change Viewer Password Validation", 
                    False, 
                    "Cannot test - admin login failed"
                )
                return
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            data = {
                "newViewerPassword": "short"  # Less than 8 characters
            }
            
            response = requests.post(f"{self.backend_url}/admin/change-viewer-password", json=data, headers=headers)
            
            if response.status_code == 400 and "must be at least 8 characters" in response.text:
                self.log_result(
                    "Change Viewer Password Validation", 
                    True, 
                    "Correctly rejected short password (400)"
                )
            else:
                self.log_result(
                    "Change Viewer Password Validation", 
                    False, 
                    f"Expected 400 with validation message, got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Change Viewer Password Validation", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_working_hours_get_settings(self):
        """Test NEW FEATURE 3a: Working Hours in GET /api/settings"""
        print("\n=== Testing Working Hours in GET /api/settings ===")
        
        try:
            response = requests.get(f"{self.backend_url}/settings")
            
            if response.status_code == 200:
                result = response.json()
                settings = result.get('settings', {})
                working_hours = settings.get('workingHours')
                
                if working_hours:
                    self.log_result(
                        "Working Hours GET Settings", 
                        True, 
                        f"Working hours found in public settings: {working_hours}"
                    )
                else:
                    self.log_result(
                        "Working Hours GET Settings", 
                        False, 
                        "Working hours field missing from settings"
                    )
            else:
                self.log_result(
                    "Working Hours GET Settings", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Working Hours GET Settings", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_working_hours_get_admin_settings(self):
        """Test NEW FEATURE 3b: Working Hours in GET /api/admin/settings"""
        print("\n=== Testing Working Hours in GET /api/admin/settings ===")
        
        if not self.admin_token:
            login_success = self.admin_login()
            if not login_success:
                self.log_result(
                    "Working Hours GET Admin Settings", 
                    False, 
                    "Cannot test - admin login failed"
                )
                return
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.backend_url}/admin/settings", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                settings = result.get('settings', {})
                working_hours = settings.get('workingHours')
                
                if working_hours:
                    self.log_result(
                        "Working Hours GET Admin Settings", 
                        True, 
                        f"Working hours found in admin settings: {working_hours}"
                    )
                else:
                    self.log_result(
                        "Working Hours GET Admin Settings", 
                        False, 
                        "Working hours field missing from admin settings"
                    )
            else:
                self.log_result(
                    "Working Hours GET Admin Settings", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Working Hours GET Admin Settings", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_working_hours_update_admin_settings(self):
        """Test NEW FEATURE 3c: Working Hours in PUT /api/admin/settings"""
        print("\n=== Testing Working Hours in PUT /api/admin/settings ===")
        
        if not self.admin_token:
            login_success = self.admin_login()
            if not login_success:
                self.log_result(
                    "Working Hours PUT Admin Settings", 
                    False, 
                    "Cannot test - admin login failed"
                )
                return
        
        try:
            # First get current settings
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            get_response = requests.get(f"{self.backend_url}/admin/settings", headers=headers)
            
            if get_response.status_code != 200:
                self.log_result(
                    "Working Hours PUT Admin Settings", 
                    False, 
                    f"Cannot get current settings: HTTP {get_response.status_code}"
                )
                return
            
            current_settings = get_response.json().get('settings', {})
            
            # Update working hours
            new_working_hours = "Pon-Pet: 08:00-17:00, Sub: 09:00-14:00"
            updated_settings = current_settings.copy()
            updated_settings['workingHours'] = new_working_hours
            
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
                        if verify_settings.get('workingHours') == new_working_hours:
                            self.log_result(
                                "Working Hours PUT Admin Settings", 
                                True, 
                                f"Working hours successfully updated and persisted: {new_working_hours}"
                            )
                        else:
                            self.log_result(
                                "Working Hours PUT Admin Settings", 
                                False, 
                                "Working hours update not persisted correctly"
                            )
                    else:
                        self.log_result(
                            "Working Hours PUT Admin Settings", 
                            False, 
                            "Cannot verify update - verification request failed"
                        )
                else:
                    self.log_result(
                        "Working Hours PUT Admin Settings", 
                        False, 
                        "Update response success flag is False"
                    )
            else:
                self.log_result(
                    "Working Hours PUT Admin Settings", 
                    False, 
                    f"HTTP {put_response.status_code}: {put_response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Working Hours PUT Admin Settings", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_gift_promotion_setup(self):
        """Test SETUP: Create a test gift promotion via Admin Panel"""
        print("\n=== SETUP: Creating Test Gift Promotion ===")
        
        if not self.admin_token:
            login_success = self.admin_login()
            if not login_success:
                self.log_result(
                    "Gift Promotion Setup", 
                    False, 
                    "Cannot setup gift promotion - admin login failed"
                )
                return False
        
        try:
            # First get available products to use as gifts
            products_response = requests.get(f"{self.backend_url}/products")
            if products_response.status_code != 200:
                self.log_result(
                    "Gift Promotion Setup", 
                    False, 
                    f"Cannot fetch products: HTTP {products_response.status_code}"
                )
                return False
            
            products_data = products_response.json()
            if not products_data.get('success') or not products_data.get('products'):
                self.log_result(
                    "Gift Promotion Setup", 
                    False, 
                    "No products available for gift promotion"
                )
                return False
            
            products = products_data['products']
            if len(products) < 2:
                self.log_result(
                    "Gift Promotion Setup", 
                    False, 
                    f"Need at least 2 products for gift tiers, found {len(products)}"
                )
                return False
            
            # Create gift promotion with 2 tiers
            gift_promotion = {
                "isActive": True,
                "type": "gift",
                "customDisplayText": "Pokloni za fotografije! 🎁",
                "message": "Naručite više fotografija i dobijte besplatne proizvode!",
                "format": "all",
                "discountPercent": 0,
                "applyDiscount": False,
                "validUntil": "2025-12-31T23:59",
                "giftTiers": [
                    {
                        "id": "tier_1",
                        "minPhotos": 50,
                        "message": "Za 50+ fotografija dobijate poklon!",
                        "gifts": [
                            {
                                "productId": products[0]['id'],
                                "variantId": products[0]['variants'][0]['id'],
                                "productName": products[0]['name'],
                                "variantName": products[0]['variants'][0]['name'],
                                "price": products[0]['variants'][0]['price']
                            }
                        ]
                    },
                    {
                        "id": "tier_2", 
                        "minPhotos": 100,
                        "message": "Za 100+ fotografija dobijate dodatni poklon!",
                        "gifts": [
                            {
                                "productId": products[1]['id'] if len(products) > 1 else products[0]['id'],
                                "variantId": products[1]['variants'][0]['id'] if len(products) > 1 else products[0]['variants'][1]['id'] if len(products[0]['variants']) > 1 else products[0]['variants'][0]['id'],
                                "productName": products[1]['name'] if len(products) > 1 else products[0]['name'],
                                "variantName": products[1]['variants'][0]['name'] if len(products) > 1 else products[0]['variants'][1]['name'] if len(products[0]['variants']) > 1 else products[0]['variants'][0]['name'],
                                "price": products[1]['variants'][0]['price'] if len(products) > 1 else products[0]['variants'][1]['price'] if len(products[0]['variants']) > 1 else products[0]['variants'][0]['price']
                            }
                        ]
                    }
                ]
            }
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            data = {"promotion": gift_promotion}
            
            response = requests.put(f"{self.backend_url}/admin/promotion", json=data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    self.log_result(
                        "Gift Promotion Setup", 
                        True, 
                        "Gift promotion created successfully",
                        {
                            "tier_1_min_photos": 50,
                            "tier_2_min_photos": 100,
                            "tier_1_gift": f"{products[0]['name']} - {products[0]['variants'][0]['name']}",
                            "tier_2_gift": f"{products[1]['name'] if len(products) > 1 else products[0]['name']} - {products[1]['variants'][0]['name'] if len(products) > 1 else products[0]['variants'][1]['name'] if len(products[0]['variants']) > 1 else products[0]['variants'][0]['name']}"
                        }
                    )
                    return True
                else:
                    self.log_result(
                        "Gift Promotion Setup", 
                        False, 
                        "Promotion update response success flag is False"
                    )
                    return False
            else:
                self.log_result(
                    "Gift Promotion Setup", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Gift Promotion Setup", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return False
    
    def test_gift_order_creation_150_photos(self):
        """Test PHASE 1: Order Creation with 150 photos (should unlock both tiers)"""
        print("\n=== Testing Gift Order Creation - 150 Photos (Both Tiers) ===")
        
        # Test data with 150 photos worth of prints
        order_details = {
            "contactInfo": {
                "fullName": "Gift Test Korisnik",
                "email": "gift@example.com",
                "phone": "0641234567",
                "street": "Knez Mihailova 42",
                "postalCode": "11000",
                "city": "Beograd",
                "notes": "Test gift system - 150 photos"
            },
            "photoSettings": [
                {
                    "fileName": "gift_photo1.jpg",
                    "format": "10x15",
                    "quantity": 75,  # 75 prints
                    "finish": "sjajni"
                },
                {
                    "fileName": "gift_photo2.jpg", 
                    "format": "10x15",
                    "quantity": 75,  # 75 prints = 150 total
                    "finish": "mat"
                }
            ],
            "giftProducts": [
                # This should be automatically populated by frontend, but we'll test backend handling
                {
                    "productId": "test_product_1",
                    "variantId": "test_variant_1", 
                    "productName": "Test Gift 1",
                    "variantName": "Test Variant 1",
                    "quantity": 1,
                    "price": 0,
                    "isGift": True
                },
                {
                    "productId": "test_product_2",
                    "variantId": "test_variant_2",
                    "productName": "Test Gift 2", 
                    "variantName": "Test Variant 2",
                    "quantity": 1,
                    "price": 0,
                    "isGift": True
                }
            ]
        }
        
        try:
            # Create test images
            photo1_data, _ = self.create_test_image("gift_photo1.jpg", 2)
            photo2_data, _ = self.create_test_image("gift_photo2.jpg", 2)
            
            files = [
                ('photos', ('gift_photo1.jpg', photo1_data, 'image/jpeg')),
                ('photos', ('gift_photo2.jpg', photo2_data, 'image/jpeg'))
            ]
            
            data = {
                'order_details': json.dumps(order_details)
            }
            
            # Create order
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code != 200:
                self.log_result(
                    "Gift Order Creation 150 Photos", 
                    False, 
                    f"Order creation failed: HTTP {response.status_code}: {response.text}"
                )
                return None
            
            result = response.json()
            if not result.get('success'):
                self.log_result(
                    "Gift Order Creation 150 Photos", 
                    False, 
                    "Order creation success flag is False"
                )
                return None
            
            order_number = result['orderNumber']
            
            # Verify order in database contains giftProducts
            order_response = requests.get(f"{self.backend_url}/orders/{order_number}")
            if order_response.status_code != 200:
                self.log_result(
                    "Gift Order Creation 150 Photos", 
                    False, 
                    f"Cannot retrieve order for verification: HTTP {order_response.status_code}"
                )
                return None
            
            order_data = order_response.json()
            gift_products = order_data.get('giftProducts', [])
            
            if len(gift_products) != 2:
                self.log_result(
                    "Gift Order Creation 150 Photos", 
                    False, 
                    f"Expected 2 gift products, found {len(gift_products)}"
                )
                return None
            
            # Verify gift products have correct properties
            for gift in gift_products:
                if not gift.get('isGift'):
                    self.log_result(
                        "Gift Order Creation 150 Photos", 
                        False, 
                        f"Gift product missing isGift flag: {gift}"
                    )
                    return None
                if gift.get('price') != 0:
                    self.log_result(
                        "Gift Order Creation 150 Photos", 
                        False, 
                        f"Gift product price should be 0, got {gift.get('price')}"
                    )
                    return None
            
            self.log_result(
                "Gift Order Creation 150 Photos", 
                True, 
                f"Order created successfully with 2 gift products: {order_number}",
                {
                    "total_photos": 150,
                    "gift_products_count": len(gift_products),
                    "gift_products": [f"{g.get('productName')} - {g.get('variantName')}" for g in gift_products]
                }
            )
            return order_number
            
        except Exception as e:
            self.log_result(
                "Gift Order Creation 150 Photos", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return None
    
    def test_gift_order_creation_75_photos(self):
        """Test PHASE 1: Order Creation with 75 photos (only Tier 1)"""
        print("\n=== Testing Gift Order Creation - 75 Photos (Tier 1 Only) ===")
        
        order_details = {
            "contactInfo": {
                "fullName": "Gift Test Tier1",
                "email": "gift_tier1@example.com", 
                "phone": "0641234567",
                "street": "Terazije 10",
                "postalCode": "11000",
                "city": "Beograd",
                "notes": "Test gift system - 75 photos (tier 1 only)"
            },
            "photoSettings": [
                {
                    "fileName": "tier1_photo.jpg",
                    "format": "10x15", 
                    "quantity": 75,  # Exactly 75 prints (above tier 1, below tier 2)
                    "finish": "sjajni"
                }
            ],
            "giftProducts": [
                # Only tier 1 gift should be included
                {
                    "productId": "test_product_1",
                    "variantId": "test_variant_1",
                    "productName": "Test Gift 1",
                    "variantName": "Test Variant 1", 
                    "quantity": 1,
                    "price": 0,
                    "isGift": True
                }
            ]
        }
        
        try:
            photo_data, _ = self.create_test_image("tier1_photo.jpg", 2)
            
            files = [
                ('photos', ('tier1_photo.jpg', photo_data, 'image/jpeg'))
            ]
            
            data = {
                'order_details': json.dumps(order_details)
            }
            
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code != 200:
                self.log_result(
                    "Gift Order Creation 75 Photos", 
                    False, 
                    f"Order creation failed: HTTP {response.status_code}: {response.text}"
                )
                return None
            
            result = response.json()
            if not result.get('success'):
                self.log_result(
                    "Gift Order Creation 75 Photos", 
                    False, 
                    "Order creation success flag is False"
                )
                return None
            
            order_number = result['orderNumber']
            
            # Verify order contains only 1 gift product
            order_response = requests.get(f"{self.backend_url}/orders/{order_number}")
            if order_response.status_code != 200:
                self.log_result(
                    "Gift Order Creation 75 Photos", 
                    False, 
                    f"Cannot retrieve order for verification: HTTP {order_response.status_code}"
                )
                return None
            
            order_data = order_response.json()
            gift_products = order_data.get('giftProducts', [])
            
            if len(gift_products) != 1:
                self.log_result(
                    "Gift Order Creation 75 Photos", 
                    False, 
                    f"Expected 1 gift product (tier 1 only), found {len(gift_products)}"
                )
                return None
            
            self.log_result(
                "Gift Order Creation 75 Photos", 
                True, 
                f"Order created successfully with 1 gift product (tier 1): {order_number}",
                {
                    "total_photos": 75,
                    "gift_products_count": len(gift_products),
                    "tier_1_gift": f"{gift_products[0].get('productName')} - {gift_products[0].get('variantName')}"
                }
            )
            return order_number
            
        except Exception as e:
            self.log_result(
                "Gift Order Creation 75 Photos", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return None
    
    def test_gift_order_creation_25_photos(self):
        """Test PHASE 1: Order Creation with 25 photos (no tiers)"""
        print("\n=== Testing Gift Order Creation - 25 Photos (No Tiers) ===")
        
        order_details = {
            "contactInfo": {
                "fullName": "Gift Test NoTier",
                "email": "gift_notier@example.com",
                "phone": "0641234567", 
                "street": "Makedonska 15",
                "postalCode": "11000",
                "city": "Beograd",
                "notes": "Test gift system - 25 photos (no tiers)"
            },
            "photoSettings": [
                {
                    "fileName": "notier_photo.jpg",
                    "format": "10x15",
                    "quantity": 25,  # Below tier 1 threshold
                    "finish": "sjajni"
                }
            ],
            "giftProducts": []  # Should be empty
        }
        
        try:
            photo_data, _ = self.create_test_image("notier_photo.jpg", 2)
            
            files = [
                ('photos', ('notier_photo.jpg', photo_data, 'image/jpeg'))
            ]
            
            data = {
                'order_details': json.dumps(order_details)
            }
            
            response = requests.post(f"{self.backend_url}/orders/create", files=files, data=data)
            
            if response.status_code != 200:
                self.log_result(
                    "Gift Order Creation 25 Photos", 
                    False, 
                    f"Order creation failed: HTTP {response.status_code}: {response.text}"
                )
                return None
            
            result = response.json()
            if not result.get('success'):
                self.log_result(
                    "Gift Order Creation 25 Photos", 
                    False, 
                    "Order creation success flag is False"
                )
                return None
            
            order_number = result['orderNumber']
            
            # Verify order contains no gift products
            order_response = requests.get(f"{self.backend_url}/orders/{order_number}")
            if order_response.status_code != 200:
                self.log_result(
                    "Gift Order Creation 25 Photos", 
                    False, 
                    f"Cannot retrieve order for verification: HTTP {order_response.status_code}"
                )
                return None
            
            order_data = order_response.json()
            gift_products = order_data.get('giftProducts', [])
            
            if len(gift_products) != 0:
                self.log_result(
                    "Gift Order Creation 25 Photos", 
                    False, 
                    f"Expected 0 gift products (no tiers), found {len(gift_products)}"
                )
                return None
            
            self.log_result(
                "Gift Order Creation 25 Photos", 
                True, 
                f"Order created successfully with no gift products: {order_number}",
                {
                    "total_photos": 25,
                    "gift_products_count": 0,
                    "message": "Correctly no gifts for orders below tier thresholds"
                }
            )
            return order_number
            
        except Exception as e:
            self.log_result(
                "Gift Order Creation 25 Photos", 
                False, 
                f"Exception occurred: {str(e)}"
            )
            return None
    
    def test_gift_order_zip_content(self, order_number):
        """Test that ZIP contains gift section in order_details.txt"""
        print("\n=== Testing Gift Order ZIP Content ===")
        
        if not order_number:
            self.log_result(
                "Gift Order ZIP Content", 
                False, 
                "No order number provided (previous test failed)"
            )
            return
        
        if not self.admin_token:
            login_success = self.admin_login()
            if not login_success:
                self.log_result(
                    "Gift Order ZIP Content", 
                    False, 
                    "Cannot test ZIP content - admin login failed"
                )
                return
        
        try:
            # Download ZIP file
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            zip_response = requests.get(f"{self.backend_url}/admin/orders/{order_number}/download", headers=headers)
            
            if zip_response.status_code != 200:
                self.log_result(
                    "Gift Order ZIP Content", 
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
                    
                    if 'order_details.txt' not in file_list:
                        self.log_result(
                            "Gift Order ZIP Content", 
                            False, 
                            "order_details.txt not found in ZIP"
                        )
                        return
                    
                    # Read order details content
                    order_details_content = zipf.read('order_details.txt').decode('utf-8')
                    
                    # Check for gift section
                    gift_section_present = "🎁 POKLON PROIZVODI (BESPLATNO):" in order_details_content
                    gift_free_label = "BESPLATNO (🎁 Poklon)" in order_details_content
                    
                    if not gift_section_present:
                        self.log_result(
                            "Gift Order ZIP Content", 
                            False, 
                            "Gift products section not found in order_details.txt"
                        )
                        return
                    
                    if not gift_free_label:
                        self.log_result(
                            "Gift Order ZIP Content", 
                            False, 
                            "Gift products not marked as BESPLATNO in order_details.txt"
                        )
                        return
                    
                    self.log_result(
                        "Gift Order ZIP Content", 
                        True, 
                        f"ZIP contains correct gift section for order {order_number}",
                        {
                            "gift_section_found": gift_section_present,
                            "free_label_found": gift_free_label,
                            "zip_files": file_list
                        }
                    )
                    
            finally:
                # Clean up temp file
                os.unlink(temp_zip_path)
                
        except Exception as e:
            self.log_result(
                "Gift Order ZIP Content", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_gift_promotion_banner_detection(self):
        """Test PHASE 3: Promotion Banner Detection"""
        print("\n=== Testing Gift Promotion Banner Detection ===")
        
        try:
            # Get public promotion endpoint (what frontend uses)
            response = requests.get(f"{self.backend_url}/promotion")
            
            if response.status_code != 200:
                self.log_result(
                    "Gift Promotion Banner Detection", 
                    False, 
                    f"Cannot fetch promotion: HTTP {response.status_code}: {response.text}"
                )
                return
            
            result = response.json()
            promotion = result.get('promotion')
            
            if not promotion:
                self.log_result(
                    "Gift Promotion Banner Detection", 
                    False, 
                    "No promotion data returned"
                )
                return
            
            # Verify gift promotion properties
            if not promotion.get('isActive'):
                self.log_result(
                    "Gift Promotion Banner Detection", 
                    False, 
                    "Promotion is not active"
                )
                return
            
            if promotion.get('type') != 'gift':
                self.log_result(
                    "Gift Promotion Banner Detection", 
                    False, 
                    f"Expected type 'gift', got '{promotion.get('type')}'"
                )
                return
            
            if not promotion.get('giftTiers') or len(promotion.get('giftTiers', [])) == 0:
                self.log_result(
                    "Gift Promotion Banner Detection", 
                    False, 
                    "Gift promotion has no gift tiers"
                )
                return
            
            # Verify custom display text and message
            custom_text = promotion.get('customDisplayText', '')
            message = promotion.get('message', '')
            
            if '🎁' not in custom_text and '🎁' not in message:
                self.log_result(
                    "Gift Promotion Banner Detection", 
                    False, 
                    "Gift promotion missing gift emoji in display text or message"
                )
                return
            
            self.log_result(
                "Gift Promotion Banner Detection", 
                True, 
                "Gift promotion correctly detected and configured",
                {
                    "type": promotion.get('type'),
                    "isActive": promotion.get('isActive'),
                    "customDisplayText": custom_text,
                    "message": message,
                    "giftTiers_count": len(promotion.get('giftTiers', []))
                }
            )
            
        except Exception as e:
            self.log_result(
                "Gift Promotion Banner Detection", 
                False, 
                f"Exception occurred: {str(e)}"
            )

    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"Starting Photo Order Management System Tests")
        print(f"Backend URL: {self.backend_url}")
        print("=" * 60)
        
        # Test 0: Basic connectivity
        self.test_api_connectivity()
        
        # NEW TESTS - Admin Authentication (needed for other tests)
        admin_login_success = self.admin_login()
        
        # ===== MULTI-TIER GIFT SYSTEM TESTING (PRIORITY) =====
        print("\n" + "=" * 60)
        print("TESTING MULTI-TIER GIFT SYSTEM FROM REVIEW REQUEST")
        print("=" * 60)
        
        # SETUP: Create gift promotion
        gift_setup_success = False
        if admin_login_success:
            gift_setup_success = self.test_gift_promotion_setup()
        
        # PHASE 1: Backend API Testing
        if gift_setup_success:
            print("\n--- PHASE 1: Backend API Testing ---")
            
            # Test order creation with different photo counts
            gift_order_150 = self.test_gift_order_creation_150_photos()  # Both tiers
            gift_order_75 = self.test_gift_order_creation_75_photos()    # Tier 1 only
            gift_order_25 = self.test_gift_order_creation_25_photos()    # No tiers
            
            # Test ZIP content for gift orders
            if gift_order_150:
                self.test_gift_order_zip_content(gift_order_150)
        
        # PHASE 3: Promotion Banner Testing
        if gift_setup_success:
            print("\n--- PHASE 3: Promotion Banner Testing ---")
            self.test_gift_promotion_banner_detection()
        
        # ===== EXISTING FEATURES TESTING (LOWER PRIORITY) =====
        print("\n" + "=" * 60)
        print("TESTING EXISTING FEATURES FROM PREVIOUS REQUESTS")
        print("=" * 60)
        
        # NEW FEATURE 1: ZIP Structure with Quantity Folders
        if admin_login_success:
            self.test_zip_structure_with_quantity_folders()
        
        # NEW FEATURE 2: Change Viewer Password Endpoint
        if admin_login_success:
            self.test_change_viewer_password_admin_success()
            self.test_change_viewer_password_viewer_forbidden()
            self.test_change_viewer_password_validation()
        
        # NEW FEATURE 3: Working Hours in Settings
        self.test_working_hours_get_settings()
        if admin_login_success:
            self.test_working_hours_get_admin_settings()
            self.test_working_hours_update_admin_settings()
        
        # ===== REGRESSION TESTS (LOWEST PRIORITY) =====
        print("\n" + "=" * 60)
        print("RUNNING REGRESSION TESTS")
        print("=" * 60)
        
        # Test 1: Order creation success case with new address fields
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
        
        # NEW TEST - ZIP Structure and Address Fields (PRIORITY TEST)
        if admin_login_success:
            self.test_new_zip_structure_and_address_fields()
        
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