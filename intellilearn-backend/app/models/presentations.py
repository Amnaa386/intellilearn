from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import List
from enum import Enum


class PresentationTheme(str, Enum):
    CLASSIC = "classic"
    MODERN = "modern"
    PREMIUM = "premium"


class PresentationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    topic: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    theme: PresentationTheme = PresentationTheme.MODERN


class PresentationResponse(BaseModel):
    id: str
    userId: str
    title: str
    topic: str
    fileName: str
    fileUrl: str
    slideCount: int
    createdAt: datetime
    tags: List[str]
    theme: PresentationTheme

    model_config = ConfigDict(from_attributes=True)
