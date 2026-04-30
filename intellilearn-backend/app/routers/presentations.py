from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.core.security import get_current_user
from app.models.presentations import PresentationCreate
from app.services.presentations_service import presentations_service

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_presentation(
    payload: PresentationCreate,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    try:
        base_url = str(request.base_url).rstrip("/")
        return await presentations_service.create_presentation(current_user["id"], payload, base_url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create presentation: {e}",
        )


@router.get("/")
async def list_presentations(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    try:
        return await presentations_service.list_presentations(current_user["id"], page, limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch presentations: {e}",
        )


@router.delete("/{presentation_id}")
async def delete_presentation(
    presentation_id: str,
    current_user: dict = Depends(get_current_user),
):
    success = await presentations_service.delete_presentation(current_user["id"], presentation_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")
    return {"success": True}
