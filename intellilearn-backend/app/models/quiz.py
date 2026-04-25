from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class QuestionType(str, Enum):
    MCQ = "mcq"
    WRITTEN = "written"
    TRUE_FALSE = "true_false"

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class QuizSource(str, Enum):
    TOPIC = "topic"
    CHAT = "chat"
    NOTES = "notes"

class MCQQuestion(BaseModel):
    id: str
    type: QuestionType = QuestionType.MCQ
    question: str
    options: List[str] = Field(..., min_items=4, max_items=4)
    correct: int = Field(..., ge=0, le=3)
    explanation: Optional[str] = None

class WrittenQuestion(BaseModel):
    id: str
    type: QuestionType = QuestionType.WRITTEN
    question: str
    minLength: int = Field(default=50, ge=20)
    hintPool: List[str] = []
    modelAnswer: Optional[str] = None

class TrueFalseQuestion(BaseModel):
    id: str
    type: QuestionType = QuestionType.TRUE_FALSE
    question: str
    correct: bool
    explanation: Optional[str] = None

class Question(BaseModel):
    id: str
    type: QuestionType
    question: str
    
    # MCQ specific
    options: Optional[List[str]] = None
    correct: Optional[int] = None
    
    # Written specific
    minLength: Optional[int] = None
    hintPool: Optional[List[str]] = None
    
    # True/False specific
    correct_bool: Optional[bool] = None
    
    explanation: Optional[str] = None

class QuizGenerateRequest(BaseModel):
    source: QuizSource = QuizSource.TOPIC
    topic: Optional[str] = Field(None, min_length=1, max_length=200)
    sessionId: Optional[str] = None
    noteId: Optional[str] = None
    questionCount: int = Field(default=5, ge=1, le=20)
    difficulty: Difficulty = Difficulty.MEDIUM
    types: List[QuestionType] = [QuestionType.MCQ]

class QuizGenerateFromChatRequest(BaseModel):
    sessionId: str
    mode: str = Field(default="mcq", pattern="^(mcq|written)$")

class QuizResponse(BaseModel):
    id: str
    userId: str
    title: str
    source: QuizSource
    sourceId: Optional[str] = None
    questions: List[Question]
    createdAt: datetime
    completedAt: Optional[datetime] = None
    score: Optional[int] = None
    maxScore: int
    
    model_config = ConfigDict(from_attributes=True)

class QuizSubmission(BaseModel):
    quizId: str
    answers: Dict[str, Union[int, str, bool]]  # questionId -> answer
    writtenAnswers: Optional[Dict[str, Dict[str, Any]]] = None  # For written answers

class WrittenAnswerEvaluation(BaseModel):
    questionId: str
    quality: float = Field(..., ge=0.0, le=1.0)
    feedback: List[str] = []
    highlights: List[Dict[str, Any]] = []
    meetsLength: bool

class QuizResult(BaseModel):
    quizId: str
    score: int
    maxScore: int
    percentage: float
    passed: bool
    timeSpent: Optional[int] = None  # in seconds
    questionResults: List[Dict[str, Any]]
    feedback: str
    suggestions: List[str]

class HintRequest(BaseModel):
    quizId: str
    questionId: str
    hintsUsed: int = Field(default=0, ge=0)

class HintResponse(BaseModel):
    hint: Optional[str] = None
    hintsRemaining: int
    maxHints: int

class QuizListResponse(BaseModel):
    quizzes: List[QuizResponse]
    total: int
    page: int
    limit: int
