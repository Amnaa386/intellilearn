from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from uuid import uuid4
import logging
from app.core.database import get_database
from app.services.ai_service import ai_service
from app.models.chat import ChatSessionCreate, ChatSessionResponse, MessageCreate, MessageResponse, MessageType

logger = logging.getLogger(__name__)

class ChatService:
    @staticmethod
    def _require_db():
        db = get_database()
        if db is None:
            raise RuntimeError("Database connection is not available")
        return db
    
    async def create_session(self, user_id: str, session_data: Optional[ChatSessionCreate] = None) -> ChatSessionResponse:
        """Create a new chat session"""
        try:
            session_id = f"chat_{datetime.utcnow().timestamp()}_{uuid4()}"
            
            session_doc = {
                "id": session_id,
                "userId": user_id,
                "sessionId": session_id,
                "title": session_data.title if session_data else "New Chat Session",
                "messageCount": 0,
                "preview": "",
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            db = self._require_db()
            db.collection("chat_sessions").document(session_id).set(session_doc)
            
            # Add welcome message
            welcome_message = {
                "_id": str(uuid4()),
                "sessionId": session_id,
                "userId": user_id,
                "content": "Hello! I'm Dr. Intelli, your AI Tutor. How can I help you with your studies today?",
                "type": MessageType.BOT,
                "timestamp": datetime.utcnow()
            }
            
            welcome_message["id"] = welcome_message.pop("_id")
            db.collection("messages").document(welcome_message["id"]).set(welcome_message)
            
            # Update message count
            db.collection("chat_sessions").document(session_id).update(
                {"messageCount": 1, "updatedAt": datetime.utcnow()}
            )
            
            return ChatSessionResponse(**session_doc)
            
        except Exception as e:
            logger.error(f"Error creating chat session: {e}")
            raise
    
    async def get_user_sessions(self, user_id: str, page: int = 1, limit: int = 20) -> List[ChatSessionResponse]:
        """Get user's chat sessions"""
        try:
            db = self._require_db()
            skip = (page - 1) * limit
            docs = db.collection("chat_sessions").where("userId", "==", user_id).stream()
            sessions = []
            for doc in docs:
                row = doc.to_dict() or {}
                row["id"] = doc.id
                sessions.append(row)
            sessions.sort(key=lambda x: x.get("updatedAt") or datetime.min, reverse=True)
            sessions = sessions[skip:skip + limit]
            return [ChatSessionResponse(**session) for session in sessions]
            
        except Exception as e:
            logger.error(f"Error getting user sessions: {e}")
            return []
    
    async def get_session_with_messages(self, session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get chat session with all messages"""
        try:
            # Get session
            db = self._require_db()
            session_snapshot = db.collection("chat_sessions").document(session_id).get()
            if not session_snapshot.exists:
                return None
            session = session_snapshot.to_dict() or {}
            if session.get("userId") != user_id:
                return None
            
            # Get messages
            messages = []
            for doc in db.collection("messages").where("sessionId", "==", session_id).stream():
                row = doc.to_dict() or {}
                row["id"] = doc.id
                messages.append(row)
            messages.sort(key=lambda x: x.get("timestamp") or datetime.min)
            message_responses = [MessageResponse(**msg) for msg in messages]
            
            session_response = ChatSessionResponse(**session)
            return {
                "id": session_response.id,
                "userId": session_response.userId,
                "sessionId": session_response.sessionId,
                "title": session_response.title,
                "messageCount": session_response.messageCount,
                "preview": session_response.preview,
                "createdAt": session_response.createdAt,
                "updatedAt": session_response.updatedAt,
                "messages": message_responses,
            }
            
        except Exception as e:
            logger.error(f"Error getting session with messages: {e}")
            return None

    async def auto_generate_session_title(self, user_id: str, session_id: str, seed_text: str = "") -> Optional[str]:
        """Generate AI-based concise title for a chat session."""
        try:
            db = self._require_db()
            session_ref = db.collection("chat_sessions").document(session_id)
            snapshot = session_ref.get()
            if not snapshot.exists:
                return None
            session = snapshot.to_dict() or {}
            if session.get("userId") != user_id:
                return None

            if not seed_text:
                latest_user_message = None
                for doc in db.collection("messages").where("sessionId", "==", session_id).stream():
                    row = doc.to_dict() or {}
                    if row.get("type") == MessageType.USER.value:
                        latest_user_message = row.get("content", "")
                seed_text = latest_user_message or ""

            if not seed_text:
                return None

            prompt = (
                "Create a very short chat title (3-6 words) for this study conversation. "
                "Return only title text, no quotes, no punctuation at end.\n\n"
                f"User prompt: {seed_text}"
            )
            ai_result = await ai_service.generate_chat_response(prompt)
            raw_title = (ai_result.get("message") or "").strip()
            clean_title = raw_title.splitlines()[0].strip().strip('"').strip("'")
            if len(clean_title) > 60:
                clean_title = clean_title[:60].rstrip()
            if not clean_title:
                return None

            session_ref.update({"title": clean_title, "updatedAt": datetime.utcnow()})
            return clean_title
        except Exception as e:
            logger.error(f"Error auto-generating session title: {e}")
            return None
    
    async def send_message(self, user_id: str, session_id: str, message_data: MessageCreate) -> Dict[str, Any]:
        """Send a message and get AI response"""
        try:
            # Verify session belongs to user
            db = self._require_db()
            session_snapshot = db.collection("chat_sessions").document(session_id).get()
            if not session_snapshot.exists:
                raise ValueError("Session not found")
            session = session_snapshot.to_dict() or {}
            if session.get("userId") != user_id:
                raise ValueError("Session not found")
            
            # Create user message
            user_message_id = str(uuid4())
            user_message = {
                "id": user_message_id,
                "sessionId": session_id,
                "userId": user_id,
                "content": message_data.content,
                "type": MessageType.USER.value,
                "timestamp": datetime.utcnow()
            }
            
            db.collection("messages").document(user_message_id).set(user_message)
            
            # Get chat history for context
            recent_messages = []
            for doc in db.collection("messages").where("sessionId", "==", session_id).stream():
                row = doc.to_dict() or {}
                row["id"] = doc.id
                recent_messages.append(row)
            recent_messages.sort(key=lambda x: x.get("timestamp") or datetime.min, reverse=True)
            recent_messages = recent_messages[:10]
            
            # Format for OpenAI
            chat_history = []
            for msg in reversed(recent_messages[1:]):  # Exclude the newest message
                role = "user" if msg["type"] == MessageType.USER.value else "assistant"
                chat_history.append({
                    "role": role,
                    "content": msg["content"]
                })
            
            # Get AI response
            ai_response = await ai_service.generate_chat_response(
                message_data.content,
                {"chat_history": chat_history}
            )
            
            # Create bot message
            bot_message_id = str(uuid4())
            bot_message = {
                "id": bot_message_id,
                "sessionId": session_id,
                "userId": user_id,
                "content": ai_response["message"],
                "type": MessageType.BOT.value,
                "timestamp": datetime.utcnow()
            }
            
            db.collection("messages").document(bot_message_id).set(bot_message)
            
            # Update session
            new_message_count = session["messageCount"] + 2
            preview = message_data.content[:100] + "..." if len(message_data.content) > 100 else message_data.content
            
            db.collection("chat_sessions").document(session_id).update(
                {
                    "messageCount": new_message_count,
                    "preview": preview,
                    "updatedAt": datetime.utcnow()
                }
            )
            
            # Log activity
            await self._log_activity("chat_message", user_id, {
                "sessionId": session_id,
                "messageCount": 1
            })
            
            return {
                "userMessage": MessageResponse(**user_message),
                "botMessage": MessageResponse(**bot_message),
                "usage": ai_response.get("usage", {})
            }
            
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            raise
    
    async def delete_session(self, user_id: str, session_id: str) -> bool:
        """Delete a chat session and all messages"""
        try:
            db = self._require_db()
            session_ref = db.collection("chat_sessions").document(session_id)
            session_snapshot = session_ref.get()
            if not session_snapshot.exists:
                return False
            session = session_snapshot.to_dict() or {}
            if session.get("userId") != user_id:
                return False

            for doc in db.collection("messages").where("sessionId", "==", session_id).stream():
                doc.reference.delete()
            session_ref.delete()
            return True
            
        except Exception as e:
            logger.error(f"Error deleting session: {e}")
            return False
    
    async def update_session_title(self, user_id: str, session_id: str, title: str) -> bool:
        """Update chat session title"""
        try:
            db = self._require_db()
            session_ref = db.collection("chat_sessions").document(session_id)
            snapshot = session_ref.get()
            if not snapshot.exists:
                return False
            session = snapshot.to_dict() or {}
            if session.get("userId") != user_id:
                return False
            session_ref.update({"title": title, "updatedAt": datetime.utcnow()})
            return True
            
        except Exception as e:
            logger.error(f"Error updating session title: {e}")
            return False
    
    async def get_session_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user's chat statistics"""
        try:
            db = self._require_db()
            sessions = []
            for doc in db.collection("chat_sessions").where("userId", "==", user_id).stream():
                sessions.append(doc.to_dict() or {})
            if sessions:
                total_sessions = len(sessions)
                total_messages = sum(int(s.get("messageCount", 0)) for s in sessions)
                last_activity = max((s.get("updatedAt") for s in sessions if s.get("updatedAt")), default=None)
                return {
                    "totalSessions": total_sessions,
                    "totalMessages": total_messages,
                    "lastActivity": last_activity,
                    "averageMessagesPerSession": total_messages / total_sessions if total_sessions > 0 else 0
                }
            else:
                return {
                    "totalSessions": 0,
                    "totalMessages": 0,
                    "lastActivity": None,
                    "averageMessagesPerSession": 0
                }
                
        except Exception as e:
            logger.error(f"Error getting session stats: {e}")
            return {}
    
    async def explain_ppt_slide(self, user_id: str, slide_content: str, slide_number: int, context: Optional[str] = None) -> Dict[str, Any]:
        """Get AI explanation for PowerPoint slide"""
        try:
            explanation = await ai_service.explain_ppt_slide(slide_content, slide_number, context)
            
            # Log activity
            await self._log_activity("ppt_explanation", user_id, {
                "slideNumber": slide_number,
                "contentLength": len(slide_content)
            })
            
            return explanation
            
        except Exception as e:
            logger.error(f"Error explaining PPT slide: {e}")
            raise
    
    async def generate_voice_lesson(self, user_id: str, topic: str, duration: int = 5, style: str = "explanation") -> Dict[str, Any]:
        """Generate voice lesson script"""
        try:
            lesson = await ai_service.generate_voice_lesson(topic, duration, style)
            
            # Log activity
            await self._log_activity("voice_lesson", user_id, {
                "topic": topic,
                "duration": duration,
                "style": style
            })
            
            return lesson
            
        except Exception as e:
            logger.error(f"Error generating voice lesson: {e}")
            raise
    
    async def _log_activity(self, action: str, user_id: str, metadata: Optional[Dict[str, Any]] = None):
        """Log chat activity"""
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
chat_service = ChatService()
