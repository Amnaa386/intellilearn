from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    GROQ_API_KEY: str
    GEMINI_API_KEY: str
    DEEPSEEK_API_KEY: str
    DATABASE_URL: str
    JWT_SECRET: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Development mode settings (optional)
    DEV_MODE: Optional[str] = None
    BYPASS_AUTH: Optional[str] = None
    MOCK_USER_ID: Optional[str] = None
    MOCK_USER_EMAIL: Optional[str] = None
    MOCK_USER_USERNAME: Optional[str] = None
    LOG_BYPASS: Optional[str] = None
    
    # Mock AI settings for testing
    USE_MOCK_AI: Optional[str] = None
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
