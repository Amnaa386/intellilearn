"""
Authentication Configuration
Control authentication behavior with simple flags
"""

# Set to False to disable authentication for testing
AUTH_ENABLED = False

# Development mode settings
DEV_MODE = {
    "enabled": True,
    "bypass_auth": True,
    "log_bypass_attempts": True,
}

# Test mode - allows all AI features without login
TEST_MODE = {
    "enabled": True,
    "allow_chat_without_auth": True,
    "allow_all_features": True,
}

def is_auth_enabled():
    """Check if authentication is enabled"""
    return AUTH_ENABLED

def is_dev_mode_enabled():
    """Check if development mode is enabled"""
    return DEV_MODE.get("enabled", False)

def should_bypass_auth():
    """Check if authentication should be bypassed"""
    return not AUTH_ENABLED or DEV_MODE.get("bypass_auth", False) or TEST_MODE.get("allow_chat_without_auth", False)
