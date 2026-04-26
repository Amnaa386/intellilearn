from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer
from app.models.user import UserCreate, UserLogin, GoogleLoginRequest, UserResponse, TokenResponse, PasswordReset, PasswordResetConfirm
from app.services.auth_service import auth_service
from app.core.redis import increment_rate_limit
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        # Rate limiting
        current, allowed = await increment_rate_limit("register", 5, 300)  # 5 per 5 minutes
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many registration attempts. Please try again later."
            )
        
        result = await auth_service.create_user(user_data)
        
        return TokenResponse(
            access_token=result["tokens"]["access_token"],
            refresh_token=result["tokens"]["refresh_token"],
            token_type=result["tokens"]["token_type"],
            user=UserResponse(**result["user"])
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    """Authenticate user and return tokens"""
    try:
        # Rate limiting
        current, allowed = await increment_rate_limit("login", 10, 300)  # 10 per 5 minutes
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Please try again later."
            )
        
        result = await auth_service.authenticate_user(login_data.email, login_data.password)
        
        return TokenResponse(
            access_token=result["tokens"]["access_token"],
            refresh_token=result["tokens"]["refresh_token"],
            token_type=result["tokens"]["token_type"],
            user=UserResponse(**result["user"])
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again."
        )

@router.post("/google-login", response_model=TokenResponse)
async def google_login(payload: GoogleLoginRequest):
    """Login/signup with Google using Firebase ID token."""
    try:
        current, allowed = await increment_rate_limit("google_login", 20, 300)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Please try again later."
            )

        result = await auth_service.authenticate_google_user(payload.id_token)
        return TokenResponse(
            access_token=result["tokens"]["access_token"],
            refresh_token=result["tokens"]["refresh_token"],
            token_type=result["tokens"]["token_type"],
            user=UserResponse(**result["user"])
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Google login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google login failed. Please try again."
        )

@router.post("/verify")
async def verify_token(credentials: HTTPBearer = Depends(security)):
    """Verify JWT token and return user info"""
    try:
        from app.core.security import verify_token
        
        token = credentials.credentials
        payload = verify_token(token, "access")
        
        user_id = payload.get("sub")
        user = await auth_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return {
            "success": True,
            "user": UserResponse(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role,
                status=user.status,
                createdAt=user.createdAt,
                lastActive=user.lastActive,
                profile=user.profile
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

@router.post("/refresh")
async def refresh_token(credentials: HTTPBearer = Depends(security)):
    """Refresh access token using refresh token"""
    try:
        from app.core.security import verify_token, create_access_token
        
        token = credentials.credentials
        payload = verify_token(token, "refresh")
        
        user_id = payload.get("sub")
        user = await auth_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Create new access token
        access_token = create_access_token({
            "sub": user_id,
            "email": user.email,
            "role": user.role
        })
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.post("/forgot-password")
async def forgot_password(request: PasswordReset):
    """Initiate password reset process"""
    try:
        # Rate limiting
        current, allowed = await increment_rate_limit(f"reset_request:{request.email}", 3, 3600)  # 3 per hour
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many password reset requests. Please try again later."
            )
        
        reset_token = await auth_service.create_password_reset_token(request.email)
        
        if reset_token:
            # In production, you would send an email here
            logger.info(f"Password reset token created for {request.email}: {reset_token}")
        
        return {
            "success": True,
            "message": "If an account with that email exists, a password reset link has been sent."
        }
        
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        # Always return success to prevent email enumeration
        return {
            "success": True,
            "message": "If an account with that email exists, a password reset link has been sent."
        }

@router.post("/reset-password")
async def reset_password(request: PasswordResetConfirm):
    """Reset password using token"""
    try:
        success = await auth_service.reset_password(request.token, request.new_password)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        return {
            "success": True,
            "message": "Password reset successful. You can now login with your new password."
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Password reset error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed. Please try again."
        )

@router.post("/logout")
async def logout(credentials: HTTPBearer = Depends(security)):
    """Logout user (token invalidation would be handled client-side)"""
    try:
        from app.core.security import verify_token
        
        token = credentials.credentials
        payload = verify_token(token, "access")
        
        user_id = payload.get("sub")
        
        # In production, you might want to add the token to a blacklist
        logger.info(f"User {user_id} logged out")
        
        return {
            "success": True,
            "message": "Logged out successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Logout error: {e}")
        # Don't raise error for logout - always succeed
        return {
            "success": True,
            "message": "Logged out successfully"
        }
