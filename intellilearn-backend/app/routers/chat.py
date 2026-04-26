from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer
from app.models.chat import AIRequest, AIResponse, ChatSessionResponse, ChatSessionWithMessages, MessageCreate, PPTExplainRequest, VoiceLessonRequest
from app.services.chat_service import chat_service
from app.services.ai_service import AIRateLimitError
from app.core.security import get_current_user
from app.core.redis import increment_rate_limit
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

@router.post("/ask-ai", response_model=AIResponse)
async def ask_ai(request: AIRequest, current_user: dict = Depends(get_current_user)):
    """Send message to AI tutor and get response"""
    try:
        # Rate limiting
        current, allowed = await increment_rate_limit(f"chat:{current_user['id']}", 30, 60)  # 30 per minute
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many chat requests. Please wait a moment."
            )
        
        # Create or get session
        if not request.sessionId:
            session = await chat_service.create_session(current_user["id"])
            session_id = session.id
        else:
            session_id = request.sessionId
        
        # Send message
        message_data = MessageCreate(content=request.message, type="user")
        result = await chat_service.send_message(current_user["id"], session_id, message_data)
        
        return AIResponse(
            message=result["botMessage"].content,
            sessionId=session_id,
            messageId=result["botMessage"].id,
            timestamp=result["botMessage"].timestamp,
            usage=result.get("usage", {})
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AIRateLimitError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat request"
        )

@router.get("/sessions", response_model=list[ChatSessionResponse])
async def get_chat_sessions(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get user's chat sessions"""
    try:
        sessions = await chat_service.get_user_sessions(current_user["id"], page, limit)
        return sessions
    except Exception as e:
        logger.error(f"Error getting chat sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat sessions"
        )

@router.get("/sessions/{session_id}", response_model=ChatSessionWithMessages)
async def get_chat_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific chat session with messages"""
    try:
        result = await chat_service.get_session_with_messages(session_id, current_user["id"])
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat session"
        )

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: dict = None,
    current_user: dict = Depends(get_current_user)
):
    """Create new chat session"""
    try:
        from app.models.chat import ChatSessionCreate
        
        create_data = ChatSessionCreate(**session_data) if session_data else None
        session = await chat_service.create_session(current_user["id"], create_data)
        
        return session
    except Exception as e:
        logger.error(f"Error creating chat session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create chat session"
        )

@router.delete("/sessions/{session_id}")
async def delete_chat_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Delete chat session"""
    try:
        success = await chat_service.delete_session(current_user["id"], session_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        return {"success": True, "message": "Chat session deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete chat session"
        )

@router.put("/sessions/{session_id}/title")
async def update_session_title(
    session_id: str,
    title_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update chat session title"""
    try:
        title = title_data.get("title")
        if not title:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title is required"
            )
        
        success = await chat_service.update_session_title(current_user["id"], session_id, title)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        return {"success": True, "message": "Session title updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating session title: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update session title"
        )

@router.post("/sessions/{session_id}/title/auto")
async def auto_title_session(
    session_id: str,
    payload: dict = None,
    current_user: dict = Depends(get_current_user)
):
    """Auto-generate chat title from first/seed user message."""
    try:
        seed_text = (payload or {}).get("seedText", "")
        title = await chat_service.auto_generate_session_title(current_user["id"], session_id, seed_text)
        if not title:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Unable to generate title for this session"
            )
        return {"success": True, "title": title}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error auto-titling session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to auto-generate session title"
        )

@router.get("/stats")
async def get_chat_stats(current_user: dict = Depends(get_current_user)):
    """Get user's chat statistics"""
    try:
        stats = await chat_service.get_session_stats(current_user["id"])
        return stats
    except Exception as e:
        logger.error(f"Error getting chat stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat statistics"
        )

@router.post("/explain-ppt")
async def explain_ppt_slide(
    request: PPTExplainRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get AI explanation for PowerPoint slide"""
    try:
        # Rate limiting
        current, allowed = await increment_rate_limit(f"ppt:{current_user['id']}", 10, 60)  # 10 per minute
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many PPT explanation requests. Please wait a moment."
            )
        
        explanation = await chat_service.explain_ppt_slide(
            current_user["id"],
            request.slideContent,
            request.slideNumber,
            request.context
        )
        
        return explanation
    except Exception as e:
        logger.error(f"Error explaining PPT slide: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to explain PowerPoint slide"
        )

@router.post("/voice-lesson")
async def generate_voice_lesson(
    request: VoiceLessonRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate voice lesson script"""
    try:
        # Rate limiting
        current, allowed = await increment_rate_limit(f"voice:{current_user['id']}", 5, 60)  # 5 per minute
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many voice lesson requests. Please wait a moment."
            )
        
        lesson = await chat_service.generate_voice_lesson(
            current_user["id"],
            request.topic,
            request.duration,
            request.style
        )
        
        return lesson
    except Exception as e:
        logger.error(f"Error generating voice lesson: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate voice lesson"
        )
