from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from app.core.redis import increment_rate_limit
import logging
import time

logger = logging.getLogger(__name__)

class RateLimiterMiddleware:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            # Get client IP
            client_ip = request.client.host
            if "x-forwarded-for" in request.headers:
                client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()
            
            # Global rate limiting
            current, allowed = await increment_rate_limit(f"global:{client_ip}", 100, 60)  # 100 per minute
            if not allowed:
                response = JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Too many requests. Please try again later."}
                )
                await response(scope, receive, send)
                return
            
            # Add rate limit headers
            start_time = time.time()
            
            async def send_wrapper(message):
                if message["type"] == "http.response.start":
                    # Add rate limit headers
                    headers = list(message.get("headers", []))
                    headers.append((b"x-ratelimit-limit", b"100"))
                    headers.append((b"x-ratelimit-remaining", str(max(0, 100 - current)).encode()))
                    headers.append((b"x-ratelimit-reset", str(int(time.time() + 60)).encode()))
                    message["headers"] = headers
                
                await send(message)
            
            await self.app(scope, receive, send_wrapper)
        else:
            await self.app(scope, receive, send)
