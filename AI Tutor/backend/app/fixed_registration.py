"""
Fixed registration endpoint with comprehensive error handling and debugging
"""

from fastapi import APIRouter, HTTPException, status, Request, Depends
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import exc as sqlalchemy_exc
import logging
from datetime import datetime

from .database import get_db
from .models import User
from .auth import get_password_hash

logger = logging.getLogger(__name__)

# Enhanced request model with validation
class UserRegistrationRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    password: str = Field(..., min_length=6, max_length=100, description="Password")
    
    @validator('email')
    def email_to_lowercase(cls, v):
        return v.lower().strip()
    
    @validator('username')
    def clean_username(cls, v):
        return v.strip()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

# Response models
class RegistrationResponse(BaseModel):
    id: int
    email: str
    username: str
    is_active: bool
    created_at: datetime

class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: str

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register-fixed", response_model=RegistrationResponse)
async def register_fixed(
    request: Request,
    user_data: UserRegistrationRequest,
    db: Session = Depends(get_db)
):
    """
    Fixed registration endpoint with comprehensive error handling
    """
    
    request_id = f"reg_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    logger.info(f"Registration attempt - Request ID: {request_id}")
    logger.info(f"Email: {user_data.email}")
    logger.info(f"Username: {user_data.username}")
    logger.info(f"Client IP: {request.client.host}")
    
    try:
        # Validate database connection
        try:
            db.execute("SELECT 1")
            logger.info("Database connection verified")
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service unavailable"
            )
        
        # Check if user already exists by email
        try:
            existing_user_by_email = db.query(User).filter(User.email == user_data.email).first()
            if existing_user_by_email:
                logger.warning(f"Registration failed - Email already exists: {user_data.email}")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "error": "email_exists",
                        "message": "Email already registered",
                        "existing_user": {
                            "id": existing_user_by_email.id,
                            "email": existing_user_by_email.email,
                            "username": existing_user_by_username.username if existing_user_by_username else "N/A"
                        },
                        "suggestions": [
                            "Try logging in with your existing account",
                            "Use password recovery if you've forgotten your password",
                            "Use a different email address"
                        ]
                    }
                )
        except Exception as e:
            logger.error(f"Email check failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User validation service unavailable"
            )
        
        # Check if username already exists
        try:
            existing_user_by_username = db.query(User).filter(User.username == user_data.username).first()
            if existing_user_by_username:
                logger.warning(f"Registration failed - Username already exists: {user_data.username}")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "error": "username_exists",
                        "message": "Username already taken",
                        "existing_user": {
                            "id": existing_user_by_username.id,
                            "email": existing_user_by_username.email,
                            "username": existing_user_by_username.username
                        },
                        "suggestions": [
                            "Try a different username",
                            "Add numbers or underscores if your preferred name is taken",
                            "Use your email address as username alternative"
                        ]
                    }
                )
        except Exception as e:
            logger.error(f"Username check failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User validation service unavailable"
            )
        
        # Hash password
        try:
            hashed_password = get_password_hash(user_data.password)
            logger.info("Password hashed successfully")
        except Exception as e:
            logger.error(f"Password hashing failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password processing service unavailable"
            )
        
        # Create new user
        try:
            new_user = User(
                email=user_data.email,
                username=user_data.username,
                hashed_password=hashed_password,
                is_active=True
            )
            
            logger.info(f"Creating user: email={user_data.email}, username={user_data.username}")
            
            # Add to database with transaction handling
            db.add(new_user)
            db.flush()  # Get the ID without committing
            
            logger.info(f"User created with ID: {new_user.id}")
            
            db.commit()
            db.refresh(new_user)
            
            logger.info(f"User committed successfully - Request ID: {request_id}")
            
            return RegistrationResponse(
                id=new_user.id,
                email=new_user.email,
                username=new_user.username,
                is_active=new_user.is_active,
                created_at=new_user.created_at
            )
            
        except sqlalchemy_exc.IntegrityError as e:
            db.rollback()
            logger.error(f"Database integrity error: {str(e)}")
            
            # Check for specific constraint violations
            error_str = str(e).lower()
            if "unique" in error_str and "email" in error_str:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "error": "email_constraint_violation",
                        "message": "Email already exists",
                        "database_error": str(e)
                    }
                )
            elif "unique" in error_str and "username" in error_str:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "error": "username_constraint_violation",
                        "message": "Username already taken",
                        "database_error": str(e)
                    }
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "error": "database_constraint_error",
                        "message": "Database constraint violation",
                        "database_error": str(e)
                    }
                )
        
        except sqlalchemy_exc.OperationalError as e:
            db.rollback()
            logger.error(f"Database operational error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": "database_operational_error",
                    "message": "Database service temporarily unavailable",
                    "database_error": str(e)
                }
            )
        
        except sqlalchemy_exc.SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "database_error",
                    "message": "Database operation failed",
                    "database_error": str(e)
                }
            )
        
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error during user creation: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "user_creation_error",
                    "message": "Failed to create user account",
                    "system_error": str(e)
                }
            )
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch-all for any unexpected errors
        logger.error(f"Critical error during registration - Request ID: {request_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "critical_system_error",
                "message": "System temporarily unavailable",
                "request_id": request_id,
                "system_error": str(e)
            }
        )

@router.post("/debug-registration")
async def debug_registration_endpoint(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Debug endpoint to test registration components
    """
    
    try:
        # Test database connection
        db_test = db.execute("SELECT 1")
        
        # Test request parsing
        body = await request.json()
        
        # Test schema validation
        try:
            user_data = UserRegistrationRequest(**body)
            validation_result = {"valid": True, "errors": []}
        except Exception as e:
            validation_result = {"valid": False, "errors": [str(e)]}
        
        return {
            "status": "debug_info",
            "timestamp": datetime.now().isoformat(),
            "database_connection": "OK" if db_test else "FAILED",
            "request_body": body,
            "validation_result": validation_result,
            "environment": {
                "client_ip": request.client.host,
                "user_agent": request.headers.get("user-agent", "Unknown"),
                "content_type": request.headers.get("content-type", "Unknown")
            }
        }
        
    except Exception as e:
        logger.error(f"Debug endpoint error: {str(e)}")
        return {
            "status": "debug_error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
