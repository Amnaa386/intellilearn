# AI-Powered Student Learning Platform

A comprehensive educational platform similar to ChatGPT with intelligent AI integrations for student learning.

## Features

- **Authentication System**: User login/signup with smooth animated prompts
- **AI-Powered Chat**: Multi-API integration (Groq, Gemini, DeepSeek)
- **Intelligent Intent Detection**: Automatically determines user needs
- **Structured Content Generation**: Notes, quizzes, PPTs, explanations
- **Modern UI**: Responsive design with dark/light mode
- **Smooth Animations**: Message fade-in, typing indicators, hover effects

## Tech Stack

### Backend
- FastAPI (Python)
- JWT Authentication
- Multiple AI API integrations
- PostgreSQL database

### Frontend
- React.js
- Tailwind CSS
- Axios for API calls
- Context API for state management

## Project Structure

```
AI Tutor/
|-- backend/
|   |-- app/
|   |   |-- __init__.py
|   |   |-- main.py
|   |   |-- auth.py
|   |   |-- ai_services.py
|   |   |-- models.py
|   |   |-- database.py
|   |   |-- schemas.py
|   |   |-- intent_detection.py
|   |   |-- content_generator.py
|   |-- requirements.txt
|   |-- .env
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- hooks/
|   |   |-- contexts/
|   |   |-- utils/
|   |   |-- App.js
|   |-- package.json
|   |-- tailwind.config.js
|-- README.md
```

## Getting Started

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Environment Variables

Create `.env` file in backend directory:
```
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
DATABASE_URL=postgresql://user:password@localhost/dbname
JWT_SECRET=your_jwt_secret
```
