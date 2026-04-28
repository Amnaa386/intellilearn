from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer
from app.models.upload import FileType, ImageAnalysisResponse, AudioTranscriptionResponse, PPTExtractionResponse, FileUploadResponse
from app.core.config import settings
from app.core.security import get_current_user
from app.core.redis import increment_rate_limit
from app.services.ai_service import ai_service
import os
import uuid
from datetime import datetime
import httpx
try:
    import magic
except ImportError:
    magic = None
from PIL import Image
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

async def _enforce_daily_upload_limit(user_id: str):
    """Limit each user to 2 uploads per UTC day."""
    day_key = datetime.utcnow().strftime("%Y-%m-%d")
    _, allowed = await increment_rate_limit(f"upload_daily:{user_id}:{day_key}", 2, 60 * 60 * 24)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily upload limit reached. You can upload max 2 files per day."
        )

def _supabase_base_url() -> str:
    base = (settings.SUPABASE_URL or "").strip().rstrip("/")
    if not base:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase URL is not configured"
        )
    if base.endswith("/rest/v1"):
        base = base[:-8]
    return base


def _supabase_headers(content_type: str = "application/octet-stream") -> dict:
    service_key = (settings.SUPABASE_SERVICE_ROLE_KEY or "").strip()
    if not service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase service role key is not configured"
        )
    return {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "x-upsert": "true",
        "Content-Type": content_type,
    }


async def _upload_to_supabase_storage(path: str, content: bytes, content_type: str) -> str:
    bucket = (settings.SUPABASE_STORAGE_BUCKET or "").strip()
    if not bucket:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase storage bucket is not configured"
        )

    base = _supabase_base_url()
    upload_url = f"{base}/storage/v1/object/{bucket}/{path}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        upload_resp = await client.post(upload_url, headers=_supabase_headers(content_type), content=content)
    if upload_resp.status_code >= 400:
        raise RuntimeError(f"Supabase upload failed ({upload_resp.status_code}): {upload_resp.text}")

    # Prefer signed URL for controlled access.
    sign_url = f"{base}/storage/v1/object/sign/{bucket}/{path}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        sign_resp = await client.post(
            sign_url,
            headers=_supabase_headers("application/json"),
            json={"expiresIn": 60 * 60 * 24 * 7},
        )
    if sign_resp.status_code < 400:
        signed_payload = sign_resp.json()
        signed_relative = signed_payload.get("signedURL")
        if signed_relative:
            return f"{base}/storage/v1{signed_relative}"

    # Fallback public URL (works when bucket is public).
    return f"{base}/storage/v1/object/public/{bucket}/{path}"

@router.post("/image", response_model=FileUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    description: str = Form(None),
    context: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload image for AI analysis"""
    try:
        await _enforce_daily_upload_limit(current_user["id"])
        # Rate limiting
        current, allowed = await increment_rate_limit(f"upload_image:{current_user['id']}", 10, 60)  # 10 per minute
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many upload requests. Please wait a moment."
            )
        
        # Check file size
        content = await file.read()
        file_size = len(content)
        
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE} bytes"
            )
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename or "")[1].lower()
        image_ext_from_type = {
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/png": ".png",
            "image/gif": ".gif",
            "image/webp": ".webp",
        }
        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
        content_type = (file.content_type or "").lower()
        mime_ext = image_ext_from_type.get(content_type, "")
        if not content_type.startswith("image/") and file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image file"
            )
        if file_extension not in allowed_extensions:
            if mime_ext:
                file_extension = mime_ext
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unsupported image format"
                )
        
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        storage_path = f"uploads/images/{unique_filename}"
        file_url = await _upload_to_supabase_storage(storage_path, content, content_type or "image/jpeg")
        file_id = str(uuid.uuid4())
        
        return FileUploadResponse(
            fileId=file_id,
            filename=file.filename or unique_filename,
            fileType=FileType.IMAGE,
            fileSize=file_size,
            url=file_url,
            uploadedAt=datetime.utcnow(),
            metadata={
                "description": description,
                "context": context
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error uploading image")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload image"
        )

@router.post("/image/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    description: str = Form(None),
    context: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Analyze uploaded image with AI"""
    try:
        # First upload the image
        upload_result = await upload_image(file, description, context, current_user)
        
        # Extract text from image using OCR (placeholder for future OCR integration)
        extracted_text = ""
        
        # Generate AI analysis
        analysis_prompt = f"""
        Analyze this image for educational purposes.
        Image description: {description or 'Not provided'}
        Context: {context or 'General learning'}
        
        Provide:
        1. A detailed analysis of what's in the image
        2. Educational relevance and potential learning applications
        3. Key concepts or topics it relates to
        4. Confidence level in the analysis
        """
        
        # This would integrate with a vision-capable AI model
        analysis = "This image contains educational content relevant to the provided context. The analysis shows clear visual elements that can be used for learning purposes."
        
        return ImageAnalysisResponse(
            analysis=analysis,
            confidence=0.85,
            tags=["educational", "visual", "learning"],
            extractedText=extracted_text
        )
        
    except Exception as e:
        logger.error(f"Error analyzing image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze image"
        )

@router.post("/audio", response_model=FileUploadResponse)
async def upload_audio(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload audio file for transcription"""
    try:
        await _enforce_daily_upload_limit(current_user["id"])
        # Rate limiting
        current, allowed = await increment_rate_limit(f"upload_audio:{current_user['id']}", 5, 60)  # 5 per minute
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many upload requests. Please wait a moment."
            )
        
        # Validate file
        if not file.content_type or not file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid audio file"
            )
        
        # Check file size
        content = await file.read()
        file_size = len(content)
        
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE} bytes"
            )
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ['.mp3', '.wav', '.m4a', '.ogg']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported audio format"
            )
        
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        storage_path = f"uploads/audio/{unique_filename}"
        file_url = await _upload_to_supabase_storage(storage_path, content, file.content_type or "audio/mpeg")
        file_id = str(uuid.uuid4())
        
        return FileUploadResponse(
            fileId=file_id,
            filename=file.filename,
            fileType=FileType.AUDIO,
            fileSize=file_size,
            url=file_url,
            uploadedAt=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload audio"
        )

@router.post("/audio/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Transcribe uploaded audio file"""
    try:
        # First upload the audio
        upload_result = await upload_audio(file, current_user)
        
        # Transcribe using speech-to-text (simplified - would use proper STT service)
        transcript = "This is a sample transcription of the uploaded audio file. In production, this would use a proper speech-to-text service."
        
        return AudioTranscriptionResponse(
            transcript=transcript,
            confidence=0.92,
            duration=120.5,  # seconds
            language="en"
        )
        
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to transcribe audio"
        )

@router.post("/presentation", response_model=PPTExtractionResponse)
async def upload_presentation(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload PowerPoint presentation and extract content"""
    try:
        await _enforce_daily_upload_limit(current_user["id"])
        # Rate limiting
        current, allowed = await increment_rate_limit(f"upload_ppt:{current_user['id']}", 3, 60)  # 3 per minute
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many upload requests. Please wait a moment."
            )
        
        # Validate file
        if not file.filename or not file.filename.lower().endswith(('.ppt', '.pptx')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PowerPoint file"
            )
        
        # Check file size
        content = await file.read()
        file_size = len(content)
        
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE} bytes"
            )
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        storage_path = f"uploads/documents/{unique_filename}"
        await _upload_to_supabase_storage(
            storage_path,
            content,
            file.content_type or "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        )
        
        # Extract content from PowerPoint (simplified - would use proper PPT parsing library)
        slides = []
        for i in range(1, 6):  # Mock 5 slides
            slides.append({
                "slideNumber": i,
                "title": f"Slide {i} Title",
                "content": f"This is the content for slide {i}. It contains important information about the topic being presented.",
                "imageUrl": None,
                "notes": f"Speaker notes for slide {i}"
            })
        
        presentation_id = str(uuid.uuid4())
        
        return PPTExtractionResponse(
            presentationId=presentation_id,
            title=file.filename.replace('.pptx', '').replace('.ppt', ''),
            totalSlides=len(slides),
            slides=slides,
            extractedAt=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading presentation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload presentation"
        )

@router.post("/document", response_model=FileUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload generic document files (pdf/doc/docx/txt)."""
    try:
        await _enforce_daily_upload_limit(current_user["id"])

        content = await file.read()
        file_size = len(content)
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE} bytes"
            )

        file_extension = os.path.splitext(file.filename or "")[1].lower()
        allowed_extensions = {".pdf", ".doc", ".docx", ".txt", ".ppt", ".pptx"}
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported document format"
            )

        unique_filename = f"{uuid.uuid4()}{file_extension}"
        storage_path = f"uploads/documents/{unique_filename}"
        file_url = await _upload_to_supabase_storage(
            storage_path,
            content,
            file.content_type or "application/octet-stream",
        )
        file_id = str(uuid.uuid4())

        return FileUploadResponse(
            fileId=file_id,
            filename=file.filename or unique_filename,
            fileType=FileType.DOCUMENT,
            fileSize=file_size,
            url=file_url,
            uploadedAt=datetime.utcnow()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document"
        )

