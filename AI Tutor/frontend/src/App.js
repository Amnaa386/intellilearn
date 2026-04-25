import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatProvider } from './contexts/ChatContext';
import { DevModeProvider } from './contexts/DevModeContext';
import DevModeToggle from './components/DevModeToggle';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import './index.css';

function App() {
  return (
    <DevModeProvider>
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <DevModeToggle />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/" element={<Navigate to="/chat" replace />} />
                </Routes>
              </div>
            </Router>
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </DevModeProvider>
  );
}

export default App;
