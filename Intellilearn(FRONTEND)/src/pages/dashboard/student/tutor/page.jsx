'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import ChatInterface from '@/components/tutor/ChatInterface';
import AIRobot from '@/components/tutor/AIRobot';
import { createTutorSession, deleteTutorSession, getTutorSession, getTutorSessions } from '@/lib/tutorApi';

const ACTIVE_SESSION_KEY = 'intellilearn_active_chat_session_id';

export default function TutorPage() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [autoTitleNextMessage, setAutoTitleNextMessage] = useState(false);

  const sessionIdRef = useRef(
    (() => {
      try {
        const id = sessionStorage.getItem(ACTIVE_SESSION_KEY);
        return id || null;
      } catch {
        return null;
      }
    })(),
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem('intellilearn_detailed_settings');
      const parsed = raw ? JSON.parse(raw) : null;
      setIsDarkMode(parsed?.darkMode !== false);
    } catch {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      const currentId = sessionIdRef.current;
      if (!currentId) return;
      try {
        const session = await getTutorSession(currentId);
        const incomingMessages = session?.messages || session?.session?.messages || [];
        if (!incomingMessages.length) return;
        setMessages(
          incomingMessages.map((m) => ({
            id: m.id,
            type: m.type === 'assistant' ? 'bot' : m.type,
            content: m.content,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          })),
        );
      } catch {
        sessionIdRef.current = null;
        try {
          sessionStorage.removeItem(ACTIVE_SESSION_KEY);
        } catch {
          // ignore storage failures
        }
      }
    };
    loadSession();
  }, []);

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const data = await getTutorSessions(1, 30);
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (!sessionIdRef.current || messages.length === 0) return;
    loadSessions();
  }, [messages]);

  const handleCreateNewChat = async () => {
    try {
      const created = await createTutorSession('New Chat');
      const newId = created?.id || created?.sessionId;
      if (newId) {
        sessionIdRef.current = newId;
        sessionStorage.setItem(ACTIVE_SESSION_KEY, newId);
      }
      setMessages([]);
      setAutoTitleNextMessage(true);
      await loadSessions();
    } catch {
      // ignore; UX remains usable
    }
  };

  const handleSelectSession = async (id) => {
    if (!id) return;
    try {
      sessionIdRef.current = id;
      sessionStorage.setItem(ACTIVE_SESSION_KEY, id);
      const data = await getTutorSession(id);
      const incomingMessages = data?.messages || data?.session?.messages || [];
      setMessages(
        incomingMessages.map((m) => ({
          id: m.id,
          type: m.type === 'assistant' ? 'bot' : m.type,
          content: m.content,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        })),
      );
      setAutoTitleNextMessage(false);
    } catch {
      setMessages([]);
    }
  };

  const handleDeleteSession = async (id) => {
    if (!id) return;
    try {
      await deleteTutorSession(id);
      if (sessionIdRef.current === id) {
        sessionIdRef.current = null;
        sessionStorage.removeItem(ACTIVE_SESSION_KEY);
        setMessages([]);
      }
      await loadSessions();
    } catch {
      // ignore delete failure for now
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-100px)]">
      {/* Chat Interface */}
      <div className="flex-1 flex flex-col">
        <ChatInterface
          messages={messages}
          setMessages={setMessages}
          isDarkMode={isDarkMode}
          sessionIdRef={sessionIdRef}
          autoTitleNextMessage={autoTitleNextMessage}
          onAutoTitleConsumed={() => {
            setAutoTitleNextMessage(false);
            loadSessions();
          }}
        />
      </div>

      {/* AI Robot Sidebar */}
      <div className="hidden lg:flex flex-col w-72 gap-3">
        <AIRobot compact isDarkMode={isDarkMode} />
        <div className={`flex-1 rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              onClick={handleCreateNewChat}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
          <div className="h-[320px] overflow-y-auto p-3 space-y-2">
            {sessionsLoading ? (
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No chat sessions yet.</p>
            ) : (
              sessions.map((s) => {
                const sid = s.id || s.sessionId;
                const active = sid && sid === sessionIdRef.current;
                return (
                  <motion.div
                    key={sid}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`group rounded-lg border p-3 cursor-pointer transition ${active ? (isDarkMode ? 'border-blue-500/50 bg-blue-500/10' : 'border-blue-300 bg-blue-50') : (isDarkMode ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700' : 'border-slate-200 bg-white hover:border-slate-300')}`}
                    onClick={() => handleSelectSession(sid)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                          {s.title || 'Chat Session'}
                        </p>
                        <p className={`mt-1 text-[11px] line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {s.preview || 'No preview available'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(sid);
                        }}
                        className={`rounded p-1 opacity-0 group-hover:opacity-100 transition ${isDarkMode ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-500 hover:text-red-500 hover:bg-red-50'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
