#!/usr/bin/env python3
"""
Role-Based Authentication Testing for Photo Printing Admin System
Tests new viewer role and admin login functionality as specified in review request.

Test Scenarios:
1. Admin Login Test - credentials: Vlasnik / $ta$Graca25 - Expected: role="admin"
2. Viewer Login Test - credentials: Menadzer / Menadzer2025! - Expected: role="viewer"  
3. Invalid Credentials Test - Expected: 401 Unauthorized
4. Test Token Contains Role - Decode JWT tokens to verify role field
"""

import requests
import json
import jwt
import base64
from datetime import datetime

# Configuration
BACKEND_URL = "https://print-admin-panel.preview.emergentagent.com/api"

class RoleBasedAuthTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        
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
    
    def decode_jwt_token(self, token):
        """Decode JWT token to inspect payload (without verification for testing)"""
        try:
            # Split token into parts
            parts = token.split('.')
            if len(parts) != 3:
                return None
            
            # Decode payload (second part)
            payload_part = parts[1]
            # Add padding if needed
            payload_part += '=' * (4 - len(payload_part) % 4)
            
            # Decode base64
            payload_bytes = base64.urlsafe_b64decode(payload_part)
            payload = json.loads(payload_bytes.decode('utf-8'))
            
            return payload
        except Exception as e:
            print(f"   Error decoding token: {str(e)}")
            return None
    
    def test_admin_login_correct_credentials(self):
        """Test 1: Admin Login with Correct Credentials"""
        print("\n=== Testing Admin Login - Correct Credentials ===")
        
        try:
            login_data = {
                "username": "Vlasnik",
                "password": "$ta$Graca25"
            }
            
            response = requests.post(f"{self.backend_url}/admin/login", json=login_data)
            
            if response.status_code == 200:
                result = response.json()
                
                # Check required fields
                required_fields = ['success', 'token', 'message', 'role']
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    self.log_result(
                        "Admin Login - Correct Credentials",
                        False,
                        f"Missing required fields: {missing_fields}",
                        {"response": result}
                    )
                    return None
                
                # Check success flag
                if not result.get('success'):
                    self.log_result(
                        "Admin Login - Correct Credentials",
                        False,
                        "Success flag is False",
                        {"response": result}
                    )
                    return None
                
                # Check role
                if result.get('role') != 'admin':
                    self.log_result(
                        "Admin Login - Correct Credentials",
                        False,
                        f"Expected role='admin', got role='{result.get('role')}'",
                        {"response": result}
                    )
                    return None
                
                # Check token exists and is not empty
                token = result.get('token')
                if not token or len(token) < 10:
                    self.log_result(
                        "Admin Login - Correct Credentials",
                        False,
                        "Token is missing or too short",
                        {"token_length": len(token) if token else 0}
                    )
                    return None
                
                self.log_result(
                    "Admin Login - Correct Credentials",
                    True,
                    f"Successfully logged in as admin. Role: {result.get('role')}",
                    {
                        "token_length": len(token),
                        "message": result.get('message'),
                        "role": result.get('role')
                    }
                )
                return token
                
            else:
                self.log_result(
                    "Admin Login - Correct Credentials",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return None
                
        except Exception as e:
            self.log_result(
                "Admin Login - Correct Credentials",
                False,
                f"Exception occurred: {str(e)}"
            )
            return None
    
    def test_viewer_login_correct_credentials(self):
        """Test 2: Viewer Login with Correct Credentials"""
        print("\n=== Testing Viewer Login - Correct Credentials ===")
        
        try:
            login_data = {
                "username": "Menadzer",
                "password": "Menadzer2025!"
            }
            
            response = requests.post(f"{self.backend_url}/admin/login", json=login_data)
            
            if response.status_code == 200:
                result = response.json()
                
                # Check required fields
                required_fields = ['success', 'token', 'message', 'role']
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    self.log_result(
                        "Viewer Login - Correct Credentials",
                        False,
                        f"Missing required fields: {missing_fields}",
                        {"response": result}
                    )
                    return None
                
                # Check success flag
                if not result.get('success'):
                    self.log_result(
                        "Viewer Login - Correct Credentials",
                        False,
                        "Success flag is False",
                        {"response": result}
                    )
                    return None
                
                # Check role
                if result.get('role') != 'viewer':
                    self.log_result(
                        "Viewer Login - Correct Credentials",
                        False,
                        f"Expected role='viewer', got role='{result.get('role')}'",
                        {"response": result}
                    )
                    return None
                
                # Check token exists and is not empty
                token = result.get('token')
                if not token or len(token) < 10:
                    self.log_result(
                        "Viewer Login - Correct Credentials",
                        False,
                        "Token is missing or too short",
                        {"token_length": len(token) if token else 0}
                    )
                    return None
                
                self.log_result(
                    "Viewer Login - Correct Credentials",
                    True,
                    f"Successfully logged in as viewer. Role: {result.get('role')}",
                    {
                        "token_length": len(token),
                        "message": result.get('message'),
                        "role": result.get('role')
                    }
                )
                return token
                
            else:
                self.log_result(
                    "Viewer Login - Correct Credentials",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return None
                
        except Exception as e:
            self.log_result(
                "Viewer Login - Correct Credentials",
                False,
                f"Exception occurred: {str(e)}"
            )
            return None
    
    def test_invalid_credentials(self):
        """Test 3: Invalid Credentials Test"""
        print("\n=== Testing Invalid Credentials ===")
        
        try:
            login_data = {
                "username": "Invalid",
                "password": "Wrong"
            }
            
            response = requests.post(f"{self.backend_url}/admin/login", json=login_data)
            
            if response.status_code == 401:
                # Check if response contains appropriate error message
                try:
                    result = response.json()
                    if "Invalid credentials" in result.get('detail', ''):
                        self.log_result(
                            "Invalid Credentials Test",
                            True,
                            "Correctly rejected invalid credentials with 401 Unauthorized",
                            {"detail": result.get('detail')}
                        )
                    else:
                        self.log_result(
                            "Invalid Credentials Test",
                            True,
                            "Correctly rejected invalid credentials with 401 Unauthorized",
                            {"response": result}
                        )
                except:
                    # Even if JSON parsing fails, 401 status is correct
                    self.log_result(
                        "Invalid Credentials Test",
                        True,
                        "Correctly rejected invalid credentials with 401 Unauthorized"
                    )
            else:
                self.log_result(
                    "Invalid Credentials Test",
                    False,
                    f"Expected 401 Unauthorized, got HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Invalid Credentials Test",
                False,
                f"Exception occurred: {str(e)}"
            )
    
    def test_token_contains_role(self, admin_token, viewer_token):
        """Test 4: Verify JWT Tokens Contain Role Information"""
        print("\n=== Testing JWT Token Role Information ===")
        
        # Test admin token
        if admin_token:
            print("   Testing Admin Token...")
            admin_payload = self.decode_jwt_token(admin_token)
            
            if admin_payload:
                if 'role' in admin_payload and admin_payload['role'] == 'admin':
                    self.log_result(
                        "Admin Token Contains Role",
                        True,
                        f"Admin token correctly contains role='admin'",
                        {
                            "role": admin_payload.get('role'),
                            "sub": admin_payload.get('sub'),
                            "exp": admin_payload.get('exp')
                        }
                    )
                else:
                    self.log_result(
                        "Admin Token Contains Role",
                        False,
                        f"Admin token missing role or incorrect role: {admin_payload.get('role')}",
                        {"payload": admin_payload}
                    )
            else:
                self.log_result(
                    "Admin Token Contains Role",
                    False,
                    "Failed to decode admin token"
                )
        else:
            self.log_result(
                "Admin Token Contains Role",
                False,
                "No admin token available (admin login failed)"
            )
        
        # Test viewer token
        if viewer_token:
            print("   Testing Viewer Token...")
            viewer_payload = self.decode_jwt_token(viewer_token)
            
            if viewer_payload:
                if 'role' in viewer_payload and viewer_payload['role'] == 'viewer':
                    self.log_result(
                        "Viewer Token Contains Role",
                        True,
                        f"Viewer token correctly contains role='viewer'",
                        {
                            "role": viewer_payload.get('role'),
                            "sub": viewer_payload.get('sub'),
                            "exp": viewer_payload.get('exp')
                        }
                    )
                else:
                    self.log_result(
                        "Viewer Token Contains Role",
                        False,
                        f"Viewer token missing role or incorrect role: {viewer_payload.get('role')}",
                        {"payload": viewer_payload}
                    )
            else:
                self.log_result(
                    "Viewer Token Contains Role",
                    False,
                    "Failed to decode viewer token"
                )
        else:
            self.log_result(
                "Viewer Token Contains Role",
                False,
                "No viewer token available (viewer login failed)"
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
        """Run all role-based authentication tests"""
        print(f"Starting Role-Based Authentication Tests")
        print(f"Backend URL: {self.backend_url}")
        print("=" * 60)
        
        # Test 0: Basic connectivity
        self.test_api_connectivity()
        
        # Test 1: Admin Login with correct credentials
        admin_token = self.test_admin_login_correct_credentials()
        
        # Test 2: Viewer Login with correct credentials
        viewer_token = self.test_viewer_login_correct_credentials()
        
        # Test 3: Invalid credentials
        self.test_invalid_credentials()
        
        # Test 4: Token role verification
        self.test_token_contains_role(admin_token, viewer_token)
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("ROLE-BASED AUTHENTICATION TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"❌ {result['test']}: {result['message']}")
        
        print("\nPassed Tests:")
        for result in self.test_results:
            if result['success']:
                print(f"✅ {result['test']}: {result['message']}")

if __name__ == "__main__":
    tester = RoleBasedAuthTester()
    tester.run_all_tests()