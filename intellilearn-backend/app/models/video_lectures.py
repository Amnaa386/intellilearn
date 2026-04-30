from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
from typing import List


class VoiceStyle(str, Enum):
    STANDARD = "standard"
    HUMANIZED = "humanized"


class VideoLectureCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    topic: str = Field(..., min_length=1, max_length=200)
    script: str = Field(..., min_length=1)
    voiceStyle: VoiceStyle = VoiceStyle.HUMANIZED
    voiceSpeed: float = Field(1.0, ge=0.8, le=1.25)


class VideoLectureResponse(BaseModel):
    id: str
    userId: str
    title: str
    topic: str
    videoUrl: str
    durationSec: int
    voiceStyle: VoiceStyle
    voiceSpeed: float
    tags: List[str]
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)
