#!/usr/bin/env python3
"""
Debug script to identify and fix registration issues
"""

import asyncio
import httpx
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class RegistrationDebugger:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)
        self.debug_results = {}
        
    async def test_registration_flow(self):
        """Test complete registration flow with detailed debugging"""
        logger.info("Starting registration flow debugging...")
        
        # Test 1: Check if endpoint exists and is accessible
        await self.test_endpoint_accessibility()
        
        # Test 2: Test valid registration data
        await self.test_valid_registration()
        
        # Test 3: Test duplicate email
        await self.test_duplicate_email()
        
        # Test 4: Test duplicate username
        await self.test_duplicate_username()
        
        # Test 5: Test invalid data
        await self.test_invalid_data()
        
        # Test 6: Test missing fields
        await self.test_missing_fields()
        
        # Test 7: Test malformed JSON
        await self.test_malformed_json()
        
        # Test 8: Test CORS issues
        await self.test_cors_issues()
        
        await self.generate_debug_report()
    
    async def test_endpoint_accessibility(self):
        """Test if registration endpoint is accessible"""
        try:
            logger.info("Testing endpoint accessibility...")
            response = await self.client.get(f"{self.base_url}/auth/register")
            
            if response.status_code == 200:
                logger.info("✓ Registration endpoint is accessible")
                self.debug_results["endpoint_accessible"] = {"status": "PASS", "response": response.status_code}
            else:
                logger.error(f"✗ Registration endpoint returned: {response.status_code}")
                self.debug_results["endpoint_accessible"] = {"status": "FAIL", "response": response.status_code, "error": response.text}
                
        except Exception as e:
            logger.error(f"✗ Endpoint accessibility test failed: {str(e)}")
            self.debug_results["endpoint_accessible"] = {"status": "FAIL", "error": str(e)}
    
    async def test_valid_registration(self):
        """Test registration with valid data"""
        logger.info("Testing valid registration...")
        
        try:
            valid_data = {
                "email": "testuser@example.com",
                "username": "testuser123",
                "password": "testpass123"
            }
            
            response = await self.client.post(
                f"{self.base_url}/auth/register",
                json=valid_data
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info("✓ Valid registration successful")
                self.debug_results["valid_registration"] = {"status": "PASS", "result": result}
            else:
                logger.error(f"✗ Valid registration failed: {response.status_code}")
                self.debug_results["valid_registration"] = {"status": "FAIL", "status_code": response.status_code, "error": response.text}
                
        except Exception as e:
            logger.error(f"✗ Valid registration test failed: {str(e)}")
            self.debug_results["valid_registration"] = {"status": "FAIL", "error": str(e)}
    
    async def test_duplicate_email(self):
        """Test registration with duplicate email"""
        logger.info("Testing duplicate email...")
        
        try:
            duplicate_data = {
                "email": "testuser@example.com",  # This email should exist after valid test
                "username": "differentuser456",
                "password": "testpass123"
            }
            
            response = await self.client.post(
                f"{self.base_url}/auth/register",
                json=duplicate_data
            )
            
            if response.status_code == 400 and "already registered" in response.text.lower():
                logger.info("✓ Duplicate email correctly rejected")
                self.debug_results["duplicate_email"] = {"status": "PASS", "response": response.text}
            else:
                logger.error(f"✗ Duplicate email test unexpected: {response.status_code} - {response.text}")
                self.debug_results["duplicate_email"] = {"status": "FAIL", "status_code": response.status_code, "error": response.text}
                
        except Exception as e:
            logger.error(f"✗ Duplicate email test failed: {str(e)}")
            self.debug_results["duplicate_email"] = {"status": "FAIL", "error": str(e)}
    
    async def test_duplicate_username(self):
        """Test registration with duplicate username"""
        logger.info("Testing duplicate username...")
        
        try:
            duplicate_data = {
                "email": "differentuser@example.com",
                "username": "testuser123",  # This username should exist after valid test
                "password": "testpass123"
            }
            
            response = await self.client.post(
                f"{self.base_url}/auth/register",
                json=duplicate_data
            )
            
            if response.status_code == 400 and "already taken" in response.text.lower():
                logger.info("✓ Duplicate username correctly rejected")
                self.debug_results["duplicate_username"] = {"status": "PASS", "response": response.text}
            else:
                logger.error(f"✗ Duplicate username test unexpected: {response.status_code} - {response.text}")
                self.debug_results["duplicate_username"] = {"status": "FAIL", "status_code": response.status_code, "error": response.text}
                
        except Exception as e:
            logger.error(f"✗ Duplicate username test failed: {str(e)}")
            self.debug_results["duplicate_username"] = {"status": "FAIL", "error": str(e)}
    
    async def test_invalid_data(self):
        """Test registration with invalid data"""
        logger.info("Testing invalid data...")
        
        invalid_tests = [
            {
                "name": "missing_email",
                "data": {"username": "testuser", "password": "testpass123"}  # Missing email
            },
            {
                "name": "missing_username", 
                "data": {"email": "test@example.com", "password": "testpass123"}  # Missing username
            },
            {
                "name": "missing_password",
                "data": {"email": "test@example.com", "username": "testuser"}  # Missing password
            },
            {
                "name": "invalid_email",
                "data": {"email": "invalid-email", "username": "testuser", "password": "testpass123"}
            },
            {
                "name": "short_password",
                "data": {"email": "test@example.com", "username": "testuser", "password": "123"}  # Too short
            }
        ]
        
        for test_case in invalid_tests:
            try:
                response = await self.client.post(
                    f"{self.base_url}/auth/register",
                    json=test_case["data"]
                )
                
                if response.status_code == 422:  # Validation error
                    logger.info(f"✓ {test_case['name']} correctly rejected: {response.status_code}")
                    self.debug_results[test_case["name"]] = {"status": "PASS", "response": response.status_code}
                else:
                    logger.error(f"✗ {test_case['name']} test unexpected: {response.status_code}")
                    self.debug_results[test_case["name"]] = {"status": "FAIL", "status_code": response.status_code, "error": response.text}
                    
            except Exception as e:
                logger.error(f"✗ {test_case['name']} test failed: {str(e)}")
                self.debug_results[test_case["name"]] = {"status": "FAIL", "error": str(e)}
    
    async def test_missing_fields(self):
        """Test registration with missing fields"""
        logger.info("Testing missing fields...")
        
        # Test empty request
        try:
            response = await self.client.post(
                f"{self.base_url}/auth/register",
                json={}
            )
            
            if response.status_code == 422:
                logger.info("✓ Empty request correctly rejected")
                self.debug_results["empty_request"] = {"status": "PASS", "response": response.status_code}
            else:
                logger.error(f"✗ Empty request test unexpected: {response.status_code}")
                self.debug_results["empty_request"] = {"status": "FAIL", "status_code": response.status_code}
                
        except Exception as e:
            logger.error(f"✗ Empty request test failed: {str(e)}")
            self.debug_results["empty_request"] = {"status": "FAIL", "error": str(e)}
    
    async def test_malformed_json(self):
        """Test registration with malformed JSON"""
        logger.info("Testing malformed JSON...")
        
        try:
            # Send malformed JSON
            response = await self.client.post(
                f"{self.base_url}/auth/register",
                content='{"email": "test@example.com", "username": "testuser", "password": "testpass123"',  # Missing closing brace
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 422:
                logger.info("✓ Malformed JSON correctly rejected")
                self.debug_results["malformed_json"] = {"status": "PASS", "response": response.status_code}
            else:
                logger.error(f"✗ Malformed JSON test unexpected: {response.status_code}")
                self.debug_results["malformed_json"] = {"status": "FAIL", "status_code": response.status_code}
                
        except Exception as e:
            logger.error(f"✗ Malformed JSON test failed: {str(e)}")
            self.debug_results["malformed_json"] = {"status": "FAIL", "error": str(e)}
    
    async def test_cors_issues(self):
        """Test CORS configuration"""
        logger.info("Testing CORS...")
        
        try:
            # Test with different origin
            headers = {"Origin": "http://localhost:3001"}  # Different port
            response = await self.client.options(f"{self.base_url}/auth/register", headers=headers)
            
            cors_headers = {
                "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
                "access-control-allow-methods": response.headers.get("access-control-allow-methods"),
                "access-control-allow-headers": response.headers.get("access-control-allow-headers")
            }
            
            if "localhost:3000" in cors_headers.get("access-control-allow-origin", ""):
                logger.info("✓ CORS properly configured for frontend")
                self.debug_results["cors"] = {"status": "PASS", "headers": cors_headers}
            else:
                logger.error(f"✗ CORS may be misconfigured: {cors_headers}")
                self.debug_results["cors"] = {"status": "FAIL", "headers": cors_headers}
                
        except Exception as e:
            logger.error(f"✗ CORS test failed: {str(e)}")
            self.debug_results["cors"] = {"status": "FAIL", "error": str(e)}
    
    async def generate_debug_report(self):
        """Generate comprehensive debug report"""
        logger.info("\n" + "="*60)
        logger.info("REGISTRATION DEBUG REPORT")
        logger.info("="*60)
        
        total_tests = len(self.debug_results)
        passed_tests = sum(1 for result in self.debug_results.values() if result["status"] == "PASS")
        failed_tests = total_tests - passed_tests
        
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"Passed: {passed_tests}")
        logger.info(f"Failed: {failed_tests}")
        logger.info(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        logger.info("\nDetailed Results:")
        for test_name, result in self.debug_results.items():
            status_symbol = "PASS" if result["status"] == "PASS" else "FAIL"
            logger.info(f"  {test_name}: {status_symbol}")
            
            if result["status"] == "FAIL":
                logger.info(f"    Error: {result.get('error', 'Unknown error')}")
        
        # Save report
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": (passed_tests/total_tests)*100
            },
            "results": self.debug_results
        }
        
        with open("registration_debug_report.json", "w") as f:
            json.dump(report_data, f, indent=2)
        
        logger.info("\nDetailed report saved to: registration_debug_report.json")
        logger.info("="*60)

async def main():
    """Main debug runner"""
    debugger = RegistrationDebugger()
    
    try:
        await debugger.test_registration_flow()
    finally:
        await debugger.client.aclose()

if __name__ == "__main__":
    asyncio.run(main())
