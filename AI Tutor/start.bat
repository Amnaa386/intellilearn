@echo off
echo Starting AI Learning Platform...
echo.

echo Starting Backend...
cd backend
start "Backend" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo Starting Frontend...
cd ../frontend
start "Frontend" cmd /k "npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause
