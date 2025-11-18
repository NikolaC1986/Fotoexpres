#!/usr/bin/env python3
"""
Role Permissions Testing - Verify that admin and viewer roles work correctly with protected endpoints
"""

import requests
import json

# Configuration
BACKEND_URL = "https://print-admin-panel.preview.emergentagent.com/api"

class RolePermissionsTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.admin_token = None
        self.viewer_token = None
        
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
    
    def login_admin(self):
        """Login as admin"""
        try:
            login_data = {
                "username": "Vlasnik",
                "password": "$ta$Graca25"
            }
            
            response = requests.post(f"{self.backend_url}/admin/login", json=login_data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('token') and result.get('role') == 'admin':
                    self.admin_token = result['token']
                    return True
            return False
        except:
            return False
    
    def login_viewer(self):
        """Login as viewer"""
        try:
            login_data = {
                "username": "Menadzer",
                "password": "Menadzer2025!"
            }
            
            response = requests.post(f"{self.backend_url}/admin/login", json=login_data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('token') and result.get('role') == 'viewer':
                    self.viewer_token = result['token']
                    return True
            return False
        except:
            return False
    
    def test_admin_orders_access(self):
        """Test admin access to orders endpoint"""
        print("\n=== Testing Admin Access to Orders ===")
        
        if not self.admin_token:
            self.log_result("Admin Orders Access", False, "No admin token available")
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.backend_url}/admin/orders", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if 'orders' in result and 'stats' in result:
                    self.log_result(
                        "Admin Orders Access",
                        True,
                        "Admin successfully accessed orders endpoint",
                        {"orders_count": len(result.get('orders', [])), "stats": result.get('stats')}
                    )
                else:
                    self.log_result("Admin Orders Access", False, "Invalid response structure")
            else:
                self.log_result("Admin Orders Access", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Admin Orders Access", False, f"Exception: {str(e)}")
    
    def test_viewer_orders_access(self):
        """Test viewer access to orders endpoint"""
        print("\n=== Testing Viewer Access to Orders ===")
        
        if not self.viewer_token:
            self.log_result("Viewer Orders Access", False, "No viewer token available")
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.viewer_token}"}
            response = requests.get(f"{self.backend_url}/admin/orders", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if 'orders' in result and 'stats' in result:
                    self.log_result(
                        "Viewer Orders Access",
                        True,
                        "Viewer successfully accessed orders endpoint",
                        {"orders_count": len(result.get('orders', [])), "stats": result.get('stats')}
                    )
                else:
                    self.log_result("Viewer Orders Access", False, "Invalid response structure")
            else:
                self.log_result("Viewer Orders Access", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Viewer Orders Access", False, f"Exception: {str(e)}")
    
    def test_admin_settings_access(self):
        """Test admin access to settings endpoints"""
        print("\n=== Testing Admin Access to Settings ===")
        
        if not self.admin_token:
            self.log_result("Admin Settings Access", False, "No admin token available")
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test GET settings
            response = requests.get(f"{self.backend_url}/admin/settings", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if 'settings' in result:
                    self.log_result(
                        "Admin Settings Access",
                        True,
                        "Admin successfully accessed settings endpoint",
                        {"settings_keys": list(result.get('settings', {}).keys())}
                    )
                else:
                    self.log_result("Admin Settings Access", False, "Invalid response structure")
            else:
                self.log_result("Admin Settings Access", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Admin Settings Access", False, f"Exception: {str(e)}")
    
    def test_viewer_settings_access(self):
        """Test viewer access to settings endpoints"""
        print("\n=== Testing Viewer Access to Settings ===")
        
        if not self.viewer_token:
            self.log_result("Viewer Settings Access", False, "No viewer token available")
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.viewer_token}"}
            
            # Test GET settings
            response = requests.get(f"{self.backend_url}/admin/settings", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if 'settings' in result:
                    self.log_result(
                        "Viewer Settings Access",
                        True,
                        "Viewer successfully accessed settings endpoint",
                        {"settings_keys": list(result.get('settings', {}).keys())}
                    )
                else:
                    self.log_result("Viewer Settings Access", False, "Invalid response structure")
            else:
                self.log_result("Viewer Settings Access", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Viewer Settings Access", False, f"Exception: {str(e)}")
    
    def test_no_token_access(self):
        """Test access without token"""
        print("\n=== Testing Access Without Token ===")
        
        try:
            response = requests.get(f"{self.backend_url}/admin/orders")
            
            if response.status_code == 401:
                self.log_result(
                    "No Token Access",
                    True,
                    "Correctly rejected access without token (401)"
                )
            else:
                self.log_result("No Token Access", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_result("No Token Access", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all role permission tests"""
        print(f"Starting Role Permissions Tests")
        print(f"Backend URL: {self.backend_url}")
        print("=" * 60)
        
        # Login both users
        print("Logging in admin...")
        admin_login_success = self.login_admin()
        if admin_login_success:
            print("✅ Admin login successful")
        else:
            print("❌ Admin login failed")
        
        print("Logging in viewer...")
        viewer_login_success = self.login_viewer()
        if viewer_login_success:
            print("✅ Viewer login successful")
        else:
            print("❌ Viewer login failed")
        
        # Test access with different roles
        self.test_admin_orders_access()
        self.test_viewer_orders_access()
        self.test_admin_settings_access()
        self.test_viewer_settings_access()
        self.test_no_token_access()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("ROLE PERMISSIONS TEST SUMMARY")
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
    tester = RolePermissionsTester()
    tester.run_all_tests()