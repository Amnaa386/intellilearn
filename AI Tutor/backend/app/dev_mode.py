"""
Development mode configuration for bypassing authentication
"""

import os
from typing import Optional
from dataclasses import dataclass

@dataclass
class DevModeConfig:
    """Configuration for development mode"""
    enabled: bool = False
    bypass_auth: bool = False
    mock_user_id: Optional[int] = 1
    mock_user_email: str = "dev@test.com"
    mock_user_username: str = "dev_user"
    log_bypass_attempts: bool = True

# Global development mode instance
dev_mode = DevModeConfig(
    enabled=os.getenv("DEV_MODE", "false").lower() == "true",
    bypass_auth=os.getenv("BYPASS_AUTH", "false").lower() == "true",
    mock_user_id=int(os.getenv("MOCK_USER_ID", "1")),
    mock_user_email=os.getenv("MOCK_USER_EMAIL", "dev@test.com"),
    mock_user_username=os.getenv("MOCK_USER_USERNAME", "dev_user"),
    log_bypass_attempts=os.getenv("LOG_BYPASS", "true").lower() == "true"
)

def is_dev_mode_enabled() -> bool:
    """Check if development mode is enabled"""
    return dev_mode.enabled

def should_bypass_auth() -> bool:
    """Check if authentication should be bypassed"""
    return dev_mode.enabled and dev_mode.bypass_auth

def get_mock_user():
    """Get mock user for development"""
    from .models import User
    from datetime import datetime
    
    return User(
        id=dev_mode.mock_user_id,
        email=dev_mode.mock_user_email,
        username=dev_mode.mock_user_username,
        is_active=True,
        created_at=datetime.now()
    )

def log_auth_bypass(endpoint: str, reason: str = "Development mode"):
    """Log authentication bypass attempts"""
    if dev_mode.log_bypass_attempts:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"🔓 AUTH BYPASS - Endpoint: {endpoint}, Reason: {reason}")

def get_dev_mode_status() -> dict:
    """Get current development mode status"""
    return {
        "dev_mode_enabled": dev_mode.enabled,
        "auth_bypassed": dev_mode.bypass_auth,
        "mock_user": {
            "id": dev_mode.mock_user_id,
            "email": dev_mode.mock_user_email,
            "username": dev_mode.mock_user_username
        },
        "environment_variables": {
            "DEV_MODE": os.getenv("DEV_MODE", "false"),
            "BYPASS_AUTH": os.getenv("BYPASS_AUTH", "false"),
            "MOCK_USER_ID": os.getenv("MOCK_USER_ID", "1"),
            "MOCK_USER_EMAIL": os.getenv("MOCK_USER_EMAIL", "dev@test.com"),
            "MOCK_USER_USERNAME": os.getenv("MOCK_USER_USERNAME", "dev_user")
        }
    }
