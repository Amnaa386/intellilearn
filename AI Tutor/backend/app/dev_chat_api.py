"""
Development chat API with authentication bypass for testing
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import logging
from datetime import datetime

from .database import get_db
from .enhanced_intent_detection import EnhancedIntentDetector, IntentType
from .advanced_ai_router import AdvancedAIRouter
from .prompt_templates import PromptTemplateManager
from .response_formatter import ResponseFormatter, ContentType
from .bypass_auth import should_bypass_auth, mock_current_user, log_auth_bypass

logger = logging.getLogger(__name__)

# Pydantic models for dev chat
class DevChatMessage(BaseModel):
    role: str = Field(..., description="Message role (user, assistant, system)")
    content: str = Field(..., description="Message content")
    timestamp: Optional[datetime] = None

class DevChatRequest(BaseModel):
    messages: List[DevChatMessage] = Field(..., description="Chat conversation history")
    user_query: str = Field(..., description="Current user query")
    context: Optional[str] = Field(None, description="Additional context for the query")
    session_id: Optional[str] = Field(None, description="Session identifier")
    user_preferences: Optional[Dict[str, Any]] = Field(None, description="User preferences")

class DevChatResponse(BaseModel):
    response: str = Field(..., description="AI response content")
    content_type: str = Field(..., description="Type of content generated")
    intent_detected: str = Field(..., description="Detected user intent")
    confidence_score: float = Field(..., description="Confidence in intent detection")
    provider_used: str = Field(..., description="AI provider used")
    response_time: float = Field(..., description="Response generation time")
    structured_data: Optional[Dict[str, Any]] = Field(None, description="Structured response data")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    dev_mode: bool = Field(True, description="Development mode indicator")

# Create router
router = APIRouter(prefix="/dev", tags=["development"])

# Initialize services
intent_detector = EnhancedIntentDetector()
ai_router = AdvancedAIRouter()
prompt_manager = PromptTemplateManager()
response_formatter = ResponseFormatter()

@router.post("/chat", response_model=DevChatResponse)
async def dev_chat_endpoint(
    request: DevChatRequest,
    db: Session = Depends(get_db)
):
    """
    Development chat endpoint with no authentication required
    """
    
    start_time = datetime.now()
    
    try:
        # Log development mode usage
        log_auth_bypass("dev_chat", "Development chat endpoint accessed without authentication")
        
        # Convert messages to format expected by AI services
        conversation_history = [
            {"role": msg.role, "content": msg.content} 
            for msg in request.messages
        ]
        
        # Detect user intent
        logger.info(f"Processing query: {request.user_query[:100]}...")
        intent_result = await intent_detector.detect_intent(request.user_query)
        
        # Get routing strategy
        routing_strategy = ai_router.get_routing_strategy(intent_result, "conversational")
        
        # Get appropriate prompt template
        content_type = _map_intent_to_content_type(intent_result.intent)
        template = prompt_manager.get_template(intent_result.intent.value, routing_strategy["primary_api"])
        
        # Format prompt
        formatted_prompt = prompt_manager.format_prompt(
            template, 
            request.user_query, 
            request.context or ""
        )
        
        # Convert to conversation messages
        messages = prompt_manager.get_conversation_messages(
            formatted_prompt, 
            conversation_history
        )
        
        # Route request to AI provider
        api_response = await ai_router.route_request(
            messages=messages,
            intent_result=intent_result,
            prompt_type=routing_strategy["prompt_type"],
            temperature=formatted_prompt["temperature"],
            max_tokens=formatted_prompt["max_tokens"]
        )
        
        # Format response
        formatted_response = response_formatter.format_response(
            raw_response=api_response.content,
            content_type=content_type,
            metadata={
                "provider": api_response.provider.value,
                "intent": intent_result.intent.value,
                "token_usage": api_response.token_usage,
                "response_time": api_response.response_time,
                "dev_mode": True
            }
        )
        
        # Calculate total processing time
        total_time = (datetime.now() - start_time).total_seconds()
        
        # Log successful response
        logger.info(f"Dev chat response generated successfully using {api_response.provider.value} in {total_time:.2f}s")
        
        return DevChatResponse(
            response=formatted_response.content,
            content_type=formatted_response.content_type.value,
            intent_detected=intent_result.intent.value,
            confidence_score=formatted_response.confidence_score or intent_result.confidence,
            provider_used=api_response.provider.value,
            response_time=total_time,
            structured_data=formatted_response.structured_data,
            metadata={
                "intent_confidence": intent_result.confidence,
                "complexity_score": intent_result.complexity_score,
                "keywords_found": intent_result.keywords_found,
                "reasoning": intent_result.reasoning,
                "token_usage": api_response.token_usage,
                "api_response_time": api_response.response_time,
                "response_format": formatted_response.response_type.value,
                "dev_mode": True,
                "auth_bypassed": True
            }
        )
        
    except Exception as e:
        # Log error
        logger.error(f"Dev chat endpoint error: {str(e)}")
        
        # Return user-friendly error
        return DevChatResponse(
            response="I'm experiencing technical difficulties in development mode. Please try again.",
            content_type="error",
            intent_detected="error",
            confidence_score=0.0,
            provider_used="none",
            response_time=0.0,
            metadata={
                "error": str(e),
                "dev_mode": True,
                "auth_bypassed": True
            }
        )

@router.post("/detect-intent")
async def dev_detect_intent_endpoint(query: str):
    """
    Development intent detection endpoint without authentication
    """
    try:
        log_auth_bypass("dev_detect_intent", "Development intent detection accessed")
        
        intent_result = await intent_detector.detect_intent(query)
        
        return {
            "intent": intent_result.intent.value,
            "confidence": intent_result.confidence,
            "complexity_score": intent_result.complexity_score,
            "keywords_found": intent_result.keywords_found,
            "reasoning": intent_result.reasoning,
            "fallback_needed": intent_result.fallback_needed,
            "routing_recommendation": ai_router.get_api_routing_recommendation(intent_result),
            "dev_mode": True,
            "auth_bypassed": True
        }
        
    except Exception as e:
        logger.error(f"Dev intent detection error: {str(e)}")
        return {
            "error": str(e),
            "dev_mode": True,
            "auth_bypassed": True
        }

@router.get("/status")
async def dev_status():
    """
    Development mode status endpoint
    """
    from .dev_mode import get_dev_mode_status
    return {
        "status": "development_mode_active",
        "timestamp": datetime.now().isoformat(),
        **get_dev_mode_status(),
        "available_endpoints": [
            "/dev/chat - AI chat without authentication",
            "/dev/detect-intent - Intent detection without authentication",
            "/dev/status - Development mode status"
        ]
    }

@router.get("/test-ai-providers")
async def test_ai_providers():
    """
    Test all AI providers without authentication
    """
    try:
        log_auth_bypass("test_ai_providers", "Testing AI providers in dev mode")
        
        # Test messages
        test_messages = [
            {"role": "user", "content": "Hello, this is a test message."}
        ]
        
        provider_results = {}
        
        # Test each provider
        for provider_name in ["groq", "gemini", "deepseek"]:
            try:
                # Create mock intent for testing
                from .enhanced_intent_detection import IntentResult, IntentType
                mock_intent = IntentResult(
                    intent=IntentType.EXPLANATION,
                    confidence=0.9,
                    reasoning="Test intent",
                    complexity_score=0.5,
                    keywords_found=["test"],
                    fallback_needed=False
                )
                
                # Get routing strategy
                routing_strategy = ai_router.get_routing_strategy(mock_intent, "conversational")
                
                # Test the provider
                if provider_name == routing_strategy["primary_api"]:
                    api_response = await ai_router.route_request(
                        messages=test_messages,
                        intent_result=mock_intent,
                        prompt_type="conversational"
                    )
                    
                    provider_results[provider_name] = {
                        "status": "success",
                        "response": api_response.content[:100] + "..." if len(api_response.content) > 100 else api_response.content,
                        "provider": api_response.provider.value,
                        "response_time": api_response.response_time,
                        "token_usage": api_response.token_usage
                    }
                else:
                    provider_results[provider_name] = {
                        "status": "not_primary",
                        "message": "Not the primary provider for this intent"
                    }
                    
            except Exception as e:
                provider_results[provider_name] = {
                    "status": "error",
                    "error": str(e)
                }
        
        return {
            "test_results": provider_results,
            "dev_mode": True,
            "auth_bypassed": True,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"AI providers test error: {str(e)}")
        return {
            "error": str(e),
            "dev_mode": True,
            "auth_bypassed": True
        }

# Helper functions
def _map_intent_to_content_type(intent: IntentType) -> ContentType:
    """Map intent to content type for response formatting"""
    mapping = {
        IntentType.EXPLANATION: ContentType.EXPLANATION,
        IntentType.NOTES: ContentType.NOTES,
        IntentType.QUIZ: ContentType.QUIZ,
        IntentType.PPT: ContentType.PPT,
        IntentType.COMPARISON: ContentType.COMPARISON,
        IntentType.PROBLEM_SOLVING: ContentType.PROBLEM_SOLUTION,
        IntentType.SUMMARY: ContentType.SUMMARY,
        IntentType.SHORT_QUESTIONS: ContentType.EXPLANATION,
        IntentType.LONG_QUESTIONS: ContentType.EXPLANATION,
        IntentType.EXAMPLES: ContentType.EXPLANATION
    }
    return mapping.get(intent, ContentType.EXPLANATION)
