from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class NotesCategory(str, Enum):
    SCIENCE = "science"
    MATHEMATICS = "mathematics"
    HISTORY = "history"
    LITERATURE = "literature"
    TECHNOLOGY = "technology"
    BUSINESS = "business"
    GENERAL = "general"

class NotesType(str, Enum):
    SIMPLE = "simple"
    DETAILED = "detailed"

class NotesGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    complexity: NotesType = NotesType.SIMPLE
    includeQuestions: bool = True
    category: Optional[NotesCategory] = None

class NotesResponse(BaseModel):
    id: str
    userId: str
    title: str
    content: str
    category: NotesCategory
    type: NotesType
    tags: List[str]
    topic: str
    bookmarked: bool
    generatedAt: datetime
    
    model_config = ConfigDict(from_attributes=True)

class NotesCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    category: NotesCategory
    type: NotesType
    tags: List[str] = []
    topic: str
    bookmarked: bool = False

class NotesUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[List[str]] = None
    bookmarked: Optional[bool] = None

class NotesListResponse(BaseModel):
    notes: List[NotesResponse]
    total: int
    page: int
    limit: int

class BookmarkRequest(BaseModel):
    noteId: str
    bookmarked: bool
