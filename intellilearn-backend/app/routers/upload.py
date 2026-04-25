from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer
from fastapi.responses import FileResponse
from app.models.upload import FileType, ImageAnalysisResponse, AudioTranscriptionResponse, PPTExtractionResponse, FileUploadResponse
from app.core.config import settings
from app.core.security import get_current_user
from app.core.redis import increment_rate_limit
from app.services.ai_service import ai_service
import aiofiles
import os
import uuid
try:
    import magic
except ImportError:
    magic = None
from PIL import Image
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

@router.post("/image", response_model=FileUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    description: str = Form(None),
    context: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload image for AI analysis"""
    try:
        # Rate limiting
        current, allowed = await increment_rate_limit(f"upload_image:{current_user['id']}", 10, 60)  # 10 per minute
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many upload requests. Please wait a moment."
            )
        
        # Validate file
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image file"
            )
        
        # Check file size
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE} bytes"
            )
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported image format"
            )
        
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(settings.UPLOAD_DIR, "images", unique_filename)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Create file response
        file_url = f"/api/upload/files/images/{unique_filename}"
        file_id = str(uuid.uuid4())
        
        return FileUploadResponse(
            fileId=file_id,
            filename=file.filename,
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
        logger.error(f"Error uploading image: {e}")
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
        
        # Get image content for analysis
        file_path = os.path.join(settings.UPLOAD_DIR, "images", upload_result.filename)
        
        # Extract text from image using OCR (simplified - would use proper OCR library)
        extracted_text = await self._extract_text_from_image(file_path)
        
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
        file_path = os.path.join(settings.UPLOAD_DIR, "audio", unique_filename)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Create file response
        file_url = f"/api/upload/files/audio/{unique_filename}"
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
        file_path = os.path.join(settings.UPLOAD_DIR, "documents", unique_filename)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
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

@router.get("/files/{file_type}/{filename}")
async def get_uploaded_file(file_type: str, filename: str):
    """Serve uploaded files"""
    try:
        if file_type not in ["images", "audio", "documents"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type"
            )
        
        file_path = os.path.join(settings.UPLOAD_DIR, file_type, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        return FileResponse(file_path)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to serve file"
        )

async def _extract_text_from_image(file_path: str) -> str:
    """Extract text from image using OCR (simplified implementation)"""
    try:
        # In production, you would use a proper OCR library like pytesseract
        # This is a mock implementation
        return "Sample extracted text from image. This would contain the actual text content extracted using OCR."
    except Exception as e:
        logger.error(f"Error extracting text from image: {e}")
        return ""
