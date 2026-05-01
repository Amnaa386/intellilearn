from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Literal
import logging
from uuid import uuid4
from collections import Counter
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

    @staticmethod
    def _to_utc(value: Any) -> Optional[datetime]:
        if not isinstance(value, datetime):
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

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

    @staticmethod
    def _format_bucket_label(ts: datetime, timeframe: Literal["daily", "weekly", "monthly"]) -> str:
        if timeframe == "daily":
            return ts.strftime("%H:%M")
        if timeframe == "monthly":
            return f"W{((ts.day - 1) // 7) + 1}"
        return ts.strftime("%a")

    def _build_traffic(self, activities: List[Dict[str, Any]], timeframe: Literal["daily", "weekly", "monthly"]) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        if timeframe == "daily":
            start = now - timedelta(hours=24)
        elif timeframe == "monthly":
            start = now - timedelta(days=30)
        else:
            start = now - timedelta(days=7)

        buckets: Dict[str, Dict[str, Any]] = {}
        for row in activities:
            ts = self._to_utc(row.get("timestamp"))
            if not ts or ts < start:
                continue
            label = self._format_bucket_label(ts, timeframe)
            if label not in buckets:
                buckets[label] = {"day": label, "requests": 0}
            buckets[label]["requests"] += 1

        return list(buckets.values())

    async def get_admin_analytics(self, timeframe: Literal["daily", "weekly", "monthly"] = "weekly") -> Dict[str, Any]:
        users = self._get_collection("users")
        activities = self._get_collection("activity_logs")
        quizzes = self._get_collection("quizzes")
        notes = self._get_collection("notes")
        presentations = self._get_collection("presentations")
        video_lectures = self._get_collection("video_lectures")
        now = datetime.now(timezone.utc)
        active_threshold = now - timedelta(days=7)
        if timeframe == "daily":
            traffic_threshold = now - timedelta(hours=24)
        elif timeframe == "monthly":
            traffic_threshold = now - timedelta(days=30)
        else:
            traffic_threshold = now - timedelta(days=7)

        active_users = [
            u for u in users
            if self._to_utc(u.get("lastActive")) and self._to_utc(u.get("lastActive")) >= active_threshold
        ]
        monthly_ai = [
            a for a in activities
            if self._to_utc(a.get("timestamp")) and self._to_utc(a.get("timestamp")) >= traffic_threshold
        ]

        def _count_actions(*action_names: str) -> int:
            return sum(1 for a in monthly_ai if a.get("action") in action_names)

        def _count_created_within(rows: List[Dict[str, Any]]) -> int:
            return sum(1 for row in rows if self._to_utc(row.get("createdAt")) and self._to_utc(row.get("createdAt")) >= traffic_threshold)

        feature_usage = [
            {
                "feature": "Chat Message",
                "usage": _count_actions("chat_message"),
                "growth": 0.0,
            },
            {
                "feature": "Notes Generated",
                "usage": _count_actions("notes_generated", "notes_created_manual"),
                "growth": 0.0,
            },
            {
                "feature": "Quiz Generated",
                "usage": _count_actions("quiz_generated"),
                "growth": 0.0,
            },
            {
                "feature": "PPT Generation",
                "usage": _count_created_within(presentations),
                "growth": 0.0,
            },
            {
                "feature": "Video Lectures",
                "usage": _count_created_within(video_lectures),
                "growth": 0.0,
            },
        ]

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
            "dailyTraffic": self._build_traffic(activities, timeframe),
            "userGrowth": [],
            "systemHealth": {"database": "connected", "redis": "unknown"}
        }

    async def get_activity_logs(self, page: int = 1, limit: int = 50,
                                user_id: Optional[str] = None, action: Optional[str] = None) -> Dict[str, Any]:
        logs = self._get_collection("activity_logs")
        users = self._get_collection("users")
        user_name_by_id = {u.get("id"): (u.get("name") or "Unknown User") for u in users}
        if user_id:
            logs = [l for l in logs if l.get("userId") == user_id]
        if action:
            logs = [l for l in logs if l.get("action") == action]
        logs.sort(
            key=lambda x: self._to_utc(x.get("timestamp")) or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )
        skip = (page - 1) * limit
        page_logs = logs[skip:skip + limit]
        for log in page_logs:
            uid = log.get("userId")
            log["userName"] = user_name_by_id.get(uid, uid or "Unknown User")
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
        logs.sort(
            key=lambda x: self._to_utc(x.get("timestamp")) or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )
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

    async def get_common_queries(self, limit: int = 7) -> List[str]:
        logs = self._get_collection("activity_logs")
        counter: Counter[str] = Counter()

        for row in logs:
            details = row.get("details") or {}
            if not isinstance(details, dict):
                continue
            candidates = [
                details.get("message"),
                details.get("topic"),
                details.get("prompt"),
                details.get("query"),
            ]
            for item in candidates:
                if not isinstance(item, str):
                    continue
                normalized = " ".join(item.strip().split())
                if len(normalized) < 6:
                    continue
                counter[normalized[:120]] += 1

        if not counter:
            return []
        return [text for text, _ in counter.most_common(limit)]

    async def track_activity(self, user_id: str, activity_type: ActivityType, metadata: Optional[Dict[str, Any]] = None):
        db = self._require_db()
        activity_doc = {
            "id": str(uuid4()),
            "userId": user_id,
            "type": activity_type.value,
            "details": metadata or {},
            "timestamp": datetime.now(timezone.utc)
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
        acts.sort(
            key=lambda x: self._to_utc(x.get("timestamp")) or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )
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

        today = datetime.now(timezone.utc).date()
        streak = 0
        cursor = today
        while cursor in active_days:
            streak += 1
            cursor = cursor - timedelta(days=1)
        return streak

# Singleton instance
analytics_service = AnalyticsService()
