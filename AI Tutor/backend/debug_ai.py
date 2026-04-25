"""
Debug script to test AI API integration
"""

import asyncio
import logging
from app.ai_services import AIService
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_ai_services():
    """Test all AI services"""
    print("=== AI Services Debug Test ===")
    
    # Check API keys
    print(f"Groq API Key: {'SET' if settings.GROQ_API_KEY and settings.GROQ_API_KEY != 'your_groq_api_key_here' else 'NOT SET'}")
    print(f"Gemini API Key: {'SET' if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != 'your_gemini_api_key_here' else 'NOT SET'}")
    print(f"DeepSeek API Key: {'SET' if settings.DEEPSEEK_API_KEY and settings.DEEPSEEK_API_KEY != 'your_deepseek_api_key_here' else 'NOT SET'}")
    
    ai_service = AIService()
    
    # Test messages
    test_messages = [
        {"role": "system", "content": "You are a helpful AI tutor."},
        {"role": "user", "content": "Hello, can you explain what photosynthesis is?"}
    ]
    
    print(f"\nTesting with messages: {test_messages}")
    
    # Test Groq
    print("\n--- Testing Groq ---")
    try:
        groq_response = await ai_service.groq_chat(test_messages)
        if groq_response:
            print(f"Groq SUCCESS: {groq_response[:100]}...")
        else:
            print("Groq FAILED: No response")
    except Exception as e:
        print(f"Groq ERROR: {e}")
    
    # Test Gemini
    print("\n--- Testing Gemini ---")
    try:
        gemini_response = await ai_service.gemini_generate("Explain photosynthesis in simple terms")
        if gemini_response:
            print(f"Gemini SUCCESS: {gemini_response[:100]}...")
        else:
            print("Gemini FAILED: No response")
    except Exception as e:
        print(f"Gemini ERROR: {e}")
    
    # Test DeepSeek
    print("\n--- Testing DeepSeek ---")
    try:
        deepseek_response = await ai_service.deepseek_chat(test_messages)
        if deepseek_response:
            print(f"DeepSeek SUCCESS: {deepseek_response[:100]}...")
        else:
            print("DeepSeek FAILED: No response")
    except Exception as e:
        print(f"DeepSeek ERROR: {e}")
    
    # Test get_chat_response
    print("\n--- Testing get_chat_response ---")
    try:
        response = await ai_service.get_chat_response(test_messages, "explanation")
        if response:
            print(f"get_chat_response SUCCESS: {response[:100]}...")
        else:
            print("get_chat_response FAILED: No response")
    except Exception as e:
        print(f"get_chat_response ERROR: {e}")
    
    print("\n=== AI Services Debug Test Complete ===")

if __name__ == "__main__":
    asyncio.run(test_ai_services())
