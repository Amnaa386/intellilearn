from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.security import HTTPBearer
from app.models.notes import NotesGenerateRequest, NotesResponse, NotesCategory, NotesType, NotesCreate
from app.services.notes_service import notes_service
from app.core.security import get_current_user
from app.core.redis import increment_rate_limit
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

@router.post("/generate", response_model=NotesResponse)
async def generate_notes(
    request: NotesGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate AI study notes"""
    try:
        # Rate limiting
        current, allowed = await increment_rate_limit(f"notes:{current_user['id']}", 20, 60)  # 20 per minute
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many notes generation requests. Please wait a moment."
            )
        
        notes = await notes_service.generate_notes(
            current_user["id"],
            request.topic,
            request.complexity,
            request.includeQuestions,
            request.category
        )
        
        return notes
    except Exception as e:
        logger.error(f"Error generating notes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate notes"
        )

@router.post("/", response_model=NotesResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    request: NotesCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create and persist a note from provided content."""
    try:
        note = await notes_service.create_note(current_user["id"], request)
        return note
    except Exception as e:
        logger.error(f"Error creating note: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create note"
        )

@router.get("/")
async def get_user_notes(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: NotesCategory = Query(None),
    bookmarked: bool = Query(None),
    search: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get user's notes with filtering"""
    try:
        result = await notes_service.get_user_notes(
            current_user["id"],
            page,
            limit,
            category,
            bookmarked,
            search
        )
        
        return result
    except Exception as e:
        logger.error(f"Error getting user notes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notes"
        )

@router.get("/{note_id}", response_model=NotesResponse)
async def get_note_by_id(note_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific note by ID"""
    try:
        note = await notes_service.get_note_by_id(current_user["id"], note_id)
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        return note
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting note by ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve note"
        )

@router.put("/{note_id}")
async def update_note(
    note_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update note"""
    try:
        note = await notes_service.update_note(current_user["id"], note_id, update_data)
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        return note
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating note: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update note"
        )

@router.delete("/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    """Delete note"""
    try:
        success = await notes_service.delete_note(current_user["id"], note_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        return {"success": True, "message": "Note deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting note: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete note"
        )

@router.post("/{note_id}/bookmark")
async def toggle_bookmark(note_id: str, current_user: dict = Depends(get_current_user)):
    """Toggle note bookmark status"""
    try:
        bookmarked = await notes_service.toggle_bookmark(current_user["id"], note_id)
        
        if bookmarked is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        return {
            "success": True,
            "bookmarked": bookmarked,
            "message": f"Note {'bookmarked' if bookmarked else 'unbookmarked'} successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling bookmark: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle bookmark"
        )

@router.get("/bookmarked/list")
async def get_bookmarked_notes(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get bookmarked notes"""
    try:
        result = await notes_service.get_bookmarked_notes(current_user["id"], page, limit)
        return result
    except Exception as e:
        logger.error(f"Error getting bookmarked notes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve bookmarked notes"
        )

@router.get("/stats/overview")
async def get_notes_stats(current_user: dict = Depends(get_current_user)):
    """Get user's notes statistics"""
    try:
        stats = await notes_service.get_notes_stats(current_user["id"])
        return stats
    except Exception as e:
        logger.error(f"Error getting notes stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notes statistics"
        )

@router.get("/search")
async def search_notes(
    query: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Search notes by text"""
    try:
        result = await notes_service.search_notes(current_user["id"], query, page, limit)
        return result
    except Exception as e:
        logger.error(f"Error searching notes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search notes"
        )
