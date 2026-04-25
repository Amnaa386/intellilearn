from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId
import logging
from app.core.database import get_database
from app.models.analytics import ActivityType, Timeframe, UserStats, RecentActivity

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self):
        self.db = get_database()
    
    async def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user analytics"""
        try:
            # Get user stats
            stats = await self._get_user_stats(user_id)
            
            # Get recent activity
            recent_activity = await self._get_recent_activity(user_id, limit=10)
            
            # Get learning progress
            learning_progress = await self._get_learning_progress(user_id)
            
            # Get performance trends
            performance_trends = await self._get_performance_trends(user_id)
            
            return {
                "stats": stats,
                "recentActivity": recent_activity,
                "learningProgress": learning_progress,
                "performanceTrends": performance_trends
            }
            
        except Exception as e:
            logger.error(f"Error getting user analytics: {e}")
            return {}
    
    async def get_user_progress(self, user_id: str, timeframe: Timeframe = Timeframe.WEEK) -> Dict[str, Any]:
        """Get user progress over time"""
        try:
            # Calculate date range
            end_date = datetime.utcnow()
            start_date = self._get_start_date(end_date, timeframe)
            
            # Get performance metrics
            performance = await self._get_performance_metrics(user_id, start_date, end_date)
            
            # Get study patterns
            study_patterns = await self._get_study_patterns(user_id, start_date, end_date)
            
            # Get achievements
            achievements = await self._get_achievements(user_id, start_date, end_date)
            
            return {
                "timeframe": timeframe,
                "performance": performance,
                "studyPatterns": study_patterns,
                "achievements": achievements
            }
            
        except Exception as e:
            logger.error(f"Error getting user progress: {e}")
            return {}
    
    async def get_admin_analytics(self) -> Dict[str, Any]:
        """Get admin dashboard analytics"""
        try:
            # Get summary stats
            summary = await self._get_admin_summary()
            
            # Get feature usage
            feature_usage = await self._get_feature_usage()
            
            # Get daily traffic
            daily_traffic = await self._get_daily_traffic()
            
            # Get user growth
            user_growth = await self._get_user_growth()
            
            # Get system health
            system_health = await self._get_system_health()
            
            return {
                "summary": summary,
                "featureUsage": feature_usage,
                "dailyTraffic": daily_traffic,
                "userGrowth": user_growth,
                "systemHealth": system_health
            }
            
        except Exception as e:
            logger.error(f"Error getting admin analytics: {e}")
            return {}
    
    async def get_activity_logs(self, page: int = 1, limit: int = 50, 
                             user_id: Optional[str] = None, action: Optional[str] = None) -> Dict[str, Any]:
        """Get activity logs with filtering"""
        try:
            skip = (page - 1) * limit
            
            # Build filter
            filter_dict = {}
            if user_id:
                filter_dict["userId"] = user_id
            if action:
                filter_dict["action"] = action
            
            # Get logs
            logs = await self.db.activity_logs.find(
                filter_dict
            ).sort("timestamp", -1).skip(skip).limit(limit).to_list(length=limit)
            
            # Get total count
            total = await self.db.activity_logs.count_documents(filter_dict)
            
            return {
                "logs": logs,
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": (total + limit - 1) // limit
            }
            
        except Exception as e:
            logger.error(f"Error getting activity logs: {e}")
            return {"logs": [], "total": 0, "page": page, "limit": limit, "totalPages": 0}
    
    async def get_system_insights(self) -> Dict[str, Any]:
        """Get system insights and recommendations"""
        try:
            # Most requested topics
            most_requested_topic = await self._get_most_requested_topic()
            
            # Common query patterns
            common_query_style = await self._get_common_query_style()
            
            # Fastest growing feature
            fastest_growing_feature = await self._get_fastest_growing_feature()
            
            # Usage patterns
            usage_patterns = await self._get_usage_patterns()
            
            # User behavior insights
            user_behavior = await self._get_user_behavior_insights()
            
            # Technical metrics
            technical_metrics = await self._get_technical_metrics()
            
            return {
                "mostRequestedTopic": most_requested_topic,
                "commonQueryStyle": common_query_style,
                "fastestGrowingFeature": fastest_growing_feature,
                "usagePatterns": usage_patterns,
                "userBehavior": user_behavior,
                "technicalMetrics": technical_metrics
            }
            
        except Exception as e:
            logger.error(f"Error getting system insights: {e}")
            return {}
    
    async def track_activity(self, user_id: str, activity_type: ActivityType, 
                           metadata: Optional[Dict[str, Any]] = None):
        """Track user activity"""
        try:
            activity_doc = {
                "userId": user_id,
                "type": activity_type,
                "details": metadata or {},
                "timestamp": datetime.utcnow()
            }
            await self.db.analytics.insert_one(activity_doc)
            
            # Update user stats
            await self._update_user_stats(user_id, activity_type)
            
        except Exception as e:
            logger.error(f"Error tracking activity: {e}")
    
    async def _get_user_stats(self, user_id: str) -> UserStats:
        """Get user statistics"""
        try:
            # Get counts from different collections
            quizzes_pipeline = [
                {"$match": {"userId": user_id, "completedAt": {"$exists": True}}},
                {"$group": {"_id": None, "count": {"$sum": 1}}}
            ]
            
            notes_pipeline = [
                {"$match": {"userId": user_id}},
                {"$group": {"_id": None, "count": {"$sum": 1}}}
            ]
            
            chat_pipeline = [
                {"$match": {"userId": user_id}},
                {"$group": {"_id": None, "count": {"$sum": 1}}}
            ]
            
            # Execute pipelines
            quizzes_result = await self.db.quizzes.aggregate(quizzes_pipeline).to_list(length=1)
            notes_result = await self.db.notes.aggregate(notes_pipeline).to_list(length=1)
            chat_result = await self.db.chat_sessions.aggregate(chat_pipeline).to_list(length=1)
            
            quizzes_completed = quizzes_result[0]["count"] if quizzes_result else 0
            notes_generated = notes_result[0]["count"] if notes_result else 0
            chat_sessions = chat_result[0]["count"] if chat_result else 0
            
            # Calculate performance
            performance_pipeline = [
                {"$match": {"userId": user_id, "completedAt": {"$exists": True}}},
                {"$group": {"_id": None, "avgScore": {"$avg": {"$divide": ["$score", "$maxScore"]}}}}
            ]
            
            perf_result = await self.db.quizzes.aggregate(performance_pipeline).to_list(length=1)
            performance = round(perf_result[0]["avgScore"] * 100, 1) if perf_result else 0
            
            # Calculate study streak
            study_streak = await self._calculate_study_streak(user_id)
            
            # Get global rank (simplified)
            global_rank = await self._get_global_rank(user_id)
            
            return UserStats(
                topicsCompleted=notes_generated,
                quizzesAttempted=quizzes_completed,
                performance=performance,
                studyStreak=study_streak,
                globalRank=global_rank,
                totalStudyTime=0  # Could be calculated from session durations
            )
            
        except Exception as e:
            logger.error(f"Error getting user stats: {e}")
            return UserStats()
    
    async def _get_recent_activity(self, user_id: str, limit: int = 10) -> List[RecentActivity]:
        """Get recent user activity"""
        try:
            activities = await self.db.activity_logs.find(
                {"userId": user_id}
            ).sort("timestamp", -1).limit(limit).to_list(length=limit)
            
            recent_activities = []
            for activity in activities:
                recent_activities.append(RecentActivity(
                    type=ActivityType(activity.get("action", "other")),
                    description=self._format_activity_description(activity),
                    timestamp=activity["timestamp"],
                    metadata=activity.get("details", {})
                ))
            
            return recent_activities
            
        except Exception as e:
            logger.error(f"Error getting recent activity: {e}")
            return []
    
    async def _get_learning_progress(self, user_id: str) -> Dict[str, Any]:
        """Get learning progress data"""
        try:
            # Get progress by category
            pipeline = [
                {"$match": {"userId": user_id}},
                {"$group": {"_id": "$category", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            
            category_progress = await self.db.notes.aggregate(pipeline).to_list(length=None)
            
            # Get quiz performance over time
            quiz_pipeline = [
                {"$match": {"userId": user_id, "completedAt": {"$exists": True}}},
                {"$project": {"date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$completedAt"}}, "score": {"$divide": ["$score", "$maxScore"]}}},
                {"$group": {"_id": "$date", "avgScore": {"$avg": "$score"}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            
            quiz_progress = await self.db.quizzes.aggregate(quiz_pipeline).to_list(length=None)
            
            return {
                "categoryProgress": category_progress,
                "quizProgress": quiz_progress,
                "totalStudyTime": 0  # Could be calculated
            }
            
        except Exception as e:
            logger.error(f"Error getting learning progress: {e}")
            return {}
    
    async def _get_performance_trends(self, user_id: str) -> List[Dict[str, Any]]:
        """Get performance trends"""
        try:
            pipeline = [
                {"$match": {"userId": user_id, "completedAt": {"$exists": True}}},
                {"$project": {"date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$completedAt"}}, "score": {"$divide": ["$score", "$maxScore"]}}},
                {"$group": {"_id": "$date", "avgScore": {"$avg": "$score"}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            
            trends = await self.db.quizzes.aggregate(pipeline).to_list(length=30)  # Last 30 days
            
            return [{"date": trend["_id"], "score": round(trend["avgScore"] * 100, 1)} for trend in trends]
            
        except Exception as e:
            logger.error(f"Error getting performance trends: {e}")
            return []
    
    async def _get_admin_summary(self) -> Dict[str, Any]:
        """Get admin summary statistics"""
        try:
            # Get user counts
            total_users = await self.db.users.count_documents({})
            active_users = await self.db.users.count_documents({"lastActive": {"$gte": datetime.utcnow() - timedelta(days=7)}})
            
            # Get content counts
            total_quizzes = await self.db.quizzes.count_documents({})
            total_notes = await self.db.notes.count_documents({})
            
            # Estimate AI requests from activity logs
            ai_requests = await self.db.activity_logs.count_documents({
                "action": {"$in": ["chat_message", "notes_generated", "quiz_generated"]},
                "timestamp": {"$gte": datetime.utcnow() - timedelta(days=30)}
            })
            
            # Calculate growth rates
            user_growth = await self._calculate_growth_rate("users", 30)
            request_growth = await self._calculate_growth_rate("activity_logs", 30, "chat_message")
            
            # Calculate engagement rate
            engagement_rate = (active_users / total_users * 100) if total_users > 0 else 0
            
            return {
                "totalUsers": total_users,
                "activeUsers": active_users,
                "aiRequests": ai_requests,
                "quizzesGenerated": total_quizzes,
                "notesCreated": total_notes,
                "userGrowth": round(user_growth, 1),
                "requestGrowth": round(request_growth, 1),
                "engagementRate": round(engagement_rate, 1)
            }
            
        except Exception as e:
            logger.error(f"Error getting admin summary: {e}")
            return {}
    
    async def _get_feature_usage(self) -> List[Dict[str, Any]]:
        """Get feature usage statistics"""
        try:
            features = ["chat_message", "notes_generated", "quiz_generated", "ppt_explanation", "voice_lesson"]
            usage_data = []
            
            for feature in features:
                count = await self.db.activity_logs.count_documents({
                    "action": feature,
                    "timestamp": {"$gte": datetime.utcnow() - timedelta(days=30)}
                })
                
                # Calculate growth
                growth = await self._calculate_growth_rate("activity_logs", 30, feature)
                
                usage_data.append({
                    "feature": self._format_feature_name(feature),
                    "usage": count,
                    "growth": round(growth, 1)
                })
            
            return usage_data
            
        except Exception as e:
            logger.error(f"Error getting feature usage: {e}")
            return []
    
    async def _get_daily_traffic(self) -> List[Dict[str, Any]]:
        """Get daily traffic data"""
        try:
            pipeline = [
                {"$match": {"timestamp": {"$gte": datetime.utcnow() - timedelta(days=7)}}},
                {"$project": {"day": {"$dateToString": {"format": "%a", "date": "$timestamp"}}}},
                {"$group": {"_id": "$day", "requests": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            
            traffic = await self.db.activity_logs.aggregate(pipeline).to_list(length=7)
            
            # Format for frontend
            day_order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            formatted_traffic = []
            
            for day in day_order:
                day_data = next((t for t in traffic if t["_id"] == day), {"_id": day, "requests": 0})
                formatted_traffic.append({
                    "day": day,
                    "requests": day_data["requests"]
                })
            
            return formatted_traffic
            
        except Exception as e:
            logger.error(f"Error getting daily traffic: {e}")
            return []
    
    def _get_start_date(self, end_date: datetime, timeframe: Timeframe) -> datetime:
        """Get start date based on timeframe"""
        if timeframe == Timeframe.WEEK:
            return end_date - timedelta(days=7)
        elif timeframe == Timeframe.MONTH:
            return end_date - timedelta(days=30)
        elif timeframe == Timeframe.YEAR:
            return end_date - timedelta(days=365)
        return end_date - timedelta(days=7)
    
    def _format_activity_description(self, activity: Dict[str, Any]) -> str:
        """Format activity description"""
        action = activity.get("action", "unknown")
        details = activity.get("details", {})
        
        descriptions = {
            "quiz_completed": f"Completed quiz with score {details.get('score', 'N/A')}",
            "notes_generated": f"Generated notes for '{details.get('topic', 'unknown topic')}'",
            "chat_message": "Had a chat session with AI tutor",
            "user_login": "Logged in to the platform",
            "ppt_explanation": "Explained PowerPoint slide",
            "voice_lesson": "Generated voice lesson"
        }
        
        return descriptions.get(action, f"Performed {action}")
    
    def _format_feature_name(self, feature: str) -> str:
        """Format feature name for display"""
        feature_names = {
            "chat_message": "AI Chat",
            "notes_generated": "Notes Generation",
            "quiz_generated": "Quiz Generation",
            "ppt_explanation": "PPT Explanation",
            "voice_lesson": "Voice Lessons"
        }
        
        return feature_names.get(feature, feature.replace("_", " ").title())
    
    async def _calculate_study_streak(self, user_id: str) -> int:
        """Calculate study streak in days"""
        try:
            # Get recent activity dates
            activities = await self.db.activity_logs.find(
                {"userId": user_id}
            ).sort("timestamp", -1).limit(30).to_list(length=30)
            
            if not activities:
                return 0
            
            # Calculate consecutive days
            streak = 0
            current_date = datetime.utcnow().date()
            
            for activity in activities:
                activity_date = activity["timestamp"].date()
                
                if activity_date == current_date:
                    streak += 1
                    current_date -= timedelta(days=1)
                elif activity_date == current_date:
                    streak += 1
                    current_date -= timedelta(days=1)
                else:
                    break
            
            return streak
            
        except Exception as e:
            logger.error(f"Error calculating study streak: {e}")
            return 0
    
    async def _get_global_rank(self, user_id: str) -> Optional[int]:
        """Get user's global rank (simplified)"""
        try:
            # This is a simplified implementation
            # In production, you'd want a more sophisticated ranking system
            pipeline = [
                {"$match": {"completedAt": {"$exists": True}}},
                {"$group": {"_id": "$userId", "avgScore": {"$avg": {"$divide": ["$score", "$maxScore"]}}, "count": {"$sum": 1}}},
                {"$sort": {"avgScore": -1, "count": -1}},
                {"$group": {"_id": None, "users": {"$push": {"userId": "$_id", "rank": "$$index"}}}}
            ]
            
            # For simplicity, return a mock rank
            return 1240  # Mock rank
            
        except Exception as e:
            logger.error(f"Error getting global rank: {e}")
            return None
    
    async def _calculate_growth_rate(self, collection: str, days: int, action: Optional[str] = None) -> float:
        """Calculate growth rate for a collection"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            filter_dict = {}
            if action:
                filter_dict["action"] = action
            
            # Current period
            current_filter = {"timestamp": {"$gte": start_date, "$lte": end_date}} if collection == "activity_logs" else {}
            current_filter.update(filter_dict)
            
            current_count = await self.db[collection].count_documents(current_filter)
            
            # Previous period
            prev_start = start_date - timedelta(days=days)
            prev_end = start_date
            
            prev_filter = {"timestamp": {"$gte": prev_start, "$lte": prev_end}} if collection == "activity_logs" else {}
            prev_filter.update(filter_dict)
            
            prev_count = await self.db[collection].count_documents(prev_filter)
            
            # Calculate growth rate
            if prev_count == 0:
                return 100.0 if current_count > 0 else 0.0
            
            return ((current_count - prev_count) / prev_count) * 100
            
        except Exception as e:
            logger.error(f"Error calculating growth rate: {e}")
            return 0.0

# Singleton instance
analytics_service = AnalyticsService()
