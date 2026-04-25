from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class FileType(str, Enum):
    IMAGE = "image"
    AUDIO = "audio"
    DOCUMENT = "document"

class ImageAnalysisRequest(BaseModel):
    description: Optional[str] = None
    context: Optional[str] = None

class ImageAnalysisResponse(BaseModel):
    analysis: str
    confidence: float
    tags: List[str]
    extractedText: Optional[str] = None

class AudioTranscriptionResponse(BaseModel):
    transcript: str
    confidence: float
    duration: float  # in seconds
    language: str

class VoiceLessonResponse(BaseModel):
    audioUrl: str
    transcript: str
    duration: float
    topic: str
    generatedAt: datetime

class PPTSlide(BaseModel):
    slideNumber: int
    title: Optional[str] = None
    content: str
    imageUrl: Optional[str] = None
    notes: Optional[str] = None

class PPTExtractionResponse(BaseModel):
    presentationId: str
    title: str
    totalSlides: int
    slides: List[PPTSlide]
    extractedAt: datetime

class FileUploadResponse(BaseModel):
    fileId: str
    filename: str
    fileType: FileType
    fileSize: int
    url: str
    uploadedAt: datetime
    metadata: Optional[Dict[str, Any]] = None

class BulkUploadResponse(BaseModel):
    uploaded: List[FileUploadResponse]
    failed: List[Dict[str, Any]]
    totalUploaded: int
    totalFailed: int
