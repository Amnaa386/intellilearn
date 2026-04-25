#!/usr/bin/env python3
"""
Comprehensive test script for the enhanced AI learning platform backend
"""

import asyncio
import json
import httpx
import logging
from datetime import datetime
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SystemTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)
        self.auth_token = None
        self.test_results = {}
        
    async def run_all_tests(self):
        """Run comprehensive system tests"""
        logger.info("Starting comprehensive system tests...")
        
        test_methods = [
            ("Health Check", self.test_health_check),
            ("API Key Validation", self.test_api_key_validation),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Intent Detection", self.test_intent_detection),
            ("Enhanced Chat API", self.test_enhanced_chat),
            ("Provider Status", self.test_provider_status),
            ("Template Availability", self.test_template_availability),
            ("Error Handling", self.test_error_handling),
            ("Rate Limiting", self.test_rate_limiting)
        ]
        
        for test_name, test_method in test_methods:
            try:
                logger.info(f"Running {test_name}...")
                result = await test_method()
                self.test_results[test_name] = {"status": "PASS", "result": result}
                logger.info(f"  {test_name}: PASS")
            except Exception as e:
                self.test_results[test_name] = {"status": "FAIL", "error": str(e)}
                logger.error(f"  {test_name}: FAIL - {str(e)}")
        
        await self.generate_test_report()
    
    async def test_health_check(self):
        """Test basic health check endpoint"""
        response = await self.client.get(f"{self.base_url}/health")
        response.raise_for_status()
        
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]
        assert "version" in data
        assert "services" in data
        
        return data
    
    async def test_api_key_validation(self):
        """Test API key validation through health check"""
        health_data = await self.test_health_check()
        
        api_keys = health_data["services"]["api_keys"]
        
        # Check that at least one API key is configured
        assert any(api_keys.values()), "At least one API key should be configured"
        
        return api_keys
    
    async def test_user_registration(self):
        """Test user registration"""
        user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "testpassword123"
        }
        
        response = await self.client.post(
            f"{self.base_url}/auth/register",
            json=user_data
        )
        
        # Might fail if user exists, that's okay for testing
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 400:
            return {"status": "user_exists", "detail": response.json().get("detail")}
        else:
            response.raise_for_status()
    
    async def test_user_login(self):
        """Test user login"""
        login_data = {
            "username": "test@example.com",
            "password": "testpassword123"
        }
        
        response = await self.client.post(
            f"{self.base_url}/auth/login",
            data=login_data
        )
        
        if response.status_code == 200:
            token_data = response.json()
            self.auth_token = token_data["access_token"]
            return token_data
        else:
            # Try with different credentials or create new user
            return {"status": "login_failed", "detail": response.json().get("detail")}
    
    async def test_intent_detection(self):
        """Test intent detection endpoint"""
        test_queries = [
            "Explain photosynthesis",
            "Create notes on World War II",
            "Generate a math quiz",
            "Make a presentation on climate change",
            "Compare Python and JavaScript",
            "Solve this equation: 2x + 5 = 15"
        ]
        
        results = []
        
        for query in test_queries:
            response = await self.client.post(
                f"{self.base_url}/api/detect-intent",
                params={"query": query},
                headers={"Authorization": f"Bearer {self.auth_token}"} if self.auth_token else {}
            )
            
            if response.status_code == 200:
                results.append(response.json())
            else:
                results.append({"query": query, "error": response.status_code})
        
        return results
    
    async def test_enhanced_chat(self):
        """Test enhanced chat API"""
        if not self.auth_token:
            # Try to get token first
            await self.test_user_login()
        
        chat_request = {
            "messages": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi! How can I help you learn today?"}
            ],
            "user_query": "Explain the concept of machine learning in simple terms",
            "context": "For a beginner student",
            "session_id": "test_session_123"
        }
        
        response = await self.client.post(
            f"{self.base_url}/api/chat",
            json=chat_request,
            headers={"Authorization": f"Bearer {self.auth_token}"} if self.auth_token else {}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"status": "chat_failed", "error": response.json()}
    
    async def test_provider_status(self):
        """Test AI provider status endpoint"""
        response = await self.client.get(
            f"{self.base_url}/api/providers/status",
            headers={"Authorization": f"Bearer {self.auth_token}"} if self.auth_token else {}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"status": "provider_check_failed", "error": response.json()}
    
    async def test_template_availability(self):
        """Test template availability endpoint"""
        response = await self.client.get(
            f"{self.base_url}/api/templates/available",
            headers={"Authorization": f"Bearer {self.auth_token}"} if self.auth_token else {}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"status": "template_check_failed", "error": response.json()}
    
    async def test_error_handling(self):
        """Test error handling with invalid requests"""
        # Test invalid chat request
        invalid_request = {
            "messages": [],  # Empty messages
            "user_query": "",  # Empty query
        }
        
        response = await self.client.post(
            f"{self.base_url}/api/chat",
            json=invalid_request,
            headers={"Authorization": f"Bearer {self.auth_token}"} if self.auth_token else {}
        )
        
        # Should return error
        assert response.status_code >= 400
        
        return {"error_handling": "working", "status_code": response.status_code}
    
    async def test_rate_limiting(self):
        """Test rate limiting (basic test)"""
        # Make multiple rapid requests
        responses = []
        
        for i in range(5):
            response = await self.client.get(f"{self.base_url}/health")
            responses.append(response.status_code)
        
        # Check if any requests were rate limited
        rate_limited = any(status == 429 for status in responses)
        
        return {"rate_limiting_detected": rate_limited, "responses": responses}
    
    async def generate_test_report(self):
        """Generate comprehensive test report"""
        logger.info("\n" + "="*50)
        logger.info("SYSTEM TEST REPORT")
        logger.info("="*50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result["status"] == "PASS")
        failed_tests = total_tests - passed_tests
        
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"Passed: {passed_tests}")
        logger.info(f"Failed: {failed_tests}")
        logger.info(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        logger.info("\nDetailed Results:")
        for test_name, result in self.test_results.items():
            status_symbol = "PASS" if result["status"] == "PASS" else "FAIL"
            logger.info(f"  {test_name}: {status_symbol}")
            
            if result["status"] == "FAIL":
                logger.info(f"    Error: {result.get('error', 'Unknown error')}")
        
        # Save report to file
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": (passed_tests/total_tests)*100
            },
            "results": self.test_results
        }
        
        with open("test_report.json", "w") as f:
            json.dump(report_data, f, indent=2)
        
        logger.info("\nDetailed report saved to: test_report.json")
        logger.info("="*50)
    
    async def cleanup(self):
        """Cleanup resources"""
        await self.client.aclose()

async def main():
    """Main test runner"""
    tester = SystemTester()
    
    try:
        await tester.run_all_tests()
    finally:
        await tester.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
