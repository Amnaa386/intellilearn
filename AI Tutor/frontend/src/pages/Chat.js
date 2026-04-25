import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  SunIcon,
  MoonIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  PresentationChartBarIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useChat } from '../contexts/ChatContext';
import { useDevMode } from '../contexts/DevModeContext';
import { AUTH_ENABLED, DEV_MODE } from '../config/auth';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import LoginPrompt from '../components/LoginPrompt';
import TypingIndicator from '../components/TypingIndicator';
import PPTGenerator from '../components/PPTGenerator';

const Chat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showPPTGenerator, setShowPPTGenerator] = useState(false);
  const [pptTopic, setPptTopic] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  const { user, logout, isAuthenticated } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { authBypassed } = useDevMode();
  const { 
    sessions, 
    currentSession, 
    messages, 
    loading, 
    fetchSessions, 
    sendMessage,
    setCurrentSession,
    setShowLoginPrompt: setChatLoginPrompt
  } = useChat();

  useEffect(() => {
    // Allow access if authentication is disabled OR user is authenticated OR in development mode
    const canAccessChat = !AUTH_ENABLED || isAuthenticated || authBypassed || DEV_MODE.bypassAuth;
    
    if (!canAccessChat) {
      setShowLoginPrompt(true);
    } else {
      setShowLoginPrompt(false);
      // Only fetch sessions if authentication is enabled and user is authenticated
      if (AUTH_ENABLED && isAuthenticated) {
        fetchSessions();
      }
    }
  }, [isAuthenticated, fetchSessions]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message) => {
    // Allow sending messages if authentication is disabled OR user is authenticated OR in development mode
    const canSendMessage = !AUTH_ENABLED || isAuthenticated || authBypassed || DEV_MODE.bypassAuth;
    
    if (!canSendMessage) {
      setShowLoginPrompt(true);
      return;
    }

    await sendMessage(message);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGeneratePPT = (topic = null) => {
    setPptTopic(topic || '');
    setShowPPTGenerator(true);
  };

  const handleClosePPTGenerator = () => {
    setShowPPTGenerator(false);
    setPptTopic('');
  };

  const getIntentIcon = (intentType) => {
    switch (intentType) {
      case 'explanation':
        return <SparklesIcon className="h-4 w-4" />;
      case 'notes':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'quiz':
        return <QuestionMarkCircleIcon className="h-4 w-4" />;
      case 'ppt':
        return <PresentationChartBarIcon className="h-4 w-4" />;
      default:
        return <BookOpenIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 768) && (
          <Sidebar
            sessions={sessions}
            currentSession={currentSession}
            onSelectSession={setCurrentSession}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {sidebarOpen ? (
                  <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Bars3Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              <div className="flex items-center space-x-2">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-500" />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  AI Learning Assistant
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* User info */}
              {isAuthenticated && user && (
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user.username}
                  </span>
                </div>
              )}

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {darkMode ? (
                  <SunIcon className="h-5 w-5 text-yellow-500" />
                ) : (
                  <MoonIcon className="h-5 w-5 text-gray-600" />
                )}
              </button>

              {/* Logout */}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                  >
                    <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Welcome to AI Learning Platform
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      Start a conversation by asking a question, requesting notes, or generating a quiz. 
                      I'll help you learn any topic!
                    </p>
                    
                    {/* Example prompts */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {[
                        { text: "Explain photosynthesis", icon: "explanation" },
                        { text: "Create notes on World War II", icon: "notes" },
                        { text: "Generate a math quiz", icon: "quiz" },
                        { text: "Make a presentation on climate change", icon: "ppt" }
                      ].map((prompt, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * index, duration: 0.3 }}
                          onClick={() => handleSendMessage(prompt.text)}
                          className="flex items-center space-x-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                        >
                          <span className="text-blue-500">
                            {getIntentIcon(prompt.icon)}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {prompt.text}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              ) : (
                <MessageList messages={messages} onGeneratePPT={handleGeneratePPT} />
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {loading && <TypingIndicator />}

            {/* Message Input */}
            <MessageInput onSendMessage={handleSendMessage} disabled={loading} />
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <LoginPrompt onClose={() => setShowLoginPrompt(false)} />
        )}
      </AnimatePresence>

      {/* PPT Generator Modal */}
      {showPPTGenerator && (
        <PPTGenerator 
          topic={pptTopic}
          onClose={handleClosePPTGenerator}
        />
      )}
    </div>
  );
};

export default Chat;
