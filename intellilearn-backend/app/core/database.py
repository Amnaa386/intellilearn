import json
import logging
from firebase_admin import credentials, firestore, initialize_app
import firebase_admin
from app.core.config import settings

logger = logging.getLogger(__name__)

# Firestore client
database = None

async def connect_to_database():
    """Connect to Firestore using Firebase Admin SDK."""
    global database
    try:
        if settings.FIREBASE_CREDENTIALS_JSON:
            cred_info = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
            cred = credentials.Certificate(cred_info)
        elif settings.FIREBASE_CREDENTIALS_PATH:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        else:
            raise ValueError(
                "Firebase credentials not configured. Set FIREBASE_CREDENTIALS_PATH or FIREBASE_CREDENTIALS_JSON."
            )

        if not firebase_admin._apps:
            init_kwargs = {"credential": cred}
            if settings.FIREBASE_PROJECT_ID:
                init_kwargs["options"] = {"projectId": settings.FIREBASE_PROJECT_ID}
            initialize_app(**init_kwargs)

        database = firestore.client()

        # Connection check
        list(database.collections())
        logger.info("Connected to Firestore successfully")
    except Exception as e:
        logger.warning(f"Failed to connect to Firestore: {e}")
        logger.info("Application will continue without database connection")
        database = None

async def close_database_connection():
    """Close Firestore connection (no-op for firebase-admin)."""
    logger.info("Firestore connection closed")

def get_database():
    """Get Firestore client instance."""
    return database
