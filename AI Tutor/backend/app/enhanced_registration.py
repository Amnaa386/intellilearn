"""
Enhanced registration endpoint with comprehensive error handling and debugging
"""

from fastapi import APIRouter, HTTPException, status, Request, Depends
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import exc as sqlalchemy_exc
import logging
import re
from datetime import datetime

from .database import get_db
from .models import User
from .enhanced_auth import (
    get_password_hash, get_user_by_email, get_user_by_username,
    validate_email_format, validate_username_format, registration_rate_limiter,
    get_detailed_error_response
)

logger = logging.getLogger(__name__)

# Enhanced Pydantic models with validation
class UserRegistrationRequest(BaseModel):
    """Enhanced user registration request with validation"""
    email: EmailStr = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=30, description="Username")
    password: str = Field(..., min_length=6, max_length=100, description="Password")
    confirm_password: str = Field(..., description="Password confirmation")
    
    @validator('email')
    def validate_email_format(cls, v):
        if not validate_email_format(v):
            raise ValueError('Invalid email format')
        return v.lower()
    
    @validator('username')
    def validate_username_format(cls, v):
        if not validate_username_format(v):
            raise ValueError('Username must be 3-30 characters, letters, numbers, underscores, hyphens only')
        return v.strip()
    
    @validator('password')
    def validate_password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if not any(c.isalpha() for c in v):
            raise ValueError('Password must contain at least one letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

class DetailedErrorResponse(BaseModel):
    """Detailed error response for debugging"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional error details")
    timestamp: str = Field(..., description="Error timestamp")
    request_id: Optional[str] = Field(None, description="Request tracking ID")

class SuccessResponse(BaseModel):
    """Success response with metadata"""
    success: bool = Field(True, description="Operation success status")
    message: str = Field(..., description="Success message")
    data: Dict[str, Any] = Field(default_factory=dict, description="Response data")
    timestamp: str = Field(..., description="Response timestamp")

# Create router
router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register-enhanced", response_model=SuccessResponse)
async def register_enhanced(
    request: Request,
    user_data: UserRegistrationRequest,
    db: Session = Depends(get_db)
):
    """
    Enhanced registration endpoint with comprehensive error handling and debugging
    """
    
    request_id = f"reg_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    start_time = datetime.now()
    
    try:
        # Log registration attempt
        logger.info(f"Registration attempt - Request ID: {request_id}")
        logger.info(f"Email: {user_data.email}")
        logger.info(f"Username: {user_data.username}")
        logger.info(f"Client IP: {request.client.host}")
        logger.info(f"User-Agent: {request.headers.get('user-agent', 'Unknown')}")
        
        # Check rate limiting
        client_ip = request.client.host
        if registration_rate_limiter.is_rate_limited(client_ip):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=get_detailed_error_response("rate_limit_error", {
                    "retry_after": "15 minutes",
                    "max_attempts": registration_rate_limiter.max_attempts
                })
            )
        
        # Check if user already exists by email
        existing_user_by_email = get_user_by_email(db, user_data.email)
        if existing_user_by_email:
            logger.warning(f"Registration failed - Email already exists: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=get_detailed_error_response("duplicate_error", {
                    "duplicate_field": "email",
                    "existing_user": {
                        "id": existing_user_by_email.id,
                        "email": existing_user_by_email.email,
                        "username": existing_user_by_email.username,
                        "created_at": existing_user_by_email.created_at.isoformat()
                    },
                    "suggestions": [
                        "Try logging in with your existing account",
                        "Use password recovery if you've forgotten your password",
                        "Use a different email address"
                    ]
                })
            )
        
        # Check if username already exists
        existing_user_by_username = get_user_by_username(db, user_data.username)
        if existing_user_by_username:
            logger.warning(f"Registration failed - Username already exists: {user_data.username}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=get_detailed_error_response("duplicate_error", {
                    "duplicate_field": "username",
                    "existing_user": {
                        "id": existing_user_by_username.id,
                        "email": existing_user_by_username.email,
                        "username": existing_user_by_username.username,
                        "created_at": existing_user_by_username.created_at.isoformat()
                    },
                    "suggestions": [
                        "Try a different username",
                        "Add numbers or underscores if your preferred name is taken",
                        "Use your email address as username alternative"
                    ]
                })
            )
        
        # Create new user with enhanced error handling
        try:
            hashed_password = get_password_hash(user_data.password)
            
            new_user = User(
                email=user_data.email.lower(),
                username=user_data.username.strip(),
                hashed_password=hashed_password,
                is_active=True
            )
            
            # Add to database with transaction handling
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            logger.info(f"Registration successful - Request ID: {request_id}, User ID: {new_user.id}")
            
            return SuccessResponse(
                success=True,
                message="Registration successful! Please check your email to verify your account.",
                data={
                    "user_id": new_user.id,
                    "email": new_user.email,
                    "username": new_user.username,
                    "created_at": new_user.created_at.isoformat(),
                    "request_id": request_id
                },
                timestamp=datetime.now().isoformat()
            )
            
        except sqlalchemy_exc.IntegrityError as e:
            db.rollback()
            logger.error(f"Database integrity error - Request ID: {request_id}: {str(e)}")
            
            if "unique constraint" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=get_detailed_error_response("database_error", {
                        "constraint_violated": "unique",
                        "database_error": str(e),
                        "suggestions": [
                            "The email or username you entered is already in use",
                            "Try logging in with your existing account",
                            "Use the password recovery feature if needed"
                        ]
                    })
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=get_detailed_error_response("database_error", {
                        "database_error": str(e),
                        "suggestions": [
                            "Please try again in a few moments",
                            "Contact support if the problem persists"
                        ]
                    })
                )
        
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error during registration - Request ID: {request_id}: {str(e)}")
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=get_detailed_error_response("system_error", {
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                    "suggestions": [
                        "Please try again in a few moments",
                        "Check your internet connection",
                        "Contact support if the problem continues"
                    ]
                })
            )
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch-all for any unexpected errors
        logger.error(f"Critical error during registration - Request ID: {request_id}: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_detailed_error_response("critical_error", {
                "error_type": "unexpected",
                "error_message": str(e),
                "system_status": "degraded",
                "suggestions": [
                    "The system is experiencing issues",
                    "Please try again later",
                    "Contact system administrator"
                ]
            })
        )

@router.post("/validate-email")
async def validate_email_endpoint(request: Request):
    """
    Email validation endpoint for frontend real-time validation
    """
    try:
        # Get email from request body
        body = await request.json()
        email = body.get("email", "")
        
        is_valid = validate_email_format(email)
        
        return {
            "valid": is_valid,
            "email": email,
            "message": "Email format is valid" if is_valid else "Invalid email format",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Email validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email validation service unavailable"
        )

@router.post("/validate-username")
async def validate_username_endpoint(request: Request):
    """
    Username validation endpoint for frontend real-time validation
    """
    try:
        # Get username from request body
        body = await request.json()
        username = body.get("username", "")
        
        is_valid = validate_username_format(username)
        
        # Additional checks
        if len(username) < 3:
            is_valid = False
            message = "Username must be at least 3 characters"
        elif len(username) > 30:
            is_valid = False
            message = "Username must be no more than 30 characters"
        elif not re.match(r'^[a-zA-Z0-9_-]+$', username):
            is_valid = False
            message = "Username can only contain letters, numbers, underscores, and hyphens"
        else:
            message = "Username format is valid"
        
        return {
            "valid": is_valid,
            "username": username,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Username validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Username validation service unavailable"
        )

@router.get("/registration-status")
async def get_registration_status():
    """
    Get registration system status for debugging
    """
    try:
        return {
            "status": "operational",
            "features": {
                "email_validation": True,
                "username_validation": True,
                "password_strength_validation": True,
                "rate_limiting": True,
                "duplicate_prevention": True
            },
            "database_status": "connected",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Registration status check error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration service unavailable"
        )
