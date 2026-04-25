from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import asyncio
import logging
from datetime import datetime

from .enhanced_intent_detection import EnhancedIntentDetector, IntentType
from .advanced_ai_router import AdvancedAIRouter
from .prompt_templates import PromptTemplateManager
from .response_formatter import ResponseFormatter, ContentType
from .auth import get_current_active_user
from .models import User
from .database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Pydantic models for API
class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role (user, assistant, system)")
    content: str = Field(..., description="Message content")
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="Chat conversation history")
    user_query: str = Field(..., description="Current user query")
    context: Optional[str] = Field(None, description="Additional context for the query")
    session_id: Optional[str] = Field(None, description="Session identifier")
    user_preferences: Optional[Dict[str, Any]] = Field(None, description="User preferences")

class ChatResponse(BaseModel):
    response: str = Field(..., description="AI response content")
    content_type: str = Field(..., description="Type of content generated")
    intent_detected: str = Field(..., description="Detected user intent")
    confidence_score: float = Field(..., description="Confidence in intent detection")
    provider_used: str = Field(..., description="AI provider used")
    response_time: float = Field(..., description="Response generation time")
    structured_data: Optional[Dict[str, Any]] = Field(None, description="Structured response data")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class HealthResponse(BaseModel):
    status: str
    api_health: Dict[str, Any]
    system_metrics: Dict[str, Any]

# Security
security = HTTPBearer()

# Initialize components
intent_detector = EnhancedIntentDetector()
ai_router = AdvancedAIRouter()
prompt_manager = PromptTemplateManager()
response_formatter = ResponseFormatter()

# Create router
router = APIRouter(prefix="/api", tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Enhanced chat endpoint with intelligent AI routing
    
    This endpoint:
    1. Detects user intent with high accuracy
    2. Routes to optimal AI provider based on intent and system health
    3. Uses optimized prompts for each content type
    4. Provides structured responses with proper formatting
    5. Includes comprehensive error handling and fallbacks
    """
    
    start_time = datetime.now()
    
    try:
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
                "response_time": api_response.response_time
            }
        )
        
        # Calculate total processing time
        total_time = (datetime.now() - start_time).total_seconds()
        
        # Log successful response
        logger.info(f"Response generated successfully using {api_response.provider.value} in {total_time:.2f}s")
        
        # Add background task for analytics/monitoring
        background_tasks.add_task(
            log_chat_interaction,
            user_id=current_user.id,
            query=request.user_query,
            intent=intent_result.intent.value,
            provider=api_response.provider.value,
            response_time=total_time,
            success=True
        )
        
        return ChatResponse(
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
                "validation_errors": formatted_response.error_info.get("validation_errors", []) if formatted_response.error_info else []
            }
        )
        
    except Exception as e:
        # Log error
        logger.error(f"Chat endpoint error: {str(e)}")
        
        # Add background task for error logging
        background_tasks.add_task(
            log_chat_interaction,
            user_id=current_user.id,
            query=request.user_query,
            intent="error",
            provider="none",
            response_time=(datetime.now() - start_time).total_seconds(),
            success=False,
            error=str(e)
        )
        
        # Return user-friendly error
        raise HTTPException(
            status_code=500,
            detail="I'm experiencing technical difficulties. Please try again in a moment."
        )

@router.post("/chat/stream")
async def chat_stream_endpoint(
    request: ChatRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: User = Depends(get_current_active_user)
):
    """
    Streaming chat endpoint for real-time responses
    """
    # This would implement Server-Sent Events for streaming
    # Implementation would be similar to chat_endpoint but with streaming
    raise HTTPException(status_code=501, detail="Streaming not yet implemented")

@router.post("/detect-intent")
async def detect_intent_endpoint(
    query: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: User = Depends(get_current_active_user)
):
    """
    Standalone intent detection endpoint for testing
    """
    try:
        intent_result = await intent_detector.detect_intent(query)
        
        return {
            "intent": intent_result.intent.value,
            "confidence": intent_result.confidence,
            "complexity_score": intent_result.complexity_score,
            "keywords_found": intent_result.keywords_found,
            "reasoning": intent_result.reasoning,
            "fallback_needed": intent_result.fallback_needed,
            "routing_recommendation": ai_router.get_api_routing_recommendation(intent_result)
        }
        
    except Exception as e:
        logger.error(f"Intent detection error: {str(e)}")
        raise HTTPException(status_code=500, detail="Intent detection failed")

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Comprehensive health check endpoint
    """
    try:
        # Get system status
        system_status = ai_router.get_system_status()
        
        # Check if any APIs are failed
        failed_apis = [
            provider for provider, health in system_status["api_health"].items()
            if health["status"] == "failed"
        ]
        
        overall_status = "healthy" if not failed_apis else "degraded"
        
        return HealthResponse(
            status=overall_status,
            api_health=system_status["api_health"],
            system_metrics={
                "rate_limits": system_status["rate_limits"],
                "timestamp": datetime.now().isoformat(),
                "failed_apis": failed_apis
            }
        )
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        raise HTTPException(status_code=500, detail="Health check failed")

@router.get("/providers/status")
async def providers_status():
    """
    Get detailed status of all AI providers
    """
    try:
        return ai_router.get_system_status()
    except Exception as e:
        logger.error(f"Provider status error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get provider status")

@router.post("/providers/test/{provider}")
async def test_provider(
    provider: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: User = Depends(get_current_active_user)
):
    """
    Test a specific AI provider
    """
    try:
        from .advanced_ai_router import APIProvider
        
        provider_enum = APIProvider(provider)
        is_healthy = await ai_router.health_check(provider_enum)
        
        return {
            "provider": provider,
            "status": "healthy" if is_healthy else "unhealthy",
            "timestamp": datetime.now().isoformat()
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid provider: {provider}")
    except Exception as e:
        logger.error(f"Provider test error: {str(e)}")
        raise HTTPException(status_code=500, detail="Provider test failed")

@router.get("/templates/available")
async def get_available_templates():
    """
    Get list of available prompt templates
    """
    try:
        templates = {}
        
        for intent in IntentType:
            templates[intent.value] = {
                "groq": {
                    "temperature": prompt_manager.templates.get(intent.value, {}).get("groq", {}).temperature,
                    "max_tokens": prompt_manager.templates.get(intent.value, {}).get("groq", {}).max_tokens,
                    "response_format": prompt_manager.templates.get(intent.value, {}).get("groq", {}).response_format
                },
                "gemini": {
                    "temperature": prompt_manager.templates.get(intent.value, {}).get("gemini", {}).temperature,
                    "max_tokens": prompt_manager.templates.get(intent.value, {}).get("gemini", {}).max_tokens,
                    "response_format": prompt_manager.templates.get(intent.value, {}).get("gemini", {}).response_format
                },
                "deepseek": {
                    "temperature": prompt_manager.templates.get(intent.value, {}).get("deepseek", {}).temperature,
                    "max_tokens": prompt_manager.templates.get(intent.value, {}).get("deepseek", {}).max_tokens,
                    "response_format": prompt_manager.templates.get(intent.value, {}).get("deepseek", {}).response_format
                }
            }
        
        return templates
        
    except Exception as e:
        logger.error(f"Template listing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get templates")

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

async def log_chat_interaction(
    user_id: int,
    query: str,
    intent: str,
    provider: str,
    response_time: float,
    success: bool,
    error: str = None
):
    """
    Background task to log chat interactions for analytics
    """
    try:
        # This would log to database or analytics service
        logger.info(f"Chat interaction logged: user={user_id}, intent={intent}, provider={provider}, time={response_time:.2f}s, success={success}")
        
        # Additional analytics logic could be added here
        # - Store in database
        # - Send to analytics service
        # - Update metrics
        
    except Exception as e:
        logger.error(f"Failed to log chat interaction: {str(e)}")

# Cleanup on shutdown
async def cleanup():
    """Cleanup resources"""
    await ai_router.cleanup()
