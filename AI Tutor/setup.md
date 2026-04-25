# AI Learning Platform Setup Guide

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL (optional, can use SQLite for development)

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create `.env` file in `backend/` directory:
```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key  
DEEPSEEK_API_KEY=your_deepseek_api_key
DATABASE_URL=sqlite:///./ai_tutor.db  # Use SQLite for simplicity
JWT_SECRET=your_jwt_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Start the backend:
```bash
uvicorn app.main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

### 3. Quick Launch (Windows)

Run the provided `start.bat` file to launch both servers simultaneously.

## Features Implemented

### Backend (FastAPI)
- **Authentication System**: JWT-based login/signup
- **Multi-AI Integration**: Groq (fast responses), Gemini (structured content), DeepSeek (complex queries)
- **Intelligent Intent Detection**: Automatically determines user needs
- **Structured Content Generation**: Notes, quizzes, presentations
- **Database Management**: SQLAlchemy with PostgreSQL/SQLite
- **API Documentation**: Auto-generated Swagger docs at `/docs`

### Frontend (React + Tailwind)
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Smooth Animations**: Framer Motion for transitions
- **Dark/Light Mode**: Theme switching with persistence
- **Chat Interface**: Real-time messaging with typing indicators
- **Sidebar Navigation**: Chat history management
- **Authentication Flow**: Login/register with smooth prompts
- **Mobile Responsive**: Works on all screen sizes

### Key Features
- **Intent Detection**: Automatically detects if user wants explanation, notes, quiz, or PPT
- **AI Routing**: Intelligently routes requests to appropriate AI service
- **Structured Output**: Generates well-formatted academic content
- **Session Management**: Persistent chat history
- **Real-time Updates**: Live typing indicators and message streaming

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info

### Chat
- `GET /chat/sessions` - Get all chat sessions
- `POST /chat/sessions` - Create new chat session
- `GET /chat/sessions/{id}` - Get specific session
- `POST /chat` - Send message and get AI response

### Utilities
- `POST /detect-intent` - Test intent detection
- `GET /health` - Health check endpoint

## Environment Variables

### Required API Keys
1. **Groq API Key**: Get from https://console.groq.com
2. **Gemini API Key**: Get from https://makersuite.google.com/app/apikey
3. **DeepSeek API Key**: Get from https://platform.deepseek.com

### Database
- **Development**: Use SQLite for simplicity
- **Production**: Use PostgreSQL with connection string

## Development Notes

### File Structure
```
AI Tutor/
|-- backend/
|   |-- app/
|   |   |-- main.py           # FastAPI application
|   |   |-- auth.py           # Authentication logic
|   |   |-- ai_services.py    # AI API integrations
|   |   |-- intent_detection.py # Intent detection
|   |   |-- content_generator.py # Content generation
|   |   |-- models.py         # Database models
|   |   |-- schemas.py        # Pydantic schemas
|   |   |-- database.py       # Database setup
|   |   |-- config.py         # Configuration
|   |-- requirements.txt
|   |-- .env.example
|-- frontend/
|   |-- src/
|   |   |-- components/       # React components
|   |   |-- pages/           # Page components
|   |   |-- contexts/        # React contexts
|   |   |-- utils/           # Utility functions
|   |   |-- App.js           # Main app component
|   |-- package.json
|   |-- tailwind.config.js
|-- start.bat                # Windows startup script
```

### Customization Tips
1. **Add new AI services**: Update `ai_services.py`
2. **Modify intent detection**: Update `intent_detection.py`
3. **Change UI themes**: Modify `tailwind.config.js`
4. **Add new content types**: Update `content_generator.py`

## Troubleshooting

### Common Issues
1. **CORS errors**: Ensure frontend URL is in CORS origins
2. **Database connection**: Check DATABASE_URL format
3. **API key errors**: Verify all API keys are valid
4. **Port conflicts**: Change ports if 8000/3000 are occupied

### Debug Mode
- Backend: Check `/docs` for API documentation
- Frontend: Use browser dev tools for network requests
- Database: Use SQLite browser for local development

## Production Deployment

### Backend
- Use Gunicorn or Uvicorn with multiple workers
- Set up PostgreSQL database
- Configure environment variables
- Add SSL/TLS certificates

### Frontend
- Build with `npm run build`
- Deploy to static hosting (Vercel, Netlify, etc.)
- Configure API endpoint URLs
- Set up CDN for assets

## Next Steps

1. **Add more AI services**: Integrate additional providers
2. **File uploads**: Allow document/image uploads
3. **Export features**: Download notes as PDF, PPT as PowerPoint
4. **Collaboration**: Multi-user study sessions
5. **Analytics**: Track learning progress
6. **Mobile app**: React Native implementation
