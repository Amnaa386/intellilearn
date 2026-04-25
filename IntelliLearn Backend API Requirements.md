# IntelliLearn Backend API Requirements

Based on analysis of the frontend codebase, here are the APIs needed to support the IntelliLearn application.

## Overview

IntelliLearn is an AI-powered learning platform with the following main features:
- User authentication and role management (Student/Admin)
- AI Tutor chat functionality
- Quiz generation from chat sessions
- AI-powered notes generation
- Admin dashboard for system management
- Analytics and progress tracking

## 1. Authentication & User Management APIs

### 1.1 Authentication Endpoints

#### POST /api/auth/register
**Purpose**: Register a new user account
**Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "student" // Default role
}
```
**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  },
  "token": "jwt_token"
}
```

#### POST /api/auth/login
**Purpose**: Authenticate user and return token
**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  },
  "token": "jwt_token"
}
```

#### POST /api/auth/forgot-password
**Purpose**: Initiate password reset process
**Request Body**:
```json
{
  "email": "string"
}
```

#### POST /api/auth/reset-password
**Purpose**: Reset password with token
**Request Body**:
```json
{
  "token": "string",
  "newPassword": "string"
}
```

#### GET /api/auth/verify
**Purpose**: Verify JWT token and return user info
**Headers**: `Authorization: Bearer <token>`
**Response**:
```json
{
  "success": true,
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  }
}
```

### 1.2 User Management (Admin Only)

#### GET /api/users
**Purpose**: Get all users (paginated)
**Query Params**: `page`, `limit`, `search`, `role`
**Response**:
```json
{
  "success": true,
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "status": "Active|Inactive|Pending",
      "joined": "date",
      "lastActive": "date"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

#### POST /api/users
**Purpose**: Create new user (admin)
**Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "role": "Student|Teacher|Admin",
  "status": "Active|Inactive|Pending"
}
```

#### DELETE /api/users/:id
**Purpose**: Delete user
**Params**: `id` - User ID

#### PUT /api/users/:id/status
**Purpose**: Update user status
**Request Body**:
```json
{
  "status": "Active|Inactive|Pending"
}
```

## 2. AI Tutor & Chat APIs

### 2.1 Chat Session Management

#### GET /api/chat/sessions
**Purpose**: Get user's chat sessions
**Response**:
```json
{
  "success": true,
  "sessions": [
    {
      "id": "string",
      "preview": "string",
      "messageCount": "number",
      "updatedAt": "timestamp",
      "createdAt": "timestamp"
    }
  ]
}
```

#### POST /api/chat/sessions
**Purpose**: Create new chat session
**Response**:
```json
{
  "success": true,
  "sessionId": "string"
}
```

#### GET /api/chat/sessions/:id/messages
**Purpose**: Get messages from a specific session
**Response**:
```json
{
  "success": true,
  "messages": [
    {
      "id": "string",
      "type": "user|bot",
      "content": "string",
      "timestamp": "timestamp"
    }
  ]
}
```

#### POST /api/chat/sessions/:id/messages
**Purpose**: Send a message to AI tutor
**Request Body**:
```json
{
  "message": "string",
  "type": "user"
}
```
**Response**:
```json
{
  "success": true,
  "message": {
    "id": "string",
    "type": "bot",
    "content": "string",
    "timestamp": "timestamp"
  }
}
```

### 2.2 AI Tutor Features

#### POST /api/tutor/explain
**Purpose**: Get AI explanation for a topic
**Request Body**:
```json
{
  "topic": "string",
  "level": "basic|intermediate|advanced",
  "format": "simple|detailed|exam"
}
```

#### POST /api/tutor/ppt-explain
**Purpose**: Explain PowerPoint slide content
**Request Body**:
```json
{
  "slideContent": "string",
  "slideNumber": "number",
  "context": "string"
}
```

#### POST /api/tutor/voice-lesson
**Purpose**: Generate voice lesson content
**Request Body**:
```json
{
  "topic": "string",
  "duration": "number", // in minutes
  "style": "explanation|story|conversation"
}
```

## 3. Quiz Generation & Management APIs

### 3.1 Quiz Generation

#### POST /api/quiz/generate
**Purpose**: Generate quiz from topic or chat session
**Request Body**:
```json
{
  "source": "topic|chat",
  "topic": "string", // if source is topic
  "sessionId": "string", // if source is chat
  "questionCount": "number",
  "difficulty": "easy|medium|hard",
  "types": ["mcq", "written", "true_false"]
}
```

#### POST /api/quiz/generate/from-chat
**Purpose**: Generate quiz from chat session (specialized)
**Request Body**:
```json
{
  "sessionId": "string",
  "mode": "mcq|written"
}
```

### 3.2 Quiz Management

#### GET /api/quiz
**Purpose**: Get user's quizzes
**Query Params**: `page`, `limit`, `status`

#### GET /api/quiz/:id
**Purpose**: Get specific quiz details
**Response**:
```json
{
  "success": true,
  "quiz": {
    "id": "string",
    "title": "string",
    "questions": [
      {
        "id": "string",
        "type": "mcq|written",
        "question": "string",
        "options": ["string"], // for MCQ
        "correct": "number", // for MCQ
        "minLength": "number", // for written
        "hintPool": ["string"] // for written
      }
    ],
    "createdAt": "timestamp"
  }
}
```

#### POST /api/quiz/:id/submit
**Purpose**: Submit quiz answers
**Request Body**:
```json
{
  "answers": {
    "questionId": "answer"
  },
  "writtenAnswers": {
    "questionId": {
      "text": "string",
      "hintsUsed": "number"
    }
  }
}
```

#### POST /api/quiz/:id/evaluate-written
**Purpose**: Evaluate written answer
**Request Body**:
```json
{
  "questionId": "string",
  "answer": "string"
}
```

#### POST /api/quiz/:id/hint
**Purpose**: Get hint for written question
**Request Body**:
```json
{
  "questionId": "string",
  "hintsUsed": "number"
}
```

## 4. Notes Generation APIs

### 4.1 Notes Generation

#### POST /api/notes/generate
**Purpose**: Generate AI notes for a topic
**Request Body**:
```json
{
  "topic": "string",
  "complexity": "simple|detailed",
  "includeQuestions": "boolean",
  "category": "science|mathematics|history|literature|technology|business|general"
}
```

**Response**:
```json
{
  "success": true,
  "notes": {
    "id": "string",
    "title": "string",
    "content": "string",
    "category": "string",
    "type": "simple|detailed",
    "tags": ["string"],
    "generatedAt": "timestamp"
  }
}
```

### 4.2 Notes Management

#### GET /api/notes
**Purpose**: Get user's notes
**Query Params**: `page`, `limit`, `category`, `search`

#### GET /api/notes/:id
**Purpose**: Get specific note

#### DELETE /api/notes/:id
**Purpose**: Delete note

#### POST /api/notes/:id/bookmark
**Purpose**: Bookmark/unbookmark note

#### GET /api/notes/bookmarked
**Purpose**: Get bookmarked notes

## 5. Analytics & Progress Tracking APIs

### 5.1 User Analytics

#### GET /api/analytics/user/overview
**Purpose**: Get user's learning analytics
**Response**:
```json
{
  "success": true,
  "stats": {
    "topicsCompleted": "number",
    "quizzesAttempted": "number",
    "performance": "percentage",
    "studyStreak": "number",
    "globalRank": "number"
  },
  "recentActivity": [
    {
      "type": "quiz_completed|notes_generated|chat_session",
      "description": "string",
      "timestamp": "timestamp"
    }
  ]
}
```

#### GET /api/analytics/user/progress
**Purpose**: Get detailed progress data
**Query Params**: `timeframe` (week|month|year)

#### GET /api/analytics/user/performance
**Purpose**: Get performance metrics
**Response**:
```json
{
  "success": true,
  "performance": {
    "quizScores": [
      {
        "quizId": "string",
        "score": "number",
        "timestamp": "timestamp"
      }
    ],
    "trends": {
      "improvement": "percentage",
      "strongAreas": ["string"],
      "weakAreas": ["string"]
    }
  }
}
```

### 5.2 Admin Analytics

#### GET /api/analytics/admin/overview
**Purpose**: Get system-wide analytics (admin only)
**Response**:
```json
{
  "success": true,
  "summary": {
    "totalUsers": "number",
    "activeUsers": "number",
    "aiRequests": "number",
    "quizzesGenerated": "number",
    "notesCreated": "number"
  },
  "growth": {
    "users": "percentage",
    "requests": "percentage",
    "engagement": "percentage"
  }
}
```

#### GET /api/analytics/admin/usage
**Purpose**: Get feature usage statistics
**Response**:
```json
{
  "success": true,
  "featureUsage": [
    {
      "feature": "AI Chat|PPT Explain|Quiz Gen|Notes",
      "usage": "percentage",
      "count": "number"
    }
  ],
  "dailyTraffic": [
    {
      "day": "Mon|Tue|Wed|Thu|Fri|Sat|Sun",
      "requests": "number"
    }
  ]
}
```

#### GET /api/analytics/admin/activity-logs
**Purpose**: Get system activity logs
**Query Params**: `page`, `limit`, `userId`, `action`

## 6. System Settings & Configuration APIs (Admin Only)

### 6.1 System Settings

#### GET /api/admin/settings
**Purpose**: Get system settings
**Response**:
```json
{
  "success": true,
  "settings": [
    {
      "id": "string",
      "label": "string",
      "enabled": "boolean",
      "category": "features|security|ui"
    }
  ]
}
```

#### PUT /api/admin/settings/:id
**Purpose**: Update system setting
**Request Body**:
```json
{
  "enabled": "boolean"
}
```

### 6.2 Content Management

#### GET /api/admin/content/common-queries
**Purpose**: Get common user queries
**Response**:
```json
{
  "success": true,
  "queries": ["string"]
}
```

#### GET /api/admin/content/system-insights
**Purpose**: Get system insights
**Response**:
```json
{
  "success": true,
  "insights": {
    "mostRequestedTopic": "string",
    "commonQueryStyle": "string",
    "fastestGrowingFeature": "string",
    "usagePatterns": {
      "peakHours": "string",
      "dailyActiveRatio": "percentage",
      "averagePromptsPerUser": "number",
      "retentionRate": "percentage"
    }
  }
}
```

## 7. File Upload & Media APIs

### 7.1 File Management

#### POST /api/upload/image
**Purpose**: Upload image for analysis
**Request**: `multipart/form-data`
**Response**:
```json
{
  "success": true,
  "fileUrl": "string",
  "fileId": "string"
}
```

#### POST /api/upload/audio
**Purpose**: Upload audio for voice lessons
**Request**: `multipart/form-data`
**Response**:
```json
{
  "success": true,
  "fileUrl": "string",
  "transcript": "string"
}
```

#### POST /api/upload/presentation
**Purpose**: Upload PowerPoint for explanation
**Request**: `multipart/form-data`
**Response**:
```json
{
  "success": true,
  "presentationId": "string",
  "slides": [
    {
      "slideNumber": "number",
      "content": "string",
      "imageUrl": "string"
    }
  ]
}
```

## 8. Real-time Features

### 8.1 WebSocket Events

#### Connection: /ws/chat
**Purpose**: Real-time chat with AI tutor
**Events**:
- `message_sent`: User sends message
- `message_received`: AI responds
- `typing_start`: User starts typing
- `typing_stop`: User stops typing

#### Connection: /ws/notifications
**Purpose**: Real-time notifications
**Events**:
- `quiz_completed`: Quiz finished
- `notes_ready`: Notes generated
- `system_update`: System announcements

## 9. Error Handling & Response Format

### Standard Response Format
```json
{
  "success": "boolean",
  "message": "string",
  "data": "object|array",
  "errors": ["string"] // if success is false
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## 10. Rate Limiting & Security

### Rate Limits
- Authentication: 5 requests per minute
- AI Tutor: 30 requests per minute per user
- Quiz Generation: 10 requests per hour per user
- Notes Generation: 20 requests per hour per user
- File Upload: 5 requests per minute per user

### Security Headers
- `Authorization: Bearer <jwt_token>` for protected routes
- `X-API-Key` for admin endpoints
- CORS configuration for frontend domain
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 11. Database Schema Requirements

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (student|admin),
  status: String (active|inactive|pending),
  joined: Date,
  lastActive: Date,
  profile: {
    avatar: String,
    preferences: Object
  }
}
```

### Chat Sessions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  sessionId: String (unique),
  messages: [{
    id: String,
    type: String (user|bot),
    content: String,
    timestamp: Date
  }],
  preview: String,
  messageCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Quizzes Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  source: String (topic|chat),
  sourceId: String,
  questions: [{
    id: String,
    type: String (mcq|written),
    question: String,
    options: [String], // for MCQ
    correct: Number, // for MCQ
    minLength: Number, // for written
    hintPool: [String] // for written
  }],
  createdAt: Date,
  completedAt: Date,
  score: Number
}
```

### Notes Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  content: String,
  category: String,
  type: String (simple|detailed),
  tags: [String],
  topic: String,
  bookmarked: Boolean,
  generatedAt: Date
}
```

### Analytics Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: String (quiz|notes|chat),
  action: String,
  metadata: Object,
  timestamp: Date
}
```

## 12. AI Integration Requirements

### External AI Services
- OpenAI GPT-4 for chat and content generation
- Speech-to-text for voice lessons
- Text-to-speech for audio generation
- Image analysis for uploaded images

### AI Prompt Templates
- Chat tutor prompts with context awareness
- Quiz generation prompts with difficulty levels
- Notes generation prompts with categorization
- Content explanation prompts with simplification

## 13. Performance & Caching

### Caching Strategy
- Redis for session management
- Cache frequent AI responses
- Cache user analytics data
- Cache system settings

### Performance Optimization
- Database indexing on frequently queried fields
- Pagination for large datasets
- Lazy loading for chat messages
- Compression for API responses

## Implementation Priority

### Phase 1 (Core Features)
1. Authentication & User Management
2. Basic AI Chat functionality
3. Simple Quiz Generation
4. Basic Notes Generation

### Phase 2 (Enhanced Features)
1. Advanced Quiz features (written answers, hints)
2. Detailed Notes generation
3. User Analytics
4. File Upload capabilities

### Phase 3 (Admin & Advanced)
1. Admin Dashboard APIs
2. System Analytics
3. Real-time features
4. Advanced AI integrations

This API specification covers all the backend endpoints needed to support your IntelliLearn frontend application. The APIs are designed to be RESTful, secure, and scalable with proper error handling and documentation.
