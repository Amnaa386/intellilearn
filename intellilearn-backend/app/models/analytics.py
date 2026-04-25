from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ActivityType(str, Enum):
    QUIZ_COMPLETED = "quiz_completed"
    NOTES_GENERATED = "notes_generated"
    CHAT_SESSION = "chat_session"
    LOGIN = "login"
    FILE_UPLOAD = "file_upload"

class Timeframe(str, Enum):
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"

class UserStats(BaseModel):
    topicsCompleted: int = 0
    quizzesAttempted: int = 0
    performance: float = 0.0  # percentage
    studyStreak: int = 0  # days
    globalRank: Optional[int] = None
    totalStudyTime: int = 0  # minutes

class RecentActivity(BaseModel):
    type: ActivityType
    description: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class UserAnalyticsResponse(BaseModel):
    stats: UserStats
    recentActivity: List[RecentActivity]
    learningProgress: Dict[str, Any]
    performanceTrends: List[Dict[str, Any]]

class PerformanceMetrics(BaseModel):
    quizScores: List[Dict[str, Any]]
    trends: Dict[str, Any]
    strongAreas: List[str]
    weakAreas: List[str]
    improvementRate: float

class UserProgressResponse(BaseModel):
    timeframe: Timeframe
    performance: PerformanceMetrics
    studyPatterns: Dict[str, Any]
    achievements: List[Dict[str, Any]]

class AdminSummary(BaseModel):
    totalUsers: int
    activeUsers: int
    aiRequests: int
    quizzesGenerated: int
    notesCreated: int
    userGrowth: float
    requestGrowth: float
    engagementRate: float

class FeatureUsage(BaseModel):
    feature: str
    usage: float  # percentage
    count: int
    growth: float  # percentage change

class DailyTraffic(BaseModel):
    day: str
    requests: int
    users: int

class AdminAnalyticsResponse(BaseModel):
    summary: AdminSummary
    featureUsage: List[FeatureUsage]
    dailyTraffic: List[DailyTraffic]
    userGrowth: List[Dict[str, Any]]
    systemHealth: Dict[str, Any]

class ActivityLog(BaseModel):
    id: str
    userId: Optional[str] = None
    action: str
    details: Dict[str, Any]
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ActivityLogsResponse(BaseModel):
    logs: List[ActivityLog]
    total: int
    page: int
    limit: int

class SystemInsights(BaseModel):
    mostRequestedTopic: str
    commonQueryStyle: str
    fastestGrowingFeature: str
    usagePatterns: Dict[str, Any]
    userBehavior: Dict[str, Any]
    technicalMetrics: Dict[str, Any]

class LearningPath(BaseModel):
    topic: str
    progress: float
    completedModules: List[str]
    nextRecommendation: str
    estimatedCompletion: datetime

class RecommendationEngine(BaseModel):
    personalizedTopics: List[str]
    suggestedQuizzes: List[str]
    recommendedStudyTime: int  # minutes per day
    learningPath: LearningPath
