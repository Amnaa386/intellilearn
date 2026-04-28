from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import logging
from uuid import uuid4
from app.core.database import get_database
from app.models.analytics import ActivityType, Timeframe, UserStats

logger = logging.getLogger(__name__)


class AnalyticsService:
    @staticmethod
    def _require_db():
        db = get_database()
        if db is None:
            raise RuntimeError("Database connection is not available")
        return db

    def _get_collection(self, name: str) -> List[Dict[str, Any]]:
        db = self._require_db()
        rows = []
        for doc in db.collection(name).stream():
            row = doc.to_dict() or {}
            row["id"] = doc.id
            rows.append(row)
        return rows

    async def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        stats = await self._get_user_stats(user_id)
        recent = await self._get_recent_activity(user_id, 10)
        return {
            "stats": stats,
            "recentActivity": recent,
            "learningProgress": {"categoryProgress": [], "quizProgress": [], "totalStudyTime": 0},
            "performanceTrends": []
        }

    async def get_user_progress(self, user_id: str, timeframe: Timeframe = Timeframe.WEEK) -> Dict[str, Any]:
        return {
            "timeframe": timeframe,
            "performance": {},
            "studyPatterns": {},
            "achievements": []
        }

    async def get_admin_analytics(self) -> Dict[str, Any]:
        users = self._get_collection("users")
        activities = self._get_collection("activity_logs")
        quizzes = self._get_collection("quizzes")
        notes = self._get_collection("notes")
        now = datetime.utcnow()
        active_users = [u for u in users if u.get("lastActive") and u.get("lastActive") >= now - timedelta(days=7)]
        monthly_ai = [a for a in activities if a.get("timestamp") and a["timestamp"] >= now - timedelta(days=30)]

        feature_keys = ["chat_message", "notes_generated", "quiz_generated", "ppt_explanation", "voice_lesson"]
        feature_usage = []
        for key in feature_keys:
            feature_usage.append({
                "feature": key.replace("_", " ").title(),
                "usage": sum(1 for a in monthly_ai if a.get("action") == key),
                "growth": 0.0
            })

        return {
            "summary": {
                "totalUsers": len(users),
                "activeUsers": len(active_users),
                "aiRequests": len(monthly_ai),
                "quizzesGenerated": len(quizzes),
                "notesCreated": len(notes),
                "userGrowth": 0.0,
                "requestGrowth": 0.0,
                "engagementRate": round((len(active_users) / len(users) * 100), 1) if users else 0
            },
            "featureUsage": feature_usage,
            "dailyTraffic": [],
            "userGrowth": [],
            "systemHealth": {"database": "connected", "redis": "unknown"}
        }

    async def get_activity_logs(self, page: int = 1, limit: int = 50,
                                user_id: Optional[str] = None, action: Optional[str] = None) -> Dict[str, Any]:
        logs = self._get_collection("activity_logs")
        if user_id:
            logs = [l for l in logs if l.get("userId") == user_id]
        if action:
            logs = [l for l in logs if l.get("action") == action]
        logs.sort(key=lambda x: x.get("timestamp") or datetime.min, reverse=True)
        skip = (page - 1) * limit
        page_logs = logs[skip:skip + limit]
        return {
            "logs": page_logs,
            "total": len(logs),
            "page": page,
            "limit": limit,
            "totalPages": (len(logs) + limit - 1) // limit
        }

    async def get_user_activity_logs(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 100,
        action: Optional[str] = None,
    ) -> Dict[str, Any]:
        logs = [l for l in self._get_collection("activity_logs") if l.get("userId") == user_id]
        if action:
            logs = [l for l in logs if l.get("action") == action]
        logs.sort(key=lambda x: x.get("timestamp") or datetime.min, reverse=True)
        skip = (page - 1) * limit
        page_logs = logs[skip:skip + limit]
        return {
            "logs": page_logs,
            "total": len(logs),
            "page": page,
            "limit": limit,
            "totalPages": (len(logs) + limit - 1) // limit,
        }

    async def get_system_insights(self) -> Dict[str, Any]:
        return {
            "mostRequestedTopic": "General study topics",
            "commonQueryStyle": "Educational explanations",
            "fastestGrowingFeature": "AI Chat",
            "usagePatterns": {},
            "userBehavior": {},
            "technicalMetrics": {}
        }

    async def track_activity(self, user_id: str, activity_type: ActivityType, metadata: Optional[Dict[str, Any]] = None):
        db = self._require_db()
        activity_doc = {
            "id": str(uuid4()),
            "userId": user_id,
            "type": activity_type.value,
            "details": metadata or {},
            "timestamp": datetime.utcnow()
        }
        db.collection("analytics").document(activity_doc["id"]).set(activity_doc)

    async def _get_user_stats(self, user_id: str) -> UserStats:
        quizzes = [q for q in self._get_collection("quizzes") if q.get("userId") == user_id and q.get("completedAt")]
        notes = [n for n in self._get_collection("notes") if n.get("userId") == user_id]
        scores = [(q.get("score", 0) / q.get("maxScore", 1)) for q in quizzes if q.get("maxScore")]
        study_streak = await self._calculate_study_streak(user_id)
        return UserStats(
            topicsCompleted=len(notes),
            quizzesAttempted=len(quizzes),
            performance=round((sum(scores) / len(scores) * 100), 1) if scores else 0,
            studyStreak=study_streak,
            globalRank=1240,
            totalStudyTime=0
        )

    async def _get_recent_activity(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        acts = [a for a in self._get_collection("activity_logs") if a.get("userId") == user_id]
        acts.sort(key=lambda x: x.get("timestamp") or datetime.min, reverse=True)
        return acts[:limit]

    async def _calculate_study_streak(self, user_id: str) -> int:
        """Count consecutive active days ending at today."""
        acts = [a for a in self._get_collection("activity_logs") if a.get("userId") == user_id]
        if not acts:
            return 0

        active_days = set()
        for row in acts:
            ts = row.get("timestamp")
            if isinstance(ts, datetime):
                active_days.add(ts.date())

        if not active_days:
            return 0

        today = datetime.utcnow().date()
        streak = 0
        cursor = today
        while cursor in active_days:
            streak += 1
            cursor = cursor - timedelta(days=1)
        return streak

# Singleton instance
analytics_service = AnalyticsService()
