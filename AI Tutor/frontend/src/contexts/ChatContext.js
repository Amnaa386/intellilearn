import React, { createContext, useState, useContext } from 'react';
import api from './api';
import { useAuth } from './AuthContext';
import { useDevMode } from './DevModeContext';
import { useDevApi } from '../utils/devApi';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { authBypassed } = useDevMode();
  const devApi = useDevApi();

  const fetchSessions = async () => {
    try {
      const sessions = await api.getChatSessions();
      setSessions(sessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const createSession = async (title) => {
    try {
      const newSession = await api.createChatSession(title);
      setSessions([newSession, ...sessions]);
      setCurrentSession(newSession);
      setMessages([]);
      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  };

  const fetchSession = async (sessionId) => {
    try {
      const session = await api.getChatSession(sessionId);
      setCurrentSession(session);
      setMessages(session.messages || []);
      return session;
    } catch (error) {
      console.error('Failed to fetch session:', error);
      return null;
    }
  };

  const sendMessage = async (message, sessionId = null) => {
    console.log('=== sendMessage Debug Start ===');
    console.log('Message:', message);
    console.log('Session ID:', sessionId);
    console.log('Current Session:', currentSession);
    console.log('Auth Bypassed:', authBypassed);
    console.log('Current Messages:', messages.length);
    
    if (!sessionId && !currentSession) {
      // Create new session with first message
      console.log('Creating new session...');
      const newSession = await createSession(message.substring(0, 50));
      console.log('New Session Created:', newSession);
      if (!newSession) {
        console.error('Failed to create new session');
        return null;
      }
      sessionId = newSession.id;
    } else if (!sessionId) {
      sessionId = currentSession.id;
    }

    console.log('Final Session ID:', sessionId);
    setLoading(true);
    
    // Add user message immediately for better UX
    const userMessage = {
      id: Date.now(),
      content: message,
      message_type: 'user',
      created_at: new Date().toISOString(),
    };

    console.log('Adding user message:', userMessage);
    setMessages(prev => {
      console.log('Previous messages count:', prev.length);
      return [...prev, userMessage];
    });

    try {
      let response;
      
      // Use dev API if auth is bypassed, otherwise use normal API
      if (authBypassed) {
        console.log('Using dev API (auth bypassed)');
        const messageHistory = messages.map(msg => ({
          role: msg.message_type === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.created_at
        }));
        console.log('Message History:', messageHistory);
        
        response = await devApi.sendMessage(
          messageHistory,
          message,
          null, // context
          sessionId
        );
      } else {
        console.log('Using normal API (auth required)');
        response = await api.sendMessage(message, { session_id: sessionId });
      }

      console.log('API Response:', response);
      console.log('Response Type:', typeof response);
      console.log('Response Keys:', response ? Object.keys(response) : 'null/undefined');

      // Handle different response formats
      let aiResponse, intent_type, structured_content;
      
      if (response && response.provider_used) {
        // Dev API response
        console.log('Processing Dev API response...');
        aiResponse = response.content;
        intent_type = response.content_type;
        structured_content = response.structured_data;
        console.log('Dev API Parsed:', { aiResponse, intent_type, structured_content });
      } else if (response) {
        // Normal API response
        console.log('Processing Normal API response...');
        aiResponse = response.response;
        intent_type = response.intent_type;
        structured_content = response.structured_content;
        console.log('Normal API Parsed:', { aiResponse, intent_type, structured_content });
      } else {
        console.error('Response is null or undefined');
        throw new Error('No response received from API');
      }

      if (!aiResponse) {
        console.error('AI response is empty or undefined');
        throw new Error('Empty AI response received');
      }

      // Add AI response
      const assistantMessage = {
        id: Date.now() + 1,
        content: aiResponse,
        message_type: 'assistant',
        created_at: new Date().toISOString(),
        intent_type,
        structured_content,
      };

      console.log('Adding assistant message:', assistantMessage);
      setMessages(prev => {
        console.log('Before adding assistant message - count:', prev.length);
        const newMessages = [...prev, assistantMessage];
        console.log('After adding assistant message - count:', newMessages.length);
        return newMessages;
      });

      // Update session in list (only for normal API)
      if (!authBypassed && currentSession && currentSession.id === sessionId) {
        setCurrentSession(prev => ({
          ...prev,
          updated_at: new Date().toISOString(),
          messages: [...prev.messages, userMessage, assistantMessage],
        }));
      }

      console.log('=== sendMessage Debug End (Success) ===');
      return response;
    } catch (error) {
      console.error('=== sendMessage Debug End (Error) ===');
      console.error('Failed to send message:', error);
      console.error('Error Stack:', error.stack);
      
      // Remove user message if request failed
      setMessages(prev => {
        console.log('Removing failed user message');
        return prev.filter(msg => msg.id !== userMessage.id);
      });
      
      return null;
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await api.deleteChatSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const generatePPT = async (topic, numSlides = 8) => {
    console.log('=== PPT Generation Start ===');
    console.log('Topic:', topic);
    console.log('Number of slides:', numSlides);
    
    try {
      const response = await api.generatePPT(topic, numSlides);
      console.log('PPT Generation Response:', response);
      
      if (response.success) {
        console.log('PPT generated successfully:', response.file_info);
        return response;
      } else {
        throw new Error(response.message || 'PPT generation failed');
      }
    } catch (error) {
      console.error('PPT Generation Error:', error);
      throw error;
    }
  };

  const downloadPPT = async (filename) => {
    console.log('=== PPT Download Start ===');
    console.log('Filename:', filename);
    
    try {
      const blob = await api.downloadPPT(filename);
      console.log('PPT downloaded successfully, blob size:', blob.size);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('PPT download completed');
    } catch (error) {
      console.error('PPT Download Error:', error);
      throw error;
    }
  };

  const value = {
    sessions,
    currentSession,
    messages,
    loading,
    showLoginPrompt,
    setShowLoginPrompt,
    fetchSessions,
    createSession,
    fetchSession,
    sendMessage,
    deleteSession,
    generatePPT,
    downloadPPT,
    setCurrentSession,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
