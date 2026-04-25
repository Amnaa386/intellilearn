from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.security import HTTPBearer
from app.models.quiz import QuizGenerateRequest, QuizGenerateFromChatRequest, QuizResponse, QuizSubmission, HintRequest
from app.services.quiz_service import quiz_service
from app.core.security import get_current_user
from app.core.redis import increment_rate_limit
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(
    request: QuizGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate AI quiz questions"""
    try:
        # Rate limiting
        current, allowed = await increment_rate_limit(f"quiz:{current_user['id']}", 10, 60)  # 10 per minute
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many quiz generation requests. Please wait a moment."
            )
        
        quiz = await quiz_service.generate_quiz(
            current_user["id"],
            request.source,
            request.topic,
            request.sessionId,
            request.noteId,
            request.questionCount,
            request.difficulty,
            request.types
        )
        
        return quiz
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate quiz"
        )

@router.post("/generate/from-chat", response_model=QuizResponse)
async def generate_quiz_from_chat(
    request: QuizGenerateFromChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate quiz from chat session"""
    try:
        quiz = await quiz_service.generate_quiz_from_chat(
            current_user["id"],
            request.sessionId,
            request.mode
        )
        
        return quiz
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating quiz from chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate quiz from chat"
        )

@router.get("/")
async def get_user_quizzes(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    completed: bool = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get user's quizzes with filtering"""
    try:
        result = await quiz_service.get_user_quizzes(
            current_user["id"],
            page,
            limit,
            completed
        )
        
        return result
    except Exception as e:
        logger.error(f"Error getting user quizzes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve quizzes"
        )

@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz_by_id(quiz_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific quiz by ID"""
    try:
        quiz = await quiz_service.get_quiz_by_id(current_user["id"], quiz_id)
        
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found"
            )
        
        return quiz
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quiz by ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve quiz"
        )

@router.post("/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: str,
    submission: QuizSubmission,
    current_user: dict = Depends(get_current_user)
):
    """Submit quiz answers and get results"""
    try:
        submission.quizId = quiz_id
        result = await quiz_service.submit_quiz(
            current_user["id"],
            quiz_id,
            submission.answers,
            submission.writtenAnswers
        )
        
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error submitting quiz: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit quiz"
        )

@router.post("/{quiz_id}/evaluate-written")
async def evaluate_written_answer(
    quiz_id: str,
    evaluation_request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Evaluate written answer using AI"""
    try:
        question_id = evaluation_request.get("questionId")
        answer = evaluation_request.get("answer")
        
        if not question_id or not answer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question ID and answer are required"
            )
        
        evaluation = await quiz_service.evaluate_written_answer(
            current_user["id"],
            quiz_id,
            question_id,
            answer
        )
        
        return evaluation
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error evaluating written answer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to evaluate answer"
        )

@router.post("/{quiz_id}/hint")
async def get_hint(
    quiz_id: str,
    request: HintRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get hint for written question"""
    try:
        request.quizId = quiz_id
        hint = await quiz_service.get_hint(
            current_user["id"],
            quiz_id,
            request.questionId,
            request.hintsUsed
        )
        
        return hint
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error getting hint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get hint"
        )

@router.delete("/{quiz_id}")
async def delete_quiz(quiz_id: str, current_user: dict = Depends(get_current_user)):
    """Delete quiz"""
    try:
        success = await quiz_service.delete_quiz(current_user["id"], quiz_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found"
            )
        
        return {"success": True, "message": "Quiz deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting quiz: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete quiz"
        )

@router.get("/stats/overview")
async def get_quiz_stats(current_user: dict = Depends(get_current_user)):
    """Get user's quiz statistics"""
    try:
        stats = await quiz_service.get_quiz_stats(current_user["id"])
        return stats
    except Exception as e:
        logger.error(f"Error getting quiz stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve quiz statistics"
        )
