from typing import Optional

from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.security import HTTPBearer
from app.models.user import UserCreate, UserResponse, UserRole, UserStatus
from app.services.auth_service import auth_service
from app.services.analytics_service import analytics_service
from app.core.security import get_current_admin
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

@router.get("/users")
async def get_all_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    role: Optional[UserRole] = Query(None),
    status: Optional[UserStatus] = Query(None),
    current_user: dict = Depends(get_current_admin)
):
    """Get all users with filtering and pagination"""
    try:
        from app.core.database import get_database
        db = get_database()
        
        if db is None:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

        skip = (page - 1) * limit
        users_raw = []
        for doc in db.collection("users").stream():
            u = doc.to_dict() or {}
            u["id"] = doc.id
            if search:
                haystack = f"{u.get('name','')} {u.get('email','')}".lower()
                if search.lower() not in haystack:
                    continue
            if role and u.get("role") != role.value:
                continue
            if status and u.get("status") != status.value:
                continue
            users_raw.append(u)

        users_raw.sort(key=lambda x: x.get("createdAt") or datetime.min, reverse=True)
        total = len(users_raw)
        users = users_raw[skip:skip + limit]
        
        return {
            "users": [UserResponse(**user) for user in users],
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users"
        )

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(get_current_admin)
):
    """Create new user (admin only)"""
    try:
        result = await auth_service.create_user(user_data)
        return UserResponse(**result["user"])
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_admin)
):
    """Update user information"""
    try:
        user = await auth_service.update_user(user_id, update_data)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_admin)):
    """Delete user and all related data"""
    try:
        success = await auth_service.delete_user(user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"success": True, "message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )

@router.get("/users/{user_id}")
async def get_user_by_id(user_id: str, current_user: dict = Depends(get_current_admin)):
    """Get specific user by ID"""
    try:
        user = await auth_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Return user without password hash
        user_response = UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            status=user.status,
            createdAt=user.createdAt,
            lastActive=user.lastActive,
            profile=user.profile
        )
        
        return user_response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user by ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user"
        )

@router.get("/overview")
async def get_admin_overview(
    timeframe: str = Query("weekly", pattern="^(daily|weekly|monthly)$"),
    current_user: dict = Depends(get_current_admin),
):
    """Get admin dashboard overview"""
    try:
        timeframe = (timeframe or "weekly").lower()
        if timeframe not in {"daily", "weekly", "monthly"}:
            timeframe = "weekly"
        analytics = await analytics_service.get_admin_analytics(timeframe=timeframe)
        return analytics.get("summary", {})
    except Exception as e:
        logger.error(f"Error getting admin overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve admin overview"
        )

@router.get("/analytics")
async def get_system_analytics(
    timeframe: str = Query("weekly", pattern="^(daily|weekly|monthly)$"),
    current_user: dict = Depends(get_current_admin),
):
    """Get system-wide analytics"""
    try:
        timeframe = (timeframe or "weekly").lower()
        if timeframe not in {"daily", "weekly", "monthly"}:
            timeframe = "weekly"
        analytics = await analytics_service.get_admin_analytics(timeframe=timeframe)
        return analytics
    except Exception as e:
        logger.error(f"Error getting system analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve system analytics"
        )

@router.get("/ai-activity")
async def get_ai_activity(
    timeframe: str = Query("weekly", pattern="^(daily|weekly|monthly)$"),
    current_user: dict = Depends(get_current_admin),
):
    """Get AI activity statistics"""
    try:
        timeframe = (timeframe or "weekly").lower()
        if timeframe not in {"daily", "weekly", "monthly"}:
            timeframe = "weekly"
        analytics = await analytics_service.get_admin_analytics(timeframe=timeframe)
        return {
            "featureUsage": analytics.get("featureUsage", []),
            "dailyTraffic": analytics.get("dailyTraffic", [])
        }
    except Exception as e:
        logger.error(f"Error getting AI activity: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve AI activity"
        )

@router.get("/settings")
async def get_system_settings(current_user: dict = Depends(get_current_admin)):
    """Get system settings"""
    try:
        # Mock system settings - in production, these would be stored in database
        settings = [
            {"id": "chat", "label": "Enable AI Chat", "enabled": True, "category": "features"},
            {"id": "ppt", "label": "Enable PPT Explanations", "enabled": True, "category": "features"},
            {"id": "quiz", "label": "Enable Quiz Generation", "enabled": True, "category": "features"},
            {"id": "notes", "label": "Enable Notes Generation", "enabled": True, "category": "features"},
            {"id": "voice", "label": "Enable Voice Lessons", "enabled": True, "category": "features"},
            {"id": "safeMode", "label": "Strict Moderation Mode", "enabled": False, "category": "security"},
            {"id": "rateLimit", "label": "Enable Rate Limiting", "enabled": True, "category": "security"},
            {"id": "analytics", "label": "Enable Analytics Tracking", "enabled": True, "category": "privacy"}
        ]
        
        return {"settings": settings}
    except Exception as e:
        logger.error(f"Error getting system settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve system settings"
        )

@router.put("/settings/{setting_id}")
async def update_system_setting(
    setting_id: str,
    setting_data: dict,
    current_user: dict = Depends(get_current_admin)
):
    """Update system setting"""
    try:
        enabled = setting_data.get("enabled")
        
        if enabled is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Enabled status is required"
            )
        
        # In production, update in database
        logger.info(f"Admin {current_user['id']} updated setting {setting_id} to {enabled}")
        
        return {
            "success": True,
            "message": f"Setting {setting_id} updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating system setting: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update system setting"
        )

@router.get("/content/common-queries")
async def get_common_queries(current_user: dict = Depends(get_current_admin)):
    """Get common user queries"""
    try:
        insights = await analytics_service.get_system_insights()
        live_queries = await analytics_service.get_common_queries(limit=7)
        return {
            "queries": live_queries,
            "mostRequested": insights.get("mostRequestedTopic", "General study topics"),
            "commonStyle": insights.get("commonQueryStyle", "Educational explanations")
        }
    except Exception as e:
        logger.error(f"Error getting common queries: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve common queries"
        )

@router.get("/content/system-insights")
async def get_content_insights(current_user: dict = Depends(get_current_admin)):
    """Get system insights for content management"""
    try:
        insights = await analytics_service.get_system_insights()
        return insights
    except Exception as e:
        logger.error(f"Error getting content insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve content insights"
        )

@router.post("/users/{user_id}/reset-password")
async def reset_user_password(user_id: str, current_user: dict = Depends(get_current_admin)):
    """Reset user password (admin action)"""
    try:
        # Generate temporary password
        import secrets
        temp_password = secrets.token_urlsafe(12)
        
        # Update user password
        success = await auth_service.change_password(user_id, "", temp_password, is_admin_reset=True)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # In production, you would email this to the user
        logger.info(f"Admin {current_user['id']} reset password for user {user_id}")
        
        return {
            "success": True,
            "message": "Password reset successfully",
            "temporaryPassword": temp_password  # Only for development
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting user password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset user password"
        )
