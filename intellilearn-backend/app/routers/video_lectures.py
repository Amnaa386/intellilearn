from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user
from app.models.video_lectures import VideoLectureCreate
from app.services.video_lectures_service import video_lectures_service

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_video_lecture(
    payload: VideoLectureCreate,
    current_user: dict = Depends(get_current_user),
):
    try:
        return await video_lectures_service.create_video_lecture(current_user["id"], payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create video lecture: {e}",
        )


@router.get("/")
async def list_video_lectures(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    try:
        return await video_lectures_service.list_video_lectures(current_user["id"], page, limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch video lectures: {e}",
        )
