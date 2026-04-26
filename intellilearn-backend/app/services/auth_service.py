from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from uuid import uuid4
import logging
from firebase_admin import auth as firebase_auth
from app.core.database import get_database
from app.core.security import get_password_hash, verify_password, create_user_tokens
from app.core.redis import set_cache, get_cache, delete_cache
from app.models.user import UserCreate, UserInDB, UserResponse

logger = logging.getLogger(__name__)
GOOGLE_TOKEN_CLOCK_SKEW_SECONDS = 10

class AuthService:
    @staticmethod
    def _require_db():
        db = get_database()
        if db is None:
            raise RuntimeError("Database connection is not available")
        return db

    @staticmethod
    def _to_user_doc(user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": user_id,
            "name": user_data["name"],
            "email": user_data["email"],
            "role": user_data["role"],
            "status": user_data["status"],
            "createdAt": user_data["createdAt"],
            "lastActive": user_data.get("lastActive"),
            "profile": user_data.get("profile", {}),
            "password_hash": user_data.get("password_hash"),
        }

    def _get_user_by_email_raw(self, email: str) -> Optional[Tuple[str, Dict[str, Any]]]:
        db = self._require_db()
        docs = db.collection("users").where("email", "==", email).limit(1).stream()
        for doc in docs:
            user_data = doc.to_dict() or {}
            user_data["id"] = doc.id
            return doc.id, user_data
        return None

    def _get_user_by_firebase_uid_raw(self, firebase_uid: str) -> Optional[Tuple[str, Dict[str, Any]]]:
        db = self._require_db()
        docs = db.collection("users").where("firebaseUid", "==", firebase_uid).limit(1).stream()
        for doc in docs:
            user_data = doc.to_dict() or {}
            user_data["id"] = doc.id
            return doc.id, user_data
        return None
    
    async def create_user(self, user_data: UserCreate) -> Dict[str, Any]:
        """Create a new user"""
        try:
            db = self._require_db()

            # Check if user already exists
            if self._get_user_by_email_raw(user_data.email):
                raise ValueError("User with this email already exists")
            
            # Create user document
            user_id = str(uuid4())
            user_doc = {
                "id": user_id,
                "name": user_data.name,
                "email": user_data.email,
                "password_hash": get_password_hash(user_data.password),
                "role": user_data.role.value,
                "status": user_data.status.value,
                "createdAt": datetime.utcnow(),
                "lastActive": None,
                "profile": {}
            }
            
            # Insert user
            db.collection("users").document(user_id).set(user_doc)
            
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
            tokens = create_user_tokens(user_id, user_response.model_dump())
            
            # Log activity
            await self._log_activity("user_registered", user_id, {
                "email": user_data.email,
                "role": user_data.role.value
            })
            
            return {
                "user": user_response.model_dump(),
                "tokens": tokens
            }
            
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise
    
    async def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user and return tokens"""
        try:
            db = self._require_db()

            # Find user by email
            user_match = self._get_user_by_email_raw(email)
            if not user_match:
                raise ValueError("Invalid email or password")
            user_id, user = user_match
            
            # Verify password
            if not verify_password(password, user["password_hash"]):
                raise ValueError("Invalid email or password")
            
            # Update last active
            now = datetime.utcnow()
            db.collection("users").document(user_id).update({"lastActive": now})
            
            # Create user response
            user_response = UserResponse(
                id=user_id,
                name=user["name"],
                email=user["email"],
                role=user["role"],
                status=user["status"],
                createdAt=user["createdAt"],
                lastActive=now,
                profile=user.get("profile", {})
            )
            
            # Create tokens
            tokens = create_user_tokens(user_id, user_response.model_dump())
            
            # Log activity
            await self._log_activity("user_login", user_id, {
                "email": email
            })
            
            return {
                "user": user_response.model_dump(),
                "tokens": tokens
            }
            
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            raise

    async def authenticate_google_user(self, id_token: str) -> Dict[str, Any]:
        """Authenticate (or auto-register) user from Google/Firebase ID token."""
        try:
            db = self._require_db()
            decoded = firebase_auth.verify_id_token(
                id_token,
                clock_skew_seconds=GOOGLE_TOKEN_CLOCK_SKEW_SECONDS,
            )
            firebase_uid = decoded.get("uid")
            email = decoded.get("email")

            if not firebase_uid or not email:
                raise ValueError("Invalid Google token payload")

            display_name = decoded.get("name") or email.split("@")[0]
            avatar = decoded.get("picture")
            email_verified = bool(decoded.get("email_verified", False))
            now = datetime.utcnow()

            user_match = self._get_user_by_firebase_uid_raw(firebase_uid)
            if not user_match:
                user_match = self._get_user_by_email_raw(email)

            if user_match:
                user_id, user = user_match
                updates = {
                    "lastActive": now,
                    "authProvider": "google",
                    "firebaseUid": firebase_uid,
                    "emailVerified": email_verified,
                }
                if display_name:
                    updates["name"] = display_name
                if avatar:
                    profile = user.get("profile", {}) or {}
                    profile["avatar"] = avatar
                    updates["profile"] = profile

                db.collection("users").document(user_id).update(updates)
                user.update(updates)
            else:
                user_id = str(uuid4())
                user = {
                    "id": user_id,
                    "name": display_name,
                    "email": email,
                    # Random unusable password hash for social-login-only users
                    "password_hash": get_password_hash(str(uuid4())),
                    "role": "student",
                    "status": "active",
                    "createdAt": now,
                    "lastActive": now,
                    "profile": {"avatar": avatar} if avatar else {},
                    "authProvider": "google",
                    "firebaseUid": firebase_uid,
                    "emailVerified": email_verified,
                }
                db.collection("users").document(user_id).set(user)

            user_response = UserResponse(
                id=user_id,
                name=user["name"],
                email=user["email"],
                role=user["role"],
                status=user["status"],
                createdAt=user["createdAt"],
                lastActive=user.get("lastActive"),
                profile=user.get("profile", {}),
            )
            tokens = create_user_tokens(user_id, user_response.model_dump())

            await self._log_activity("user_login_google", user_id, {"email": email})
            return {
                "user": user_response.model_dump(),
                "tokens": tokens
            }
        except (
            firebase_auth.InvalidIdTokenError,
            firebase_auth.ExpiredIdTokenError,
            firebase_auth.RevokedIdTokenError,
        ) as e:
            logger.warning(f"Google token validation failed: {e}")
            raise ValueError("Invalid or expired Google token")
        except Exception as e:
            logger.error(f"Error authenticating Google user: {e}")
            raise
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        """Get user by ID"""
        try:
            db = self._require_db()
            snapshot = db.collection("users").document(user_id).get()
            if snapshot.exists:
                user = self._to_user_doc(user_id, snapshot.to_dict() or {})
                return UserInDB(**user)
            return None
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        """Get user by email"""
        try:
            user_match = self._get_user_by_email_raw(email)
            if user_match:
                user_id, user = user_match
                user = self._to_user_doc(user_id, user)
                return UserInDB(**user)
            return None
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
    
    async def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Optional[UserResponse]:
        """Update user information"""
        try:
            db = self._require_db()
            # Remove sensitive fields
            update_data = {k: v for k, v in update_data.items() 
                          if k not in ["password_hash", "_id", "id"]}
            
            # Add updated timestamp
            update_data["updatedAt"] = datetime.utcnow()
            
            user_ref = db.collection("users").document(user_id)
            if not user_ref.get().exists:
                return None
            user_ref.update(update_data)
            
            # Get updated user
            snapshot = user_ref.get()
            if snapshot.exists:
                # Clear cache
                await delete_cache(f"user:{user_id}")
                return UserResponse(**self._to_user_doc(user_id, snapshot.to_dict() or {}))
            return None
            
        except Exception as e:
            logger.error(f"Error updating user for {user_id}: {e}; payload={update_data}")
            raise
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete user and all related data"""
        try:
            db = self._require_db()
            # Delete user-related docs in common collections
            for collection_name in ["chat_sessions", "messages", "notes", "quizzes", "analytics"]:
                docs = db.collection(collection_name).where("userId", "==", user_id).stream()
                for doc in docs:
                    doc.reference.delete()

            # Delete user
            user_ref = db.collection("users").document(user_id)
            existed = user_ref.get().exists
            user_ref.delete()
            
            # Clear cache
            await delete_cache(f"user:{user_id}")
            
            # Log activity
            await self._log_activity("user_deleted", user_id)
            
            return existed
            
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return False
    
    async def change_password(self, user_id: str, old_password: str, new_password: str, is_admin_reset: bool = False) -> bool:
        """Change user password"""
        try:
            db = self._require_db()
            user_ref = db.collection("users").document(user_id)
            snapshot = user_ref.get()
            if not snapshot.exists:
                raise ValueError("User not found")
            user = snapshot.to_dict() or {}
            
            # Verify old password (skip for admin reset)
            if not is_admin_reset and not verify_password(old_password, user["password_hash"]):
                raise ValueError("Invalid current password")
            
            # Update password
            new_password_hash = get_password_hash(new_password)
            user_ref.update({"password_hash": new_password_hash})
            
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
            db = self._require_db()
            user_match = self._get_user_by_email_raw(email)
            if not user_match:
                return None
            user_id, _ = user_match
            
            # Generate reset token
            reset_token = str(uuid4())
            expiry = datetime.utcnow() + timedelta(hours=1)
            
            # Store reset token
            db.collection("password_resets").document(reset_token).set({
                "id": reset_token,
                "userId": user_id,
                "email": email,
                "createdAt": datetime.utcnow(),
                "expiresAt": expiry
            })
            
            # Cache token
            await set_cache(f"reset_token:{reset_token}", user_id, 3600)
            
            return reset_token
            
        except Exception as e:
            logger.error(f"Error creating password reset token: {e}")
            return None
    
    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password using token"""
        try:
            db = self._require_db()
            # Check token in cache first
            user_id = await get_cache(f"reset_token:{token}")
            
            if not user_id:
                # Check in database
                reset_snapshot = db.collection("password_resets").document(token).get()
                if not reset_snapshot.exists:
                    raise ValueError("Invalid or expired reset token")
                reset_doc = reset_snapshot.to_dict() or {}
                expires_at = reset_doc.get("expiresAt")
                if not expires_at or expires_at <= datetime.utcnow():
                    db.collection("password_resets").document(token).delete()
                    raise ValueError("Invalid or expired reset token")
                user_id = reset_doc["userId"]
            
            # Update password
            new_password_hash = get_password_hash(new_password)
            user_ref = db.collection("users").document(user_id)
            if not user_ref.get().exists:
                raise ValueError("User not found")
            user_ref.update({"password_hash": new_password_hash})
            
            # Delete reset token
            db.collection("password_resets").document(token).delete()
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
            db = self._require_db()
            activity_doc = {
                "id": str(uuid4()),
                "userId": user_id,
                "action": action,
                "details": metadata or {},
                "timestamp": datetime.utcnow()
            }
            db.collection("activity_logs").document(activity_doc["id"]).set(activity_doc)
        except Exception as e:
            logger.error(f"Error logging activity: {e}")

# Singleton instance
auth_service = AuthService()
