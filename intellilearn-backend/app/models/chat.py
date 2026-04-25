from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class MessageType(str, Enum):
    USER = "user"
    BOT = "bot"

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    type: MessageType = MessageType.USER

class MessageResponse(BaseModel):
    id: str
    content: str
    type: MessageType
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ChatSessionCreate(BaseModel):
    title: Optional[str] = None

class ChatSessionResponse(BaseModel):
    id: str
    userId: str
    sessionId: str
    title: Optional[str] = None
    messageCount: int
    preview: str
    createdAt: datetime
    updatedAt: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ChatSessionWithMessages(ChatSessionResponse):
    messages: List[MessageResponse]

class AIRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    sessionId: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class AIResponse(BaseModel):
    message: str
    sessionId: str
    messageId: str
    timestamp: datetime
    usage: Optional[Dict[str, Any]] = None

class PPTExplainRequest(BaseModel):
    slideContent: str = Field(..., min_length=1)
    slideNumber: int = Field(..., ge=1)
    context: Optional[str] = None

class VoiceLessonRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    duration: int = Field(default=5, ge=1, le=30)  # minutes
    style: str = Field(default="explanation", pattern="^(explanation|story|conversation)$")
