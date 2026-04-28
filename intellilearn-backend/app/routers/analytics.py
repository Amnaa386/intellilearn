from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.security import HTTPBearer
from app.models.analytics import Timeframe, ActivityType
from app.services.analytics_service import analytics_service
from app.core.security import get_current_user, get_current_admin
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

@router.get("/user/overview")
async def get_user_analytics(current_user: dict = Depends(get_current_user)):
    """Get comprehensive user analytics"""
    try:
        analytics = await analytics_service.get_user_analytics(current_user["id"])
        return analytics
    except Exception as e:
        logger.error(f"Error getting user analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user analytics"
        )

@router.get("/user/activity-logs")
async def get_user_activity_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    action: str = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """Get user's own activity logs"""
    try:
        logs = await analytics_service.get_user_activity_logs(
            user_id=current_user["id"],
            page=page,
            limit=limit,
            action=action,
        )
        return logs
    except Exception as e:
        logger.error(f"Error getting user activity logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user activity logs"
        )

@router.get("/user/progress")
async def get_user_progress(
    timeframe: Timeframe = Query(Timeframe.WEEK),
    current_user: dict = Depends(get_current_user)
):
    """Get user progress over time"""
    try:
        progress = await analytics_service.get_user_progress(current_user["id"], timeframe)
        return progress
    except Exception as e:
        logger.error(f"Error getting user progress: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user progress"
        )

@router.get("/user/performance")
async def get_user_performance_metrics(
    timeframe: Timeframe = Query(Timeframe.WEEK),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed user performance metrics"""
    try:
        progress = await analytics_service.get_user_progress(current_user["id"], timeframe)
        return progress.get("performance", {})
    except Exception as e:
        logger.error(f"Error getting user performance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve performance metrics"
        )

@router.get("/admin/overview")
async def get_admin_analytics(current_user: dict = Depends(get_current_admin)):
    """Get admin dashboard analytics"""
    try:
        analytics = await analytics_service.get_admin_analytics()
        return analytics
    except Exception as e:
        logger.error(f"Error getting admin analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve admin analytics"
        )

@router.get("/admin/usage")
async def get_feature_usage(current_user: dict = Depends(get_current_admin)):
    """Get feature usage statistics"""
    try:
        analytics = await analytics_service.get_admin_analytics()
        return analytics.get("featureUsage", [])
    except Exception as e:
        logger.error(f"Error getting feature usage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve feature usage statistics"
        )

@router.get("/admin/activity-logs")
async def get_activity_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user_id: str = Query(None),
    action: str = Query(None),
    current_user: dict = Depends(get_current_admin)
):
    """Get system activity logs"""
    try:
        logs = await analytics_service.get_activity_logs(page, limit, user_id, action)
        return logs
    except Exception as e:
        logger.error(f"Error getting activity logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve activity logs"
        )

@router.get("/admin/system-insights")
async def get_system_insights(current_user: dict = Depends(get_current_admin)):
    """Get system insights and recommendations"""
    try:
        insights = await analytics_service.get_system_insights()
        return insights
    except Exception as e:
        logger.error(f"Error getting system insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve system insights"
        )

@router.post("/track")
async def track_activity(
    activity_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Track user activity (internal use)"""
    try:
        activity_type = activity_data.get("type")
        metadata = activity_data.get("metadata", {})
        
        if activity_type:
            await analytics_service.track_activity(
                current_user["id"],
                ActivityType(activity_type),
                metadata
            )
        
        return {"success": True, "message": "Activity tracked"}
    except Exception as e:
        logger.error(f"Error tracking activity: {e}")
        # Don't raise error for tracking - always succeed
        return {"success": True, "message": "Activity tracked"}

@router.get("/dashboard/summary")
async def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    """Get dashboard summary for user"""
    try:
        analytics = await analytics_service.get_user_analytics(current_user["id"])
        return {
            "stats": analytics.get("stats", {}),
            "recentActivity": analytics.get("recentActivity", [])[:5],  # Last 5 activities
            "performanceTrends": analytics.get("performanceTrends", [])[-7:]  # Last 7 days
        }
    except Exception as e:
        logger.error(f"Error getting dashboard summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dashboard summary"
        )
