'use client';

import React, { useState, useEffect, useRef } from 'react';
import ChatInterface from '@/components/tutor/ChatInterface';
import AIRobot from '@/components/tutor/AIRobot';
import { upsertChatSession } from '@/lib/chatSessions';

const ACTIVE_SESSION_KEY = 'intellilearn_active_chat_session_id';

export default function TutorPage() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot',
      content:
        "Hello — I'm your Intelli AI Tutor. Type any topic or exam request. I'll reply with animated short notes, detailed sections, short questions, MCQs (options + correct answer marked), and long-form prompts — scaled to your wording (e.g. more MCQs, notes only).",
      timestamp: new Date(),
    },
  ]);

  const sessionIdRef = useRef(
    (() => {
      try {
        let id = sessionStorage.getItem(ACTIVE_SESSION_KEY);
        if (!id) {
          id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          sessionStorage.setItem(ACTIVE_SESSION_KEY, id);
        }
        return id;
      } catch {
        return `chat-${Date.now()}`;
      }
    })(),
  );

  useEffect(() => {
    if (messages.length < 2) return;
    const firstUser = messages.find((m) => m.type === 'user');
    const raw = firstUser?.content || '';
    const preview =
      raw.length > 160 ? `${raw.slice(0, 160).trim()}…` : raw.trim() || 'AI Tutor conversation';
    upsertChatSession({
      id: sessionIdRef.current,
      preview,
      messageCount: messages.length,
      updatedAt: Date.now(),
    });
  }, [messages]);

  return (
    <div className="flex gap-6 h-[calc(100vh-100px)]">
      {/* Chat Interface */}
      <div className="flex-1 flex flex-col">
        <ChatInterface messages={messages} setMessages={setMessages} />
      </div>

      {/* AI Robot Sidebar */}
      <div className="hidden lg:flex flex-col w-64">
        <AIRobot />
      </div>
    </div>
  );
}
