# IntelliLearn Backend API

A production-ready backend API for the IntelliLearn AI-powered learning platform.

## Features

- **Authentication System**: JWT-based auth with role-based access control
- **AI Tutor Chat**: Real-time chat with OpenAI integration
- **Notes Generation**: AI-powered study notes generation
- **Quiz System**: Dynamic quiz creation with AI scoring
- **Analytics**: Comprehensive user and admin analytics
- **Admin Panel**: Complete admin management system
- **File Upload**: Image, audio, and document processing
- **Rate Limiting**: Intelligent rate limiting with Redis
- **Error Handling**: Comprehensive error handling and logging

## Tech Stack

- **Framework**: FastAPI (Python)
- **Database**: MongoDB with Motor (async)
- **Cache**: Redis
- **AI**: OpenAI API (GPT-4)
- **Authentication**: JWT tokens
- **File Storage**: Local filesystem (configurable)
- **Validation**: Pydantic models

## Project Structure

```
intellilearn-backend/
├── app/
│   ├── core/                 # Core configuration and utilities
│   │   ├── config.py        # Application settings
│   │   ├── database.py      # MongoDB connection
│   │   ├── redis.py         # Redis connection
│   │   └── security.py      # JWT and security utilities
│   ├── models/              # Pydantic data models
│   │   ├── user.py          # User models
│   │   ├── chat.py          # Chat models
│   │   ├── notes.py         # Notes models
│   │   ├── quiz.py          # Quiz models
│   │   ├── analytics.py     # Analytics models
│   │   └── upload.py        # File upload models
│   ├── services/            # Business logic services
│   │   ├── auth_service.py  # Authentication service
│   │   ├── ai_service.py    # AI integration service
│   │   ├── chat_service.py  # Chat service
│   │   ├── notes_service.py # Notes service
│   │   ├── quiz_service.py  # Quiz service
│   │   ├── analytics_service.py # Analytics service
│   │   └── upload_service.py # File upload service
│   ├── routers/             # API route handlers
│   │   ├── auth.py          # Authentication routes
│   │   ├── user.py          # User management routes
│   │   ├── chat.py          # Chat routes
│   │   ├── notes.py         # Notes routes
│   │   ├── quiz.py          # Quiz routes
│   │   ├── analytics.py     # Analytics routes
│   │   ├── admin.py         # Admin routes
│   │   └── upload.py        # File upload routes
│   └── middleware/          # Custom middleware
│       ├── rate_limiter.py  # Rate limiting middleware
│       └── error_handler.py # Error handling middleware
├── uploads/                 # File upload directory
│   ├── images/
│   ├── audio/
│   └── documents/
├── main.py                  # Application entry point
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Installation

### Prerequisites

- Python 3.8+
- MongoDB
- Redis (optional but recommended)
- OpenAI API key

### Setup

1. **Clone and navigate to the project**
   ```bash
   cd intellilearn-backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Unix/MacOS
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/intellilearn
   REDIS_URL=redis://localhost:6379
   
   # JWT
   SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   # OpenAI
   OPENAI_API_KEY=your-openai-api-key-here
   
   # Application
   DEBUG=True
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

5. **Start MongoDB and Redis**
   ```bash
   # MongoDB
   mongod
   
   # Redis (optional)
   redis-server
   ```

## Running the Application

### Development Mode

```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once running, visit:
- **Swagger UI**: `http://localhost:8000/api/docs`
- **ReDoc**: `http://localhost:8000/api/redoc`

## Key API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Token verification
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Password reset

### Chat System
- `POST /api/chat/ask-ai` - Send message to AI tutor
- `GET /api/chat/sessions` - Get chat sessions
- `GET /api/chat/sessions/{id}` - Get session with messages
- `POST /api/chat/explain-ppt` - Explain PowerPoint slide

### Notes Generation
- `POST /api/notes/generate` - Generate AI notes
- `GET /api/notes/` - Get user notes
- `POST /api/notes/{id}/bookmark` - Toggle bookmark

### Quiz System
- `POST /api/quiz/generate` - Generate quiz
- `POST /api/quiz/{id}/submit` - Submit quiz answers
- `POST /api/quiz/{id}/evaluate-written` - Evaluate written answer

### Analytics
- `GET /api/analytics/user/overview` - User analytics
- `GET /api/analytics/admin/overview` - Admin analytics

### Admin Panel
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `DELETE /api/admin/users/{id}` - Delete user

### File Upload
- `POST /api/upload/image` - Upload image
- `POST /api/upload/audio` - Upload audio
- `POST /api/upload/presentation` - Upload PowerPoint

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

The API implements rate limiting:
- Global: 100 requests per minute per IP
- Auth endpoints: 5-10 requests per minute
- AI endpoints: 10-30 requests per minute
- File uploads: 3-10 requests per minute

## Error Handling

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "status_code": 400,
  "path": "/api/endpoint"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/intellilearn` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `SECRET_KEY` | JWT secret key | Required |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `DEBUG` | Debug mode | `True` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:5173` |

## Database Schema

### Users Collection
```javascript
{
  _id: string,
  name: string,
  email: string,
  password_hash: string,
  role: "student" | "admin",
  status: "active" | "inactive" | "pending",
  createdAt: Date,
  lastActive: Date,
  profile: Object
}
```

### Chat Sessions Collection
```javascript
{
  _id: string,
  userId: string,
  sessionId: string,
  title: string,
  messageCount: number,
  preview: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Notes Collection
```javascript
{
  _id: string,
  userId: string,
  title: string,
  content: string,
  category: string,
  type: "simple" | "detailed",
  tags: Array<string>,
  topic: string,
  bookmarked: boolean,
  generatedAt: Date
}
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- CORS protection
- Error message sanitization
- SQL injection prevention (NoSQL injection protection)

## Monitoring and Logging

- Structured logging with Python logging
- Request/response logging
- Error tracking
- Performance monitoring
- Activity logging

## Deployment

### Docker (Recommended)

Create a `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production

Set these in your production environment:
- `DEBUG=False`
- `SECRET_KEY` (strong, randomly generated)
- `MONGODB_URI` (production database)
- `REDIS_URL` (production Redis)
- `ALLOWED_ORIGINS` (your frontend domain)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on the GitHub repository.
