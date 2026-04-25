import asyncio
import httpx
import google.generativeai as genai
import openai
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from enum import Enum
import logging
import time
import json
from .config import settings
from .enhanced_intent_detection import IntentResult, IntentType

logger = logging.getLogger(__name__)

class APIProvider(Enum):
    GROQ = "groq"
    GEMINI = "gemini"
    DEEPSEEK = "deepseek"

class APIStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"

@dataclass
class APIResponse:
    content: str
    provider: APIProvider
    response_time: float
    token_usage: Optional[Dict[str, int]] = None
    metadata: Optional[Dict[str, Any]] = None
    success: bool = True
    error_message: Optional[str] = None

@dataclass
class APIHealthStatus:
    provider: APIProvider
    status: APIStatus
    last_check: float
    consecutive_failures: int
    average_response_time: float
    error_rate: float

class RateLimiter:
    def __init__(self, max_requests_per_minute: int):
        self.max_requests = max_requests_per_minute
        self.requests = []
        self.lock = asyncio.Lock()
    
    async def can_make_request(self) -> bool:
        async with self.lock:
            now = time.time()
            # Remove requests older than 1 minute
            self.requests = [req_time for req_time in self.requests if now - req_time < 60]
            return len(self.requests) < self.max_requests
    
    async def record_request(self):
        async with self.lock:
            self.requests.append(time.time())

class AdvancedAIRouter:
    def __init__(self):
        # Initialize HTTP clients
        self.groq_client = httpx.AsyncClient(timeout=30.0)
        self.gemini_client = genai
        self.deepseek_client = openai.AsyncClient(api_key=settings.DEEPSEEK_API_KEY)
        
        # Configure Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Configure DeepSeek
        self.deepseek_client.api_key = settings.DEEPSEEK_API_KEY
        self.deepseek_client.base_url = "https://api.deepseek.com/v1"
        
        # Rate limiters (requests per minute)
        self.rate_limiters = {
            APIProvider.GROQ: RateLimiter(60),
            APIProvider.GEMINI: RateLimiter(15),
            APIProvider.DEEPSEEK: RateLimiter(30)
        }
        
        # Health tracking
        self.api_health = {
            APIProvider.GROQ: APIHealthStatus(APIProvider.GROQ, APIStatus.HEALTHY, time.time(), 0, 0.0, 0.0),
            APIProvider.GEMINI: APIHealthStatus(APIProvider.GEMINI, APIStatus.HEALTHY, time.time(), 0, 0.0, 0.0),
            APIProvider.DEEPSEEK: APIHealthStatus(APIProvider.DEEPSEEK, APIStatus.HEALTHY, time.time(), 0, 0.0, 0.0)
        }
        
        # API models configuration
        self.api_models = {
            APIProvider.GROQ: {
                "fast": "llama2-70b-4096",
                "balanced": "mixtral-8x7b-32768",
                "quality": "llama3-70b-8192"
            },
            APIProvider.GEMINI: {
                "fast": "gemini-1.5-flash",
                "balanced": "gemini-1.5-pro",
                "quality": "gemini-1.5-pro"
            },
            APIProvider.DEEPSEEK: {
                "fast": "deepseek-chat",
                "balanced": "deepseek-chat",
                "quality": "deepseek-chat"
            }
        }

    async def health_check(self, provider: APIProvider) -> bool:
        """Check API health"""
        try:
            if provider == APIProvider.GROQ:
                response = await self.groq_client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
                )
                return response.status_code == 200
            
            elif provider == APIProvider.GEMINI:
                model = self.gemini_client.GenerativeModel('gemini-pro')
                test_response = await asyncio.to_thread(model.generate_content, "test")
                return bool(test_response.text)
            
            elif provider == APIProvider.DEEPSEEK:
                response = await self.deepseek_client.models.list()
                return len(response.data) > 0
                
        except Exception as e:
            logger.error(f"Health check failed for {provider.value}: {str(e)}")
            return False

    def update_api_health(self, provider: APIProvider, success: bool, response_time: float):
        """Update API health status"""
        health = self.api_health[provider]
        health.last_check = time.time()
        
        if success:
            health.consecutive_failures = 0
            # Update average response time
            if health.average_response_time == 0:
                health.average_response_time = response_time
            else:
                health.average_response_time = (health.average_response_time + response_time) / 2
            
            # Update status based on performance
            if health.consecutive_failures == 0 and health.error_rate < 0.1:
                health.status = APIStatus.HEALTHY
            elif response_time > 10.0:
                health.status = APIStatus.DEGRADED
        else:
            health.consecutive_failures += 1
            if health.consecutive_failures >= 3:
                health.status = APIStatus.FAILED

    async def call_groq_api(self, messages: List[Dict[str, str]], model: str = None, **kwargs) -> APIResponse:
        """Call Groq API with error handling"""
        start_time = time.time()
        
        try:
            # Check rate limit
            if not await self.rate_limiters[APIProvider.GROQ].can_make_request():
                raise Exception("Rate limit exceeded")
            
            # Select model
            if not model:
                model = self.api_models[APIProvider.GROQ]["balanced"]
            
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "messages": messages,
                "temperature": kwargs.get("temperature", 0.7),
                "max_tokens": kwargs.get("max_tokens", 1024)
            }
            
            response = await self.groq_client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload
            )
            
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                token_usage = result.get("usage", {})
                
                await self.rate_limiters[APIProvider.GROQ].record_request()
                self.update_api_health(APIProvider.GROQ, True, response_time)
                
                return APIResponse(
                    content=content,
                    provider=APIProvider.GROQ,
                    response_time=response_time,
                    token_usage=token_usage,
                    metadata={"model": model}
                )
            else:
                error_msg = f"Groq API error: {response.status_code} - {response.text}"
                logger.error(error_msg)
                self.update_api_health(APIProvider.GROQ, False, response_time)
                return APIResponse(
                    content="",
                    provider=APIProvider.GROQ,
                    response_time=response_time,
                    success=False,
                    error_message=error_msg
                )
                
        except Exception as e:
            response_time = time.time() - start_time
            error_msg = f"Groq service error: {str(e)}"
            logger.error(error_msg)
            self.update_api_health(APIProvider.GROQ, False, response_time)
            return APIResponse(
                content="",
                provider=APIProvider.GROQ,
                response_time=response_time,
                success=False,
                error_message=error_msg
            )

    async def call_gemini_api(self, prompt: str, model: str = None, **kwargs) -> APIResponse:
        """Call Gemini API with error handling"""
        start_time = time.time()
        
        try:
            # Check rate limit
            if not await self.rate_limiters[APIProvider.GEMINI].can_make_request():
                raise Exception("Rate limit exceeded")
            
            # Select model
            if not model:
                model = self.api_models[APIProvider.GEMINI]["balanced"]
            
            # Configure generation
            generation_config = {
                "temperature": kwargs.get("temperature", 0.7),
                "max_output_tokens": kwargs.get("max_tokens", 2048),
                "candidate_count": 1
            }
            
            # Run in thread to avoid blocking
            model_instance = self.gemini_client.GenerativeModel(model)
            response = await asyncio.to_thread(
                model_instance.generate_content, 
                prompt, 
                generation_config=genai.types.GenerationConfig(**generation_config)
            )
            
            response_time = time.time() - start_time
            
            if response.text:
                await self.rate_limiters[APIProvider.GEMINI].record_request()
                self.update_api_health(APIProvider.GEMINI, True, response_time)
                
                return APIResponse(
                    content=response.text,
                    provider=APIProvider.GEMINI,
                    response_time=response_time,
                    metadata={"model": model}
                )
            else:
                error_msg = "Gemini returned empty response"
                logger.error(error_msg)
                self.update_api_health(APIProvider.GEMINI, False, response_time)
                return APIResponse(
                    content="",
                    provider=APIProvider.GEMINI,
                    response_time=response_time,
                    success=False,
                    error_message=error_msg
                )
                
        except Exception as e:
            response_time = time.time() - start_time
            error_msg = f"Gemini service error: {str(e)}"
            logger.error(error_msg)
            self.update_api_health(APIProvider.GEMINI, False, response_time)
            return APIResponse(
                content="",
                provider=APIProvider.GEMINI,
                response_time=response_time,
                success=False,
                error_message=error_msg
            )

    async def call_deepseek_api(self, messages: List[Dict[str, str]], model: str = None, **kwargs) -> APIResponse:
        """Call DeepSeek API with error handling"""
        start_time = time.time()
        
        try:
            # Check rate limit
            if not await self.rate_limiters[APIProvider.DEEPSEEK].can_make_request():
                raise Exception("Rate limit exceeded")
            
            # Select model
            if not model:
                model = self.api_models[APIProvider.DEEPSEEK]["balanced"]
            
            response = await self.deepseek_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 2048)
            )
            
            response_time = time.time() - start_time
            
            if response.choices and response.choices[0].message.content:
                content = response.choices[0].message.content
                token_usage = response.usage.model_dump() if response.usage else {}
                
                await self.rate_limiters[APIProvider.DEEPSEEK].record_request()
                self.update_api_health(APIProvider.DEEPSEEK, True, response_time)
                
                return APIResponse(
                    content=content,
                    provider=APIProvider.DEEPSEEK,
                    response_time=response_time,
                    token_usage=token_usage,
                    metadata={"model": model}
                )
            else:
                error_msg = "DeepSeek returned empty response"
                logger.error(error_msg)
                self.update_api_health(APIProvider.DEEPSEEK, False, response_time)
                return APIResponse(
                    content="",
                    provider=APIProvider.DEEPSEEK,
                    response_time=response_time,
                    success=False,
                    error_message=error_msg
                )
                
        except Exception as e:
            response_time = time.time() - start_time
            error_msg = f"DeepSeek service error: {str(e)}"
            logger.error(error_msg)
            self.update_api_health(APIProvider.DEEPSEEK, False, response_time)
            return APIResponse(
                content="",
                provider=APIProvider.DEEPSEEK,
                response_time=response_time,
                success=False,
                error_message=error_msg
            )

    async def route_request(self, messages: List[Dict[str, str]], intent_result: IntentResult, 
                           prompt_type: str = "conversational", **kwargs) -> APIResponse:
        """Intelligent request routing with fallback logic"""
        
        # Get routing recommendation
        routing = self.get_routing_strategy(intent_result, prompt_type)
        
        # Try primary API first
        primary_provider = APIProvider(routing["primary_api"])
        
        logger.info(f"Routing request to {primary_provider.value} (intent: {intent_result.intent.value})")
        
        response = await self._call_api(primary_provider, messages, intent_result, **kwargs)
        
        if response.success:
            return response
        
        # Try fallback APIs in order
        for fallback_api_name in routing["fallback_apis"]:
            fallback_provider = APIProvider(fallback_api_name)
            
            # Skip if API is failed
            if self.api_health[fallback_provider].status == APIStatus.FAILED:
                logger.warning(f"Skipping {fallback_provider.value} - API marked as failed")
                continue
            
            logger.info(f"Falling back to {fallback_provider.value}")
            response = await self._call_api(fallback_provider, messages, intent_result, **kwargs)
            
            if response.success:
                return response
        
        # If all APIs fail, return error response
        return APIResponse(
            content="I'm experiencing technical difficulties. Please try again in a moment.",
            provider=primary_provider,
            response_time=0.0,
            success=False,
            error_message="All APIs failed"
        )

    async def _call_api(self, provider: APIProvider, messages: List[Dict[str, str]], 
                       intent_result: IntentResult, **kwargs) -> APIResponse:
        """Call specific API based on provider"""
        
        if provider == APIProvider.GROQ:
            return await self.call_groq_api(messages, **kwargs)
        
        elif provider == APIProvider.GEMINI:
            # Convert messages to prompt for Gemini
            prompt = self._messages_to_prompt(messages, intent_result)
            return await self.call_gemini_api(prompt, **kwargs)
        
        elif provider == APIProvider.DEEPSEEK:
            return await self.call_deepseek_api(messages, **kwargs)
        
        else:
            raise ValueError(f"Unknown provider: {provider}")

    def _messages_to_prompt(self, messages: List[Dict[str, str]], intent_result: IntentResult) -> str:
        """Convert chat messages to prompt for Gemini"""
        prompt_parts = []
        
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            
            if role == "system":
                prompt_parts.append(f"System: {content}")
            elif role == "user":
                prompt_parts.append(f"User: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")
        
        return "\n\n".join(prompt_parts)

    def get_routing_strategy(self, intent_result: IntentResult, prompt_type: str) -> Dict[str, Any]:
        """Get optimal routing strategy based on intent and system state"""
        
        # Base routing by intent
        intent_routing = {
            IntentType.NOTES: {
                "primary": "gemini",
                "fallbacks": ["deepseek", "groq"],
                "requires_structured": True
            },
            IntentType.PPT: {
                "primary": "gemini",
                "fallbacks": ["deepseek", "groq"],
                "requires_structured": True
            },
            IntentType.QUIZ: {
                "primary": "gemini",
                "fallbacks": ["deepseek", "groq"],
                "requires_structured": True
            },
            IntentType.EXPLANATION: {
                "primary": "groq" if intent_result.complexity_score < 0.6 else "deepseek",
                "fallbacks": ["deepseek", "gemini"],
                "requires_structured": False
            },
            IntentType.LONG_QUESTIONS: {
                "primary": "deepseek",
                "fallbacks": ["groq", "gemini"],
                "requires_structured": False
            },
            IntentType.COMPARISON: {
                "primary": "deepseek",
                "fallbacks": ["groq", "gemini"],
                "requires_structured": False
            },
            IntentType.PROBLEM_SOLVING: {
                "primary": "deepseek",
                "fallbacks": ["groq", "gemini"],
                "requires_structured": False
            }
        }
        
        # Get base strategy
        base_strategy = intent_routing.get(intent_result.intent, {
            "primary": "groq",
            "fallbacks": ["deepseek", "gemini"],
            "requires_structured": False
        })
        
        # Adjust based on API health
        primary_provider = APIProvider(base_strategy["primary"])
        if self.api_health[primary_provider].status == APIStatus.FAILED:
            # Move to next available API
            for fallback in base_strategy["fallbacks"]:
                fallback_provider = APIProvider(fallback)
                if self.api_health[fallback_provider].status != APIStatus.FAILED:
                    base_strategy["primary"] = fallback
                    base_strategy["fallbacks"] = [f for f in base_strategy["fallbacks"] if f != fallback]
                    break
        
        return {
            "primary_api": base_strategy["primary"],
            "fallback_apis": base_strategy["fallbacks"],
            "requires_structured_output": base_strategy["requires_structured"],
            "prompt_type": prompt_type
        }

    def get_system_status(self) -> Dict[str, Any]:
        """Get overall system status"""
        return {
            "api_health": {
                provider.value: {
                    "status": health.status.value,
                    "consecutive_failures": health.consecutive_failures,
                    "average_response_time": health.average_response_time,
                    "last_check": health.last_check
                }
                for provider, health in self.api_health.items()
            },
            "rate_limits": {
                provider.value: {
                    "max_per_minute": limiter.max_requests,
                    "current_usage": len(limiter.requests)
                }
                for provider, limiter in self.rate_limiters.items()
            }
        }

    async def cleanup(self):
        """Cleanup resources"""
        await self.groq_client.aclose()
