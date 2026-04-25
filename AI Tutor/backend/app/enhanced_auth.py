"""
Enhanced authentication system with comprehensive error handling and debugging
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import exc as sqlalchemy_exc
import logging

from .database import get_db
from .models import User
from .schemas import TokenData
from .config import settings

logger = logging.getLogger(__name__)

# Enhanced password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password with detailed error handling"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password verification service unavailable"
        )

def get_password_hash(password: str) -> str:
    """Hash password with validation and error handling"""
    try:
        # Validate password strength
        if len(password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long"
            )
        
        if not any(c.isalpha() for c in password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one letter"
            )
        
        if not any(c.isdigit() for c in password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one number"
            )
        
        return pwd_context.hash(password)
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Password hashing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password hashing service unavailable"
        )

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email with enhanced error handling"""
    try:
        return db.query(User).filter(User.email == email).first()
    except Exception as e:
        logger.error(f"Database error fetching user by email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database service unavailable"
        )

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username with enhanced error handling"""
    try:
        return db.query(User).filter(User.username == username).first()
    except Exception as e:
        logger.error(f"Database error fetching user by username: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database service unavailable"
        )

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Enhanced user authentication with detailed error reporting"""
    try:
        # Try email first
        user = get_user_by_email(db, username)
        
        if not user:
            # Try username as fallback
            user = get_user_by_username(db, username)
            
        if not user:
            logger.warning(f"Authentication failed for: {username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        if not verify_password(password, user.hashed_password):
            logger.warning(f"Password verification failed for user: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Check if user is active
        if not user.is_active:
            logger.warning(f"Authentication attempt for inactive user: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account has been deactivated"
            )
        
        logger.info(f"User authenticated successfully: {user.email}")
        return user
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service unavailable"
        )

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT token with enhanced error handling"""
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
        return encoded_jwt
        
    except Exception as e:
        logger.error(f"Token creation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token generation service unavailable"
        )

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Enhanced current user extraction with comprehensive error handling"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        if not token:
            logger.warning("No token provided")
            raise credentials_exception
        
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                logger.warning("Invalid token payload: missing username")
                raise credentials_exception
            
        except JWTError as e:
            logger.warning(f"JWT decode error: {str(e)}")
            raise credentials_exception
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            raise credentials_exception
        
        # Get user from database
        user = get_user_by_email(db, username)
        
        if user is None:
            logger.warning(f"User not found in database: {username}")
            raise credentials_exception
        
        # Check token expiration
        exp = payload.get("exp")
        if exp is None:
            logger.warning("Token missing expiration")
            raise credentials_exception
        
        try:
            expiration_time = datetime.fromtimestamp(exp)
            if datetime.utcnow() > expiration_time:
                logger.warning(f"Token expired for user: {username}")
                raise credentials_exception
        except Exception as e:
            logger.error(f"Token expiration check error: {str(e)}")
            raise credentials_exception
        
        return user
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Current user extraction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User authentication service unavailable"
        )

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Get current active user with validation"""
    if not current_user.is_active:
        logger.warning(f"Inactive user attempted access: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is not active"
        )
    return current_user

def validate_email_format(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username_format(username: str) -> bool:
    """Validate username format"""
    if not username:
        return False
    
    if len(username) < 3:
        return False
    
    if len(username) > 30:
        return False
    
    # Allow letters, numbers, underscores, hyphens
    import re
    pattern = r'^[a-zA-Z0-9_-]{3,30}$'
    return re.match(pattern, username) is not None

def get_detailed_error_response(error_type: str, details: Dict[str, Any] = None) -> Dict[str, Any]:
    """Generate detailed error response for debugging"""
    error_response = {
        "error": error_type,
        "timestamp": datetime.utcnow().isoformat(),
        "details": details or {}
    }
    
    if error_type == "validation_error":
        error_response.update({
            "field_errors": details.get("field_errors", []),
            "suggestions": [
                "Check all required fields are filled",
                "Ensure email format is valid",
                "Password must be at least 6 characters"
            ]
        })
    
    elif error_type == "duplicate_error":
        error_response.update({
            "duplicate_field": details.get("duplicate_field"),
            "suggestions": [
                "Try a different email address",
                "Choose a different username",
                "Use password recovery if account exists"
            ]
        })
    
    elif error_type == "database_error":
        error_response.update({
            "database_issue": True,
            "suggestions": [
                "Try again in a few moments",
                "Contact support if issue persists",
                "Check database connection"
            ]
        })
    
    return error_response

class RateLimiter:
    """Simple rate limiter for registration attempts"""
    def __init__(self, max_attempts: int = 5, window_minutes: int = 15):
        self.max_attempts = max_attempts
        self.window_minutes = window_minutes
        self.attempts = {}
    
    def is_rate_limited(self, identifier: str) -> bool:
        """Check if identifier is rate limited"""
        now = datetime.utcnow()
        
        # Clean old attempts
        self.attempts = {
            key: attempts for key, attempts in self.attempts.items()
            if now - attempts["timestamp"] < timedelta(minutes=self.window_minutes)
        }
        
        user_attempts = self.attempts.get(identifier, {"count": 0, "timestamp": now})
        
        if user_attempts["count"] >= self.max_attempts:
            return True
        
        return False
    
    def record_attempt(self, identifier: str):
        """Record a registration attempt"""
        self.attempts[identifier] = {
            "count": self.attempts.get(identifier, {"count": 0})["count"] + 1,
            "timestamp": datetime.utcnow()
        }

# Global rate limiter instance
registration_rate_limiter = RateLimiter()
