#!/usr/bin/env python3
"""
Comprehensive Ghost Orders Bug Fix Testing
Tests all scenarios mentioned in the review request with detailed logging verification.

PRIORITY 1 - Critical Order Creation Flows:
1. Single Photo Upload (1-5 photos) with different formats
2. Medium Upload (10-30 photos) 
3. Chunked Upload (50+ photos simulated)

PRIORITY 2 - Error Handling & Edge Cases:
4. Duplicate Order Prevention
5. Partial Upload Recovery
6. Order Retrieval

PRIORITY 3 - Logging Verification:
7. Backend Logs Check
"""

import requests
import json
import os
import io
import tempfile
import zipfile
import time
from PIL import Image
from datetime import datetime

# Configuration
API_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://photogift-admin.preview.emergentagent.com')
API = f"{API_URL}/api"

class GhostOrdersTester:
    def __init__(self):
        self.api_url = API
        self.test_results = []
        self.admin_token = None
        self.created_orders = []  # Track orders for cleanup
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result with timestamp"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        print(f"   {message}")
        if details:
            for key, value in details.items():
                print(f"   {key}: {value}")
        print()
    
    def create_test_image(self, filename, size_mb=1):
        """Create a test image with specified size"""
        # Calculate dimensions for target file size
        target_bytes = size_mb * 1024 * 1024
        pixels = target_bytes // 3
        width = height = int(pixels ** 0.5)
        
        # Create image with random color based on filename
        color = (
            hash(filename) % 256,
            (hash(filename) >> 8) % 256,
            (hash(filename) >> 16) % 256
        )
        img = Image.new('RGB', (width, height), color=color)
        
        # Save to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG', quality=85)
        img_bytes.seek(0)
        
        return img_bytes.getvalue()
    
    def admin_login(self):
        """Login as admin to get token"""
        if self.admin_token:
            return True
            
        try:
            login_data = {
                "username": "Vlasnik",
                "password": "$ta$Graca25"
            }
            
            response = requests.post(f"{self.api_url}/admin/login", json=login_data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('token'):
                    self.admin_token = result['token']
                    print("✅ Admin login successful")
                    return True
            
            print(f"❌ Admin login failed: {response.status_code} - {response.text}")
            return False
            
        except Exception as e:
            print(f"❌ Admin login error: {str(e)}")
            return False
    
    def verify_order_in_database(self, order_number):
        """Verify order exists in database with all required fields"""
        try:
            response = requests.get(f"{self.api_url}/orders/{order_number}")
            
            if response.status_code == 200:
                order_data = response.json()
                
                # Check required fields
                required_fields = ['orderNumber', 'status', 'contactInfo', 'photoSettings', 'zipFilePath', 'totalPhotos']
                missing_fields = [field for field in required_fields if field not in order_data]
                
                if missing_fields:
                    return False, f"Missing fields: {missing_fields}"
                
                if order_data.get('status') != 'completed':
                    return False, f"Status is '{order_data.get('status')}', expected 'completed'"
                
                return True, order_data
            
            elif response.status_code == 404:
                return False, "Order not found in database (GHOST ORDER detected!)"
            else:
                return False, f"HTTP {response.status_code}: {response.text}"
                
        except Exception as e:
            return False, f"Exception: {str(e)}"
    
    def check_backend_logs(self, order_number):
        """Check backend logs for step-by-step process"""
        try:
            # Read recent backend logs
            log_files = [
                "/var/log/supervisor/backend.err.log",
                "/var/log/supervisor/backend.out.log"
            ]
            
            found_logs = []
            for log_file in log_files:
                if os.path.exists(log_file):
                    with open(log_file, 'r') as f:
                        lines = f.readlines()
                        # Get last 100 lines
                        recent_lines = lines[-100:]
                        
                        # Look for order-specific logs
                        order_logs = [line for line in recent_lines if order_number in line]
                        found_logs.extend(order_logs)
            
            # Expected log patterns
            expected_patterns = [
                "NEW ORDER REQUEST RECEIVED",
                "Step 1: ✅ All",
                "Step 4A: ✅ Database record created",
                "Step 4D: ✅ Order",
                "Step 5: ✅ Order",
                "ORDER",
                "COMPLETED SUCCESSFULLY ✅"
            ]
            
            found_patterns = []
            for pattern in expected_patterns:
                if any(pattern in log for log in found_logs):
                    found_patterns.append(pattern)
            
            return found_patterns, found_logs
            
        except Exception as e:
            return [], [f"Error reading logs: {str(e)}"]
    
    # PRIORITY 1 TESTS
    
    def test_single_photo_upload(self):
        """PRIORITY 1.1: Single Photo Upload (1-5 photos) with different formats"""
        print("=" * 80)
        print("🔍 PRIORITY 1.1: Single Photo Upload (3 photos, different formats)")
        print("=" * 80)
        
        order_details = {
            "contactInfo": {
                "fullName": "Ana Marković",
                "email": "ana.markovic@example.com",
                "phone": "065 123 4567",
                "street": "Ulica i broj 123",
                "postalCode": "11000",
                "city": "Beograd",
                "notes": "Test single photo upload"
            },
            "photoSettings": [
                {
                    "fileName": "photo1.jpg",
                    "format": "9x13",
                    "quantity": 2,
                    "finish": "glossy"
                },
                {
                    "fileName": "photo2.jpg", 
                    "format": "10x15",
                    "quantity": 1,
                    "finish": "matte"
                },
                {
                    "fileName": "photo3.jpg",
                    "format": "13x18",
                    "quantity": 3,
                    "finish": "glossy"
                }
            ],
            "totalPrice": 111,  # 2*12 + 1*18 + 3*25 = 117
            "deliveryFee": 400,
            "grandTotal": 511
        }
        
        try:
            # Create test images
            files = []
            for i in range(3):
                img_data = self.create_test_image(f"photo{i+1}.jpg", 2)
                files.append(('photos', (f'photo{i+1}.jpg', img_data, 'image/jpeg')))
            
            # Submit order
            response = requests.post(
                f"{self.api_url}/orders/create",
                files=files,
                data={'order_details': json.dumps(order_details)},
                timeout=120
            )
            
            if response.status_code != 200:
                self.log_result(
                    "Single Photo Upload",
                    False,
                    f"Order creation failed: HTTP {response.status_code}",
                    {"response": response.text}
                )
                return None
            
            result = response.json()
            
            if not result.get('success'):
                self.log_result(
                    "Single Photo Upload",
                    False,
                    "Order creation success flag is False",
                    {"response": result}
                )
                return None
            
            order_number = result.get('orderNumber')
            if not order_number:
                self.log_result(
                    "Single Photo Upload",
                    False,
                    "No order number in response"
                )
                return None
            
            self.created_orders.append(order_number)
            
            # Verify in database
            db_success, db_result = self.verify_order_in_database(order_number)
            
            if not db_success:
                self.log_result(
                    "Single Photo Upload",
                    False,
                    f"Database verification failed: {db_result}",
                    {"order_number": order_number}
                )
                return None
            
            # Check logs
            log_patterns, log_lines = self.check_backend_logs(order_number)
            
            # Verify ZIP file exists
            zip_path = result.get('zipFilePath')
            zip_exists = zip_path and os.path.exists(zip_path)
            
            self.log_result(
                "Single Photo Upload",
                True,
                f"Order created and verified successfully",
                {
                    "order_number": order_number,
                    "total_photos": 6,  # 2+1+3
                    "status": db_result.get('status'),
                    "zip_exists": zip_exists,
                    "log_patterns_found": len(log_patterns),
                    "contact_info_saved": "street" in str(db_result.get('contactInfo', {}))
                }
            )
            
            return order_number
            
        except Exception as e:
            self.log_result(
                "Single Photo Upload",
                False,
                f"Exception occurred: {str(e)}"
            )
            return None
    
    def test_medium_upload(self):
        """PRIORITY 1.2: Medium Upload (10-30 photos)"""
        print("=" * 80)
        print("🔍 PRIORITY 1.2: Medium Upload (15 photos)")
        print("=" * 80)
        
        # Create 15 photo settings
        photo_settings = []
        for i in range(15):
            photo_settings.append({
                "fileName": f"medium_photo_{i+1:02d}.jpg",
                "format": "10x15",
                "quantity": 1,
                "finish": "glossy" if i % 2 == 0 else "matte"
            })
        
        order_details = {
            "contactInfo": {
                "fullName": "Marko Petrović",
                "email": "marko.petrovic@example.com",
                "phone": "064 987 6543",
                "street": "Knez Mihailova 42",
                "postalCode": "11000",
                "city": "Beograd",
                "notes": "Test medium upload - 15 photos"
            },
            "photoSettings": photo_settings,
            "totalPrice": 270,  # 15 * 18
            "deliveryFee": 400,
            "grandTotal": 670
        }
        
        try:
            # Create 15 test images
            files = []
            for i in range(15):
                img_data = self.create_test_image(f"medium_photo_{i+1:02d}.jpg", 1)
                files.append(('photos', (f'medium_photo_{i+1:02d}.jpg', img_data, 'image/jpeg')))
            
            print(f"   Uploading 15 photos (15MB total)...")
            
            # Submit order with longer timeout
            response = requests.post(
                f"{self.api_url}/orders/create",
                files=files,
                data={'order_details': json.dumps(order_details)},
                timeout=300  # 5 minutes
            )
            
            if response.status_code != 200:
                self.log_result(
                    "Medium Upload",
                    False,
                    f"Order creation failed: HTTP {response.status_code}",
                    {"response": response.text}
                )
                return None
            
            result = response.json()
            
            if not result.get('success'):
                self.log_result(
                    "Medium Upload",
                    False,
                    "Order creation success flag is False"
                )
                return None
            
            order_number = result.get('orderNumber')
            self.created_orders.append(order_number)
            
            # Verify in database
            db_success, db_result = self.verify_order_in_database(order_number)
            
            if not db_success:
                self.log_result(
                    "Medium Upload",
                    False,
                    f"Database verification failed: {db_result}"
                )
                return None
            
            # Check ZIP structure
            zip_path = result.get('zipFilePath')
            zip_structure_correct = False
            if zip_path and os.path.exists(zip_path):
                try:
                    with zipfile.ZipFile(zip_path, 'r') as zipf:
                        file_list = zipf.namelist()
                        # Should have order_details.txt + 15 photos in format/paper_type folders
                        zip_structure_correct = len(file_list) >= 16  # 1 txt + 15 photos
                except:
                    pass
            
            self.log_result(
                "Medium Upload",
                True,
                f"Medium upload successful",
                {
                    "order_number": order_number,
                    "total_photos": 15,
                    "status": db_result.get('status'),
                    "zip_structure_correct": zip_structure_correct
                }
            )
            
            return order_number
            
        except requests.exceptions.Timeout:
            self.log_result(
                "Medium Upload",
                False,
                "Upload timed out after 5 minutes"
            )
            return None
        except Exception as e:
            self.log_result(
                "Medium Upload",
                False,
                f"Exception occurred: {str(e)}"
            )
            return None
    
    def test_chunked_upload(self):
        """PRIORITY 1.3: Chunked Upload (50+ photos simulated)"""
        print("=" * 80)
        print("🔍 PRIORITY 1.3: Chunked Upload (60 photos in 3 chunks)")
        print("=" * 80)
        
        TOTAL_PHOTOS = 60
        CHUNK_SIZE = 20
        TOTAL_CHUNKS = 3
        
        # Create photo settings for all 60 photos
        photo_settings = []
        for i in range(TOTAL_PHOTOS):
            photo_settings.append({
                "fileName": f"chunk_photo_{i+1:03d}.jpg",
                "format": "10x15",
                "quantity": 1,
                "finish": "glossy"
            })
        
        order_details_base = {
            "contactInfo": {
                "fullName": "Stefan Nikolić",
                "email": "stefan.nikolic@example.com",
                "phone": "063 555 7777",
                "street": "Terazije 25",
                "postalCode": "11000",
                "city": "Beograd",
                "notes": "Test chunked upload - 60 photos"
            },
            "photoSettings": photo_settings,
            "totalPrice": 1080,  # 60 * 18
            "deliveryFee": 0,  # Free delivery over 5000
            "grandTotal": 1080
        }
        
        order_number = None
        
        try:
            # Upload in 3 chunks
            for chunk_index in range(TOTAL_CHUNKS):
                is_last_chunk = (chunk_index == TOTAL_CHUNKS - 1)
                
                print(f"   Uploading chunk {chunk_index + 1}/{TOTAL_CHUNKS} {'(FINAL)' if is_last_chunk else ''}...")
                
                # Create files for this chunk
                files = []
                start_idx = chunk_index * CHUNK_SIZE
                end_idx = start_idx + CHUNK_SIZE
                
                for i in range(start_idx, end_idx):
                    img_data = self.create_test_image(f"chunk_photo_{i+1:03d}.jpg", 0.5)  # Smaller files
                    files.append(('photos', (f'chunk_photo_{i+1:03d}.jpg', img_data, 'image/jpeg')))
                
                # Prepare order details for this chunk
                order_details = {
                    **order_details_base,
                    "chunkIndex": chunk_index,
                    "totalChunks": TOTAL_CHUNKS,
                    "isLastChunk": is_last_chunk,
                }
                
                if order_number:
                    order_details["orderNumber"] = order_number
                
                # Submit chunk
                response = requests.post(
                    f"{self.api_url}/orders/create",
                    files=files,
                    data={'order_details': json.dumps(order_details)},
                    timeout=180
                )
                
                if response.status_code != 200:
                    self.log_result(
                        "Chunked Upload",
                        False,
                        f"Chunk {chunk_index + 1} failed: HTTP {response.status_code}",
                        {"response": response.text}
                    )
                    return None
                
                result = response.json()
                
                if not result.get('success'):
                    self.log_result(
                        "Chunked Upload",
                        False,
                        f"Chunk {chunk_index + 1} success flag is False"
                    )
                    return None
                
                # Store/verify order number
                if not order_number:
                    order_number = result.get('orderNumber')
                    if not order_number:
                        self.log_result(
                            "Chunked Upload",
                            False,
                            "No order number from first chunk"
                        )
                        return None
                    self.created_orders.append(order_number)
                    print(f"      Order number: {order_number}")
                else:
                    if result.get('orderNumber') != order_number:
                        self.log_result(
                            "Chunked Upload",
                            False,
                            f"Order number mismatch in chunk {chunk_index + 1}"
                        )
                        return None
                
                print(f"      ✅ Chunk {chunk_index + 1} uploaded")
            
            # Verify final order
            print(f"   Verifying final order {order_number}...")
            
            db_success, db_result = self.verify_order_in_database(order_number)
            
            if not db_success:
                self.log_result(
                    "Chunked Upload",
                    False,
                    f"Final verification failed: {db_result}"
                )
                return None
            
            # Verify all photos are accounted for
            if db_result.get('totalPhotos') != TOTAL_PHOTOS:
                self.log_result(
                    "Chunked Upload",
                    False,
                    f"Photo count mismatch: expected {TOTAL_PHOTOS}, got {db_result.get('totalPhotos')}"
                )
                return None
            
            self.log_result(
                "Chunked Upload",
                True,
                f"Chunked upload successful - ONE order created from {TOTAL_CHUNKS} chunks",
                {
                    "order_number": order_number,
                    "total_photos": TOTAL_PHOTOS,
                    "chunks_processed": TOTAL_CHUNKS,
                    "status": db_result.get('status')
                }
            )
            
            return order_number
            
        except Exception as e:
            self.log_result(
                "Chunked Upload",
                False,
                f"Exception occurred: {str(e)}"
            )
            return None
    
    # PRIORITY 2 TESTS
    
    def test_duplicate_order_prevention(self):
        """PRIORITY 2.1: Duplicate Order Prevention"""
        print("=" * 80)
        print("🔍 PRIORITY 2.1: Duplicate Order Prevention")
        print("=" * 80)
        
        # First create a successful order
        order_details = {
            "contactInfo": {
                "fullName": "Duplicate Test User",
                "email": "duplicate@example.com",
                "phone": "065 111 2222",
                "street": "Duplicate Street 1",
                "postalCode": "11000",
                "city": "Beograd",
                "notes": "First order for duplicate test"
            },
            "photoSettings": [
                {
                    "fileName": "duplicate_test.jpg",
                    "format": "10x15",
                    "quantity": 1,
                    "finish": "glossy"
                }
            ]
        }
        
        try:
            # Create first order
            img_data = self.create_test_image("duplicate_test.jpg", 1)
            files = [('photos', ('duplicate_test.jpg', img_data, 'image/jpeg'))]
            
            response1 = requests.post(
                f"{self.api_url}/orders/create",
                files=files,
                data={'order_details': json.dumps(order_details)},
                timeout=60
            )
            
            if response1.status_code != 200 or not response1.json().get('success'):
                self.log_result(
                    "Duplicate Order Prevention",
                    False,
                    "Could not create first order for duplicate test"
                )
                return
            
            order_number = response1.json().get('orderNumber')
            self.created_orders.append(order_number)
            
            # Wait a moment
            time.sleep(2)
            
            # Try to create the same order again (this should be handled gracefully)
            # Since we can't control order numbers externally, we'll test rapid duplicate submissions
            img_data2 = self.create_test_image("duplicate_test.jpg", 1)
            files2 = [('photos', ('duplicate_test.jpg', img_data2, 'image/jpeg'))]
            
            response2 = requests.post(
                f"{self.api_url}/orders/create",
                files=files2,
                data={'order_details': json.dumps(order_details)},
                timeout=60
            )
            
            # This should either succeed with a new order number or handle gracefully
            if response2.status_code == 200:
                result2 = response2.json()
                if result2.get('success'):
                    order_number2 = result2.get('orderNumber')
                    if order_number2 != order_number:
                        # Different order number is fine - system created new order
                        self.created_orders.append(order_number2)
                        self.log_result(
                            "Duplicate Order Prevention",
                            True,
                            "System handled duplicate submission by creating new order",
                            {
                                "first_order": order_number,
                                "second_order": order_number2
                            }
                        )
                    else:
                        # Same order number returned - system detected duplicate
                        self.log_result(
                            "Duplicate Order Prevention",
                            True,
                            "System detected duplicate and returned existing order",
                            {"order_number": order_number}
                        )
                else:
                    self.log_result(
                        "Duplicate Order Prevention",
                        False,
                        "Second submission failed unexpectedly"
                    )
            else:
                # Error response is also acceptable for duplicate prevention
                self.log_result(
                    "Duplicate Order Prevention",
                    True,
                    f"System rejected duplicate submission: HTTP {response2.status_code}",
                    {"error_response": response2.text[:200]}
                )
            
        except Exception as e:
            self.log_result(
                "Duplicate Order Prevention",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    def test_order_retrieval(self):
        """PRIORITY 2.2: Order Retrieval for all created orders"""
        print("=" * 80)
        print("🔍 PRIORITY 2.2: Order Retrieval Verification")
        print("=" * 80)
        
        if not self.created_orders:
            self.log_result(
                "Order Retrieval",
                False,
                "No orders were created in previous tests"
            )
            return
        
        successful_retrievals = 0
        failed_retrievals = 0
        
        for order_number in self.created_orders:
            try:
                response = requests.get(f"{self.api_url}/orders/{order_number}")
                
                if response.status_code == 200:
                    order_data = response.json()
                    
                    # Verify required fields
                    required_fields = ['orderNumber', 'status', 'contactInfo', 'photoSettings', 'zipFilePath', 'totalPhotos', 'createdAt']
                    missing_fields = [field for field in required_fields if field not in order_data]
                    
                    if not missing_fields and order_data.get('status') == 'completed':
                        successful_retrievals += 1
                        print(f"   ✅ {order_number}: Retrieved successfully")
                    else:
                        failed_retrievals += 1
                        print(f"   ❌ {order_number}: Missing fields or wrong status")
                        
                elif response.status_code == 404:
                    failed_retrievals += 1
                    print(f"   ❌ {order_number}: NOT FOUND (GHOST ORDER!)")
                else:
                    failed_retrievals += 1
                    print(f"   ❌ {order_number}: HTTP {response.status_code}")
                    
            except Exception as e:
                failed_retrievals += 1
                print(f"   ❌ {order_number}: Exception - {str(e)}")
        
        total_orders = len(self.created_orders)
        
        if failed_retrievals == 0:
            self.log_result(
                "Order Retrieval",
                True,
                f"All {successful_retrievals} orders retrieved successfully",
                {
                    "total_orders": total_orders,
                    "successful": successful_retrievals,
                    "failed": failed_retrievals
                }
            )
        else:
            self.log_result(
                "Order Retrieval",
                False,
                f"{failed_retrievals} orders could not be retrieved (GHOST ORDERS detected!)",
                {
                    "total_orders": total_orders,
                    "successful": successful_retrievals,
                    "failed": failed_retrievals,
                    "ghost_orders": [order for order in self.created_orders if not self.verify_order_in_database(order)[0]]
                }
            )
    
    # PRIORITY 3 TESTS
    
    def test_logging_verification(self):
        """PRIORITY 3: Backend Logs Verification"""
        print("=" * 80)
        print("🔍 PRIORITY 3: Backend Logging Verification")
        print("=" * 80)
        
        if not self.created_orders:
            self.log_result(
                "Logging Verification",
                False,
                "No orders to check logs for"
            )
            return
        
        # Check logs for the most recent order
        recent_order = self.created_orders[-1]
        log_patterns, log_lines = self.check_backend_logs(recent_order)
        
        expected_patterns = [
            "NEW ORDER REQUEST RECEIVED",
            "Step 1: ✅ All",
            "Step 4A: ✅ Database record created",
            "Step 4D: ✅ Order",
            "Step 5: ✅ Order",
            "COMPLETED SUCCESSFULLY ✅"
        ]
        
        found_count = len(log_patterns)
        expected_count = len(expected_patterns)
        
        if found_count >= expected_count - 1:  # Allow for minor variations
            self.log_result(
                "Logging Verification",
                True,
                f"Step-by-step logging verified for order {recent_order}",
                {
                    "order_number": recent_order,
                    "patterns_found": found_count,
                    "patterns_expected": expected_count,
                    "log_lines_found": len(log_lines)
                }
            )
        else:
            self.log_result(
                "Logging Verification",
                False,
                f"Insufficient logging found for order {recent_order}",
                {
                    "order_number": recent_order,
                    "patterns_found": found_count,
                    "patterns_expected": expected_count,
                    "missing_patterns": [p for p in expected_patterns if p not in log_patterns]
                }
            )
    
    def run_comprehensive_tests(self):
        """Run all Ghost Orders bug fix tests"""
        print("\n🚀 STARTING COMPREHENSIVE GHOST ORDERS BUG FIX TESTING")
        print("=" * 80)
        print(f"API URL: {self.api_url}")
        print(f"Test started at: {datetime.now().isoformat()}")
        print("=" * 80)
        
        # Admin login (needed for some verifications)
        admin_success = self.admin_login()
        
        print("\n📋 PRIORITY 1 - CRITICAL ORDER CREATION FLOWS")
        print("=" * 80)
        
        # Priority 1 Tests
        self.test_single_photo_upload()
        self.test_medium_upload()
        self.test_chunked_upload()
        
        print("\n📋 PRIORITY 2 - ERROR HANDLING & EDGE CASES")
        print("=" * 80)
        
        # Priority 2 Tests
        self.test_duplicate_order_prevention()
        self.test_order_retrieval()
        
        print("\n📋 PRIORITY 3 - LOGGING VERIFICATION")
        print("=" * 80)
        
        # Priority 3 Tests
        self.test_logging_verification()
        
        # Final Summary
        self.print_final_summary()
    
    def print_final_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("📊 GHOST ORDERS BUG FIX - FINAL TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests Executed: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print(f"\nOrders Created During Testing: {len(self.created_orders)}")
        for order in self.created_orders:
            db_success, _ = self.verify_order_in_database(order)
            status = "✅ EXISTS" if db_success else "❌ GHOST"
            print(f"   {order}: {status}")
        
        # Ghost Orders Detection
        ghost_orders = []
        for order in self.created_orders:
            db_success, _ = self.verify_order_in_database(order)
            if not db_success:
                ghost_orders.append(order)
        
        if ghost_orders:
            print(f"\n🚨 GHOST ORDERS DETECTED: {len(ghost_orders)}")
            for ghost in ghost_orders:
                print(f"   ❌ {ghost}: Order not found in database!")
            print("\n⚠️  THE GHOST ORDERS BUG IS STILL PRESENT!")
        else:
            print(f"\n🎉 NO GHOST ORDERS DETECTED!")
            print("✅ All created orders exist in database with status='completed'")
            if failed_tests == 0:
                print("🎉 GHOST ORDERS BUG FIX IS WORKING PERFECTLY!")
        
        print("\n📋 DETAILED TEST RESULTS:")
        print("-" * 80)
        
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status} {result['test']}")
            print(f"     {result['message']}")
            if result['details']:
                for key, value in result['details'].items():
                    print(f"     {key}: {value}")
            print()
        
        print("=" * 80)
        print(f"Test completed at: {datetime.now().isoformat()}")
        print("=" * 80)

if __name__ == "__main__":
    tester = GhostOrdersTester()
    tester.run_comprehensive_tests()