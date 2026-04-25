from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
import logging
import os
from contextlib import asynccontextmanager

from .database import get_db, engine
from .models import Base, User, ChatSession, Message
from .schemas import (
    UserCreate, UserResponse, Token, ChatRequest, ChatResponse,
    ChatSessionCreate, ChatSessionResponse, MessageResponse,
    IntentDetectionRequest, IntentDetectionResponse
)
from .auth import (
    authenticate_user, create_access_token, get_password_hash,
    get_current_active_user, get_current_user
)
from .config import settings
from .intent_detection import IntentDetector
from .content_generator import ContentGenerator
from .ai_services import AIService
from .enhanced_chat_api import router as enhanced_chat_router, cleanup as cleanup_enhanced
from .enhanced_registration import router as enhanced_registration_router
from .fixed_registration import router as fixed_registration_router
from .dev_chat_api import router as dev_chat_router
from .auth_config import should_bypass_auth, is_auth_enabled
from .ppt_generator import PPTGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Validate API keys on startup
def validate_api_keys():
    """Validate that all required API keys are present"""
    required_keys = {
        "GROQ_API_KEY": settings.GROQ_API_KEY,
        "GEMINI_API_KEY": settings.GEMINI_API_KEY,
        "DEEPSEEK_API_KEY": settings.DEEPSEEK_API_KEY
    }
    
    missing_keys = [key for key, value in required_keys.items() if not value or value == "your_api_key_here"]
    
    if missing_keys:
        logger.warning(f"Missing API keys: {', '.join(missing_keys)}")
        logger.warning("Some features may not work correctly without all API keys")
    else:
        logger.info("All API keys are configured")

# Application lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown"""
    # Startup
    logger.info("Starting AI Student Learning Platform...")
    validate_api_keys()
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Student Learning Platform...")
    await cleanup_enhanced()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Student Learning Platform",
    version="2.0.0",
    description="Advanced AI-powered learning platform with multi-API integration",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include enhanced routers
app.include_router(enhanced_chat_router)
app.include_router(enhanced_registration_router)
app.include_router(fixed_registration_router)
app.include_router(dev_chat_router)

# Initialize services
intent_detector = IntentDetector()
content_generator = ContentGenerator()
ai_service = AIService()

# Mock user for testing when auth is disabled
def get_mock_user():
    """Get a mock user for testing when authentication is disabled"""
    return User(
        id=1,
        email="test@example.com",
        username="testuser",
        hashed_password="mock_hash",
        is_active=True,
        created_at=datetime.now()
    )

def get_current_user_optional(current_user: User = None):
    """Get current user or mock user if auth is disabled"""
    if should_bypass_auth():
        logger.info("Authentication bypassed - using mock user")
        return get_mock_user()
    return current_user

# Security middleware for API key validation
@app.middleware("http")
async def validate_request_headers(request: Request, call_next):
    """Validate common security headers"""
    
    # Add security headers
    response = await call_next(request)
    
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response

@app.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    db_user_by_email = db.query(User).filter(User.email == user.email).first()
    if db_user_by_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    db_user_by_username = db.query(User).filter(User.username == user.username).first()
    if db_user_by_username:
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user and return access token"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user info"""
    return current_user

@app.post("/chat/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user if is_auth_enabled() else (lambda: get_mock_user()))
):
    """Create a new chat session"""
    db_session = ChatSession(
        title=session.title,
        user_id=current_user.id
    )
    
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    return db_session

@app.get("/chat/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user if is_auth_enabled() else (lambda: get_mock_user()))
):
    """Get all chat sessions for current user"""
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).all()
    return sessions

@app.get("/chat/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user if is_auth_enabled() else (lambda: get_mock_user()))
):
    """Get a specific chat session with messages"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    return session

@app.post("/chat", response_model=ChatResponse)
async def chat(
    chat_request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user if is_auth_enabled() else (lambda: get_mock_user()))
):
    """Process chat message and generate AI response"""
    
    logger.info("=== Backend Chat Debug Start ===")
    logger.info(f"Chat Request: {chat_request}")
    logger.info(f"User: {current_user.email if current_user else 'None'}")
    logger.info(f"Message: {chat_request.message}")
    
    try:
        # Get or create session
        if chat_request.session_id:
            logger.info(f"Using existing session: {chat_request.session_id}")
            session = db.query(ChatSession).filter(
                ChatSession.id == chat_request.session_id,
                ChatSession.user_id == current_user.id
            ).first()
            
            if not session:
                logger.error(f"Session not found: {chat_request.session_id}")
                raise HTTPException(status_code=404, detail="Chat session not found")
        else:
            # Create new session with first 50 chars of message as title
            logger.info("Creating new session")
            title = chat_request.message[:50] + "..." if len(chat_request.message) > 50 else chat_request.message
            session = ChatSession(title=title, user_id=current_user.id)
            db.add(session)
            db.commit()
            db.refresh(session)
            logger.info(f"New session created: {session.id}")
        
        # Save user message
        logger.info("Saving user message")
        user_message = Message(
            content=chat_request.message,
            message_type="user",
            session_id=session.id
        )
        db.add(user_message)
        
        # Detect intent
        logger.info("Detecting intent")
        intent, confidence = await intent_detector.detect_intent(chat_request.message)
        logger.info(f"Intent detected: {intent} (confidence: {confidence})")
        
        # Generate AI response
        logger.info("Generating AI response")
        messages = [
            {"role": "system", "content": "You are a helpful AI tutor for students. Provide clear, educational responses."},
            {"role": "user", "content": chat_request.message}
        ]
        logger.info(f"Messages for AI: {messages}")
        
        ai_response = await ai_service.get_chat_response(messages, intent)
        logger.info(f"AI Response received: {ai_response}")
        logger.info(f"AI Response Type: {type(ai_response)}")
        logger.info(f"AI Response Length: {len(ai_response) if ai_response else 0}")
        
        if not ai_response:
            logger.error("AI response is empty or None")
            raise HTTPException(status_code=500, detail="AI service returned empty response")
        
        # Generate structured content if applicable
        structured_content = None
        if intent in ["notes", "ppt", "quiz"]:
            logger.info(f"Generating structured content for intent: {intent}")
            try:
                structured_content = await content_generator.generate_structured_content(
                    chat_request.message, intent
                )
                logger.info(f"Structured content generated: {structured_content}")
            except Exception as e:
                logger.error(f"Failed to generate structured content: {e}")
                structured_content = None
        
        # Save AI response
        logger.info("Saving AI response")
        assistant_message = Message(
            content=ai_response,
            message_type="assistant",
            session_id=session.id,
            intent_type=intent
        )
        db.add(assistant_message)
        
        # Update session timestamp
        session.updated_at = session.created_at  # Will be updated by database trigger
        
        db.commit()
        logger.info("Database commit successful")
        
        response_data = ChatResponse(
            response=ai_response,
            intent_type=intent,
            session_id=session.id,
            structured_content=structured_content
        )
        
        logger.info(f"Final Response: {response_data}")
        logger.info("=== Backend Chat Debug End (Success) ===")
        
        return response_data
        
    except Exception as e:
        logger.error("=== Backend Chat Debug End (Error) ===")
        logger.error(f"Chat endpoint error: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error stack: {e.__traceback__}")
        
        # Rollback any database changes
        db.rollback()
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat message: {str(e)}"
        )

@app.post("/detect-intent", response_model=IntentDetectionResponse)
async def detect_intent(request: IntentDetectionRequest):
    """Detect intent of a message (for testing)"""
    intent, confidence = await intent_detector.detect_intent(request.message)
    return IntentDetectionResponse(intent=intent, confidence=confidence)

@app.post("/generate-ppt")
async def generate_ppt(
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user if is_auth_enabled() else (lambda: get_mock_user()))
):
    """Generate PowerPoint presentation and return download URL"""
    logger.info("=== PPT Generation Request ===")
    logger.info(f"Request: {request}")
    logger.info(f"User: {current_user.email if current_user else 'None'}")
    
    try:
        # Extract request parameters
        topic = request.get('topic', '').strip()
        num_slides = request.get('num_slides', 8)
        
        # Validate inputs
        if not topic:
            raise HTTPException(status_code=400, detail="Topic is required")
        
        if not isinstance(num_slides, int) or num_slides < 3 or num_slides > 20:
            raise HTTPException(status_code=400, detail="Number of slides must be between 3 and 20")
        
        logger.info(f"Generating PPT for topic: {topic}, slides: {num_slides}")
        
        # Initialize PPT generator
        ppt_generator = PPTGenerator()
        
        # Generate presentation
        ppt_path = await ppt_generator.generate_presentation(topic, num_slides)
        
        # Get file info
        file_info = ppt_generator.get_file_info(ppt_path)
        
        logger.info(f"PPT generated successfully: {file_info}")
        
        return {
            "success": True,
            "message": "PowerPoint generated successfully",
            "file_info": file_info,
            "download_url": f"/download-ppt?file={file_info['filename']}"
        }
        
    except Exception as e:
        logger.error(f"PPT generation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PowerPoint: {str(e)}"
        )

@app.get("/download-ppt")
async def download_ppt(
    file: str = None,
    current_user: User = Depends(get_current_active_user if is_auth_enabled() else (lambda: get_mock_user()))
):
    """Download generated PowerPoint file"""
    logger.info(f"PPT download request for file: {file}")
    
    try:
        if not file:
            raise HTTPException(status_code=400, detail="File parameter is required")
        
        # Construct file path
        file_path = os.path.join(tempfile.gettempdir(), file)
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check if it's a PPT file
        if not file.endswith('.pptx'):
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        logger.info(f"Serving file: {file_path}")
        
        # Read file and return as response
        def iterfile():
            with open(file_path, mode="rb") as file_like:
                yield from file_like
        
        # Get file info for headers
        file_stat = os.stat(file_path)
        
        # Return file response
        from fastapi.responses import StreamingResponse
        
        response = StreamingResponse(
            iterfile(), 
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )
        
        # Set headers for download
        response.headers["Content-Disposition"] = f"attachment; filename={file}"
        response.headers["Content-Length"] = str(file_stat.st_size)
        
        # Schedule cleanup after download
        import threading
        def cleanup():
            import time
            time.sleep(300)  # Wait 5 minutes before cleanup
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Cleaned up file: {file_path}")
            except Exception as e:
                logger.error(f"Cleanup error: {e}")
        
        cleanup_thread = threading.Thread(target=cleanup)
        cleanup_thread.daemon = True
        cleanup_thread.start()
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download file: {str(e)}"
        )

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "AI Learning Platform API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Check database connection
        db_status = "connected"
        try:
            db = next(get_db())
            db.execute("SELECT 1")
        except Exception as e:
            db_status = f"error: {str(e)}"
        
        # Check API keys
        api_keys_status = {
            "groq": bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY != "your_groq_api_key_here"),
            "gemini": bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here"),
            "deepseek": bool(settings.DEEPSEEK_API_KEY and settings.DEEPSEEK_API_KEY != "your_deepseek_api_key_here")
        }
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0",
            "services": {
                "database": db_status,
                "ai_services": "operational",
                "ppt_generator": "available",
                "api_keys": api_keys_status
            }
        }
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
