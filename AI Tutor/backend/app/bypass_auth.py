"""
Authentication bypass utilities for development/testing
"""

from functools import wraps
from fastapi import HTTPException, status
from typing import Optional
import logging

from .dev_mode import should_bypass_auth, get_mock_user, log_auth_bypass

logger = logging.getLogger(__name__)

def optional_auth(dependency=None):
    """
    Dependency that optionally requires authentication based on dev mode
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if should_bypass_auth():
                # Bypass authentication and use mock user
                log_auth_bypass(func.__name__, "Development mode - optional auth bypass")
                return await func(*args, **kwargs)
            else:
                # Use actual authentication
                if dependency:
                    return await func(dependency=dependency, *args, **kwargs)
                else:
                    return await func(*args, **kwargs)
        return wrapper
    return decorator

def mock_current_user():
    """
    Dependency that returns mock user when auth is bypassed
    """
    if should_bypass_auth():
        log_auth_bypass("mock_current_user", "Returning mock user")
        return get_mock_user()
    else:
        # This will be handled by actual auth dependency
        from .auth import get_current_active_user
        return get_current_active_user

def create_dev_endpoint(original_endpoint_func):
    """
    Create a development version of an endpoint that bypasses auth
    """
    @wraps(original_endpoint_func)
    async def dev_wrapper(*args, **kwargs):
        if should_bypass_auth():
            log_auth_bypass(original_endpoint_func.__name__, "Development endpoint bypass")
            # Remove auth dependency and call with mock user
            new_kwargs = kwargs.copy()
            
            # Remove auth dependencies and replace with mock user
            auth_deps_to_remove = ['current_user', 'db']
            for dep in auth_deps_to_remove:
                if dep in new_kwargs:
                    del new_kwargs[dep]
            
            # Add mock user if needed
            if 'current_user' in original_endpoint_func.__code__.co_varnames:
                new_kwargs['current_user'] = get_mock_user()
            
            return await original_endpoint_func(*args, **new_kwargs)
        else:
            # Call original function normally
            return await original_endpoint_func(*args, **kwargs)
    
    # Copy function metadata
    dev_wrapper.__name__ = original_endpoint_func.__name__
    dev_wrapper.__doc__ = original_endpoint_func.__doc__
    
    return dev_wrapper

class AuthBypassMiddleware:
    """
    Middleware to handle authentication bypass for development
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if should_bypass_auth():
            # Add auth bypass headers
            scope = dict(scope)
            headers = dict(scope.get('headers', []))
            headers.append((b'x-auth-bypass', b'true'))
            headers.append((b'x-dev-mode', b'enabled'))
            scope['headers'] = headers
            
            log_auth_bypass("middleware", "Request intercepted by auth bypass middleware")
        
        await self.app(scope, receive, send)

def get_bypass_status():
    """
    Get current authentication bypass status
    """
    from .dev_mode import get_dev_mode_status
    return get_dev_mode_status()
