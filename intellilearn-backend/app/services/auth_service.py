from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from bson import ObjectId
import logging
from app.core.database import get_database
from app.core.security import get_password_hash, verify_password, create_user_tokens
from app.core.redis import set_cache, get_cache, delete_cache
from app.models.user import UserCreate, UserInDB, UserResponse, UserRole, UserStatus
from app.core.config import settings

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self):
        self.db = get_database()
    
    async def create_user(self, user_data: UserCreate) -> Dict[str, Any]:
        """Create a new user"""
        try:
            # Check if user already exists
            existing_user = await self.db.users.find_one({"email": user_data.email})
            if existing_user:
                raise ValueError("User with this email already exists")
            
            # Create user document
            user_id = str(ObjectId())
            user_doc = {
                "_id": user_id,
                "name": user_data.name,
                "email": user_data.email,
                "password_hash": get_password_hash(user_data.password),
                "role": user_data.role,
                "status": user_data.status,
                "createdAt": datetime.utcnow(),
                "lastActive": None,
                "profile": {}
            }
            
            # Insert user
            await self.db.users.insert_one(user_doc)
            
            # Create user response
            user_response = UserResponse(
                id=user_id,
                name=user_data.name,
                email=user_data.email,
                role=user_data.role,
                status=user_data.status,
                createdAt=user_doc["createdAt"],
                lastActive=None,
                profile={}
            )
            
            # Create tokens
            tokens = create_user_tokens(user_id, user_response.dict())
            
            # Log activity
            await self._log_activity("user_registered", user_id, {
                "email": user_data.email,
                "role": user_data.role
            })
            
            return {
                "user": user_response.dict(),
                "tokens": tokens
            }
            
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise
    
    async def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user and return tokens"""
        try:
            # Find user by email
            user = await self.db.users.find_one({"email": email})
            if not user:
                raise ValueError("Invalid email or password")
            
            # Verify password
            if not verify_password(password, user["password_hash"]):
                raise ValueError("Invalid email or password")
            
            # Update last active
            await self.db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"lastActive": datetime.utcnow()}}
            )
            
            # Create user response
            user_response = UserResponse(
                id=user["_id"],
                name=user["name"],
                email=user["email"],
                role=user["role"],
                status=user["status"],
                createdAt=user["createdAt"],
                lastActive=datetime.utcnow(),
                profile=user.get("profile", {})
            )
            
            # Create tokens
            tokens = create_user_tokens(user["_id"], user_response.dict())
            
            # Log activity
            await self._log_activity("user_login", user["_id"], {
                "email": email
            })
            
            return {
                "user": user_response.dict(),
                "tokens": tokens
            }
            
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            raise
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        """Get user by ID"""
        try:
            user = await self.db.users.find_one({"_id": user_id})
            if user:
                return UserInDB(**user)
            return None
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        """Get user by email"""
        try:
            user = await self.db.users.find_one({"email": email})
            if user:
                return UserInDB(**user)
            return None
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
    
    async def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Optional[UserResponse]:
        """Update user information"""
        try:
            # Remove sensitive fields
            update_data = {k: v for k, v in update_data.items() 
                          if k not in ["password_hash", "_id"]}
            
            # Add updated timestamp
            update_data["updatedAt"] = datetime.utcnow()
            
            # Update user
            result = await self.db.users.update_one(
                {"_id": user_id},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                return None
            
            # Get updated user
            user = await self.db.users.find_one({"_id": user_id})
            if user:
                # Clear cache
                await delete_cache(f"user:{user_id}")
                
                return UserResponse(**user)
            return None
            
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            return None
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete user and all related data"""
        try:
            # Delete user's chat sessions
            await self.db.chat_sessions.delete_many({"userId": user_id})
            
            # Delete user's messages
            await self.db.messages.delete_many({"userId": user_id})
            
            # Delete user's notes
            await self.db.notes.delete_many({"userId": user_id})
            
            # Delete user's quizzes
            await self.db.quizzes.delete_many({"userId": user_id})
            
            # Delete user's analytics
            await self.db.analytics.delete_many({"userId": user_id})
            
            # Delete user
            result = await self.db.users.delete_one({"_id": user_id})
            
            # Clear cache
            await delete_cache(f"user:{user_id}")
            
            # Log activity
            await self._log_activity("user_deleted", user_id)
            
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return False
    
    async def change_password(self, user_id: str, old_password: str, new_password: str, is_admin_reset: bool = False) -> bool:
        """Change user password"""
        try:
            user = await self.db.users.find_one({"_id": user_id})
            if not user:
                raise ValueError("User not found")
            
            # Verify old password (skip for admin reset)
            if not is_admin_reset and not verify_password(old_password, user["password_hash"]):
                raise ValueError("Invalid current password")
            
            # Update password
            new_password_hash = get_password_hash(new_password)
            await self.db.users.update_one(
                {"_id": user_id},
                {"$set": {"password_hash": new_password_hash}}
            )
            
            # Log activity
            activity_type = "password_reset" if is_admin_reset else "password_changed"
            await self._log_activity(activity_type, user_id)
            
            return True
            
        except Exception as e:
            logger.error(f"Error changing password: {e}")
            raise
    
    async def create_password_reset_token(self, email: str) -> Optional[str]:
        """Create password reset token"""
        try:
            user = await self.db.users.find_one({"email": email})
            if not user:
                return None
            
            # Generate reset token
            reset_token = str(ObjectId())
            expiry = datetime.utcnow() + timedelta(hours=1)
            
            # Store reset token
            await self.db.password_resets.insert_one({
                "_id": reset_token,
                "userId": user["_id"],
                "email": email,
                "createdAt": datetime.utcnow(),
                "expiresAt": expiry
            })
            
            # Cache token
            await set_cache(f"reset_token:{reset_token}", user["_id"], 3600)
            
            return reset_token
            
        except Exception as e:
            logger.error(f"Error creating password reset token: {e}")
            return None
    
    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password using token"""
        try:
            # Check token in cache first
            user_id = await get_cache(f"reset_token:{token}")
            
            if not user_id:
                # Check in database
                reset_doc = await self.db.password_resets.find_one({
                    "_id": token,
                    "expiresAt": {"$gt": datetime.utcnow()}
                })
                if not reset_doc:
                    raise ValueError("Invalid or expired reset token")
                user_id = reset_doc["userId"]
            
            # Update password
            new_password_hash = get_password_hash(new_password)
            await self.db.users.update_one(
                {"_id": user_id},
                {"$set": {"password_hash": new_password_hash}}
            )
            
            # Delete reset token
            await self.db.password_resets.delete_one({"_id": token})
            await delete_cache(f"reset_token:{token}")
            
            # Log activity
            await self._log_activity("password_reset", user_id)
            
            return True
            
        except Exception as e:
            logger.error(f"Error resetting password: {e}")
            raise
    
    async def _log_activity(self, action: str, user_id: str, metadata: Optional[Dict[str, Any]] = None):
        """Log user activity"""
        try:
            activity_doc = {
                "userId": user_id,
                "action": action,
                "details": metadata or {},
                "timestamp": datetime.utcnow()
            }
            await self.db.activity_logs.insert_one(activity_doc)
        except Exception as e:
            logger.error(f"Error logging activity: {e}")

# Singleton instance
auth_service = AuthService()
