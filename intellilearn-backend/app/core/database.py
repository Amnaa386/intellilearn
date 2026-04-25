from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Database client
client: AsyncIOMotorClient = None
database = None

async def connect_to_mongodb():
    """Connect to MongoDB"""
    global client, database
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        database = client.intellilearn
        
        # Test connection
        await client.server_info()
        logger.info("Connected to MongoDB successfully")
        
        # Create indexes for better performance
        await create_indexes()
        
    except Exception as e:
        logger.warning(f"Failed to connect to MongoDB: {e}")
        logger.info("Application will continue without database connection")
        # Don't raise error - allow app to start without MongoDB for development
        client = None
        database = None

async def close_mongodb_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")

async def create_indexes():
    """Create database indexes"""
    try:
        # Users collection indexes
        await database.users.create_index("email", unique=True)
        await database.users.create_index("role")
        await database.users.create_index("status")
        await database.users.create_index("createdAt")
        
        # Chat sessions indexes
        await database.chat_sessions.create_index([("userId", ASCENDING), ("createdAt", DESCENDING)])
        await database.chat_sessions.create_index("sessionId", unique=True)
        
        # Messages indexes
        await database.messages.create_index([("sessionId", ASCENDING), ("timestamp", ASCENDING)])
        
        # Notes indexes
        await database.notes.create_index([("userId", ASCENDING), ("createdAt", DESCENDING)])
        await database.notes.create_index([("userId", ASCENDING), ("bookmarked", ASCENDING)])
        await database.notes.create_index("topic")
        
        # Quizzes indexes
        await database.quizzes.create_index([("userId", ASCENDING), ("createdAt", DESCENDING)])
        await database.quizzes.create_index([("userId", ASCENDING), ("completedAt", DESCENDING)])
        
        # Analytics indexes
        await database.analytics.create_index([("userId", ASCENDING), ("timestamp", DESCENDING)])
        await database.analytics.create_index([("type", ASCENDING), ("timestamp", DESCENDING)])
        
        # Activity logs indexes
        await database.activity_logs.create_index([("timestamp", DESCENDING)])
        await database.activity_logs.create_index([("userId", ASCENDING), ("timestamp", DESCENDING)])
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create indexes: {e}")

def get_database():
    """Get database instance"""
    return database
