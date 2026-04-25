from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId
import logging
from app.core.database import get_database
from app.core.redis import set_cache, get_cache, delete_cache
from app.services.ai_service import ai_service
from app.models.chat import ChatSessionCreate, ChatSessionResponse, MessageCreate, MessageResponse, MessageType

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.db = get_database()
    
    async def create_session(self, user_id: str, session_data: Optional[ChatSessionCreate] = None) -> ChatSessionResponse:
        """Create a new chat session"""
        try:
            session_id = f"chat_{datetime.utcnow().timestamp()}_{ObjectId()}"
            
            session_doc = {
                "_id": session_id,
                "userId": user_id,
                "sessionId": session_id,
                "title": session_data.title if session_data else "New Chat Session",
                "messageCount": 0,
                "preview": "",
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            await self.db.chat_sessions.insert_one(session_doc)
            
            # Add welcome message
            welcome_message = {
                "_id": str(ObjectId()),
                "sessionId": session_id,
                "userId": user_id,
                "content": "Hello! I'm Dr. Intelli, your AI Tutor. How can I help you with your studies today?",
                "type": MessageType.BOT,
                "timestamp": datetime.utcnow()
            }
            
            await self.db.messages.insert_one(welcome_message)
            
            # Update message count
            await self.db.chat_sessions.update_one(
                {"_id": session_id},
                {"$set": {"messageCount": 1, "updatedAt": datetime.utcnow()}}
            )
            
            return ChatSessionResponse(**session_doc)
            
        except Exception as e:
            logger.error(f"Error creating chat session: {e}")
            raise
    
    async def get_user_sessions(self, user_id: str, page: int = 1, limit: int = 20) -> List[ChatSessionResponse]:
        """Get user's chat sessions"""
        try:
            skip = (page - 1) * limit
            
            sessions = await self.db.chat_sessions.find(
                {"userId": user_id}
            ).sort("updatedAt", -1).skip(skip).limit(limit).to_list(length=limit)
            
            return [ChatSessionResponse(**session) for session in sessions]
            
        except Exception as e:
            logger.error(f"Error getting user sessions: {e}")
            return []
    
    async def get_session_with_messages(self, session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get chat session with all messages"""
        try:
            # Get session
            session = await self.db.chat_sessions.find_one({
                "_id": session_id,
                "userId": user_id
            })
            
            if not session:
                return None
            
            # Get messages
            messages = await self.db.messages.find(
                {"sessionId": session_id}
            ).sort("timestamp", 1).to_list(length=None)
            
            message_responses = [MessageResponse(**msg) for msg in messages]
            
            return {
                "session": ChatSessionResponse(**session),
                "messages": message_responses
            }
            
        except Exception as e:
            logger.error(f"Error getting session with messages: {e}")
            return None
    
    async def send_message(self, user_id: str, session_id: str, message_data: MessageCreate) -> Dict[str, Any]:
        """Send a message and get AI response"""
        try:
            # Verify session belongs to user
            session = await self.db.chat_sessions.find_one({
                "_id": session_id,
                "userId": user_id
            })
            
            if not session:
                raise ValueError("Session not found")
            
            # Create user message
            user_message_id = str(ObjectId())
            user_message = {
                "_id": user_message_id,
                "sessionId": session_id,
                "userId": user_id,
                "content": message_data.content,
                "type": MessageType.USER,
                "timestamp": datetime.utcnow()
            }
            
            await self.db.messages.insert_one(user_message)
            
            # Get chat history for context
            recent_messages = await self.db.messages.find(
                {"sessionId": session_id}
            ).sort("timestamp", -1).limit(10).to_list(length=10)
            
            # Format for OpenAI
            chat_history = []
            for msg in reversed(recent_messages[1:]):  # Exclude the newest message
                role = "user" if msg["type"] == MessageType.USER else "assistant"
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
            bot_message_id = str(ObjectId())
            bot_message = {
                "_id": bot_message_id,
                "sessionId": session_id,
                "userId": user_id,
                "content": ai_response["message"],
                "type": MessageType.BOT,
                "timestamp": datetime.utcnow()
            }
            
            await self.db.messages.insert_one(bot_message)
            
            # Update session
            new_message_count = session["messageCount"] + 2
            preview = message_data.content[:100] + "..." if len(message_data.content) > 100 else message_data.content
            
            await self.db.chat_sessions.update_one(
                {"_id": session_id},
                {
                    "$set": {
                        "messageCount": new_message_count,
                        "preview": preview,
                        "updatedAt": datetime.utcnow()
                    }
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
            # Delete messages
            await self.db.messages.delete_many({"sessionId": session_id})
            
            # Delete session
            result = await self.db.chat_sessions.delete_one({
                "_id": session_id,
                "userId": user_id
            })
            
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting session: {e}")
            return False
    
    async def update_session_title(self, user_id: str, session_id: str, title: str) -> bool:
        """Update chat session title"""
        try:
            result = await self.db.chat_sessions.update_one(
                {"_id": session_id, "userId": user_id},
                {
                    "$set": {
                        "title": title,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error updating session title: {e}")
            return False
    
    async def get_session_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user's chat statistics"""
        try:
            pipeline = [
                {"$match": {"userId": user_id}},
                {
                    "$group": {
                        "_id": None,
                        "totalSessions": {"$sum": 1},
                        "totalMessages": {"$sum": "$messageCount"},
                        "lastActivity": {"$max": "$updatedAt"}
                    }
                }
            ]
            
            stats = await self.db.chat_sessions.aggregate(pipeline).to_list(length=1)
            
            if stats:
                stat = stats[0]
                return {
                    "totalSessions": stat["totalSessions"],
                    "totalMessages": stat["totalMessages"],
                    "lastActivity": stat["lastActivity"],
                    "averageMessagesPerSession": stat["totalMessages"] / stat["totalSessions"] if stat["totalSessions"] > 0 else 0
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
chat_service = ChatService()
