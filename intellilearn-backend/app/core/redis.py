import redis.asyncio as redis
from app.core.config import settings
import logging
import json
from typing import Any, Optional

logger = logging.getLogger(__name__)

# Redis client
redis_client: redis.Redis = None

async def connect_to_redis():
    """Connect to Redis"""
    global redis_client
    try:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        await redis_client.ping()
        logger.info("Connected to Redis successfully")
    except Exception as e:
        logger.warning(f"Failed to connect to Redis: {e}")
        logger.info("Application will continue without Redis cache")
        # Redis is optional for basic functionality
        redis_client = None

async def close_redis_connection():
    """Close Redis connection"""
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("Redis connection closed")

async def set_cache(key: str, value: Any, expire: int = 3600) -> bool:
    """Set cache value"""
    if not redis_client:
        return False
    try:
        serialized_value = json.dumps(value) if not isinstance(value, str) else value
        await redis_client.setex(key, expire, serialized_value)
        return True
    except Exception as e:
        logger.error(f"Failed to set cache: {e}")
        return False

async def get_cache(key: str) -> Optional[Any]:
    """Get cache value"""
    if not redis_client:
        return None
    try:
        value = await redis_client.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None
    except Exception as e:
        logger.error(f"Failed to get cache: {e}")
        return None

async def delete_cache(key: str) -> bool:
    """Delete cache key"""
    if not redis_client:
        return False
    try:
        await redis_client.delete(key)
        return True
    except Exception as e:
        logger.error(f"Failed to delete cache: {e}")
        return False

async def increment_rate_limit(key: str, limit: int, window: int = 60) -> tuple[int, bool]:
    """Rate limiting with Redis"""
    if not redis_client:
        return 0, True  # No rate limiting if Redis is not available
    
    try:
        current = await redis_client.incr(key)
        if current == 1:
            await redis_client.expire(key, window)
        
        is_allowed = current <= limit
        return current, is_allowed
    except Exception as e:
        logger.error(f"Rate limiting error: {e}")
        return 0, True  # Allow on error
