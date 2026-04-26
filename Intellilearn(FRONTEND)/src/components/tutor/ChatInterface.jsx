'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Mic, Sparkles, FileText, HelpCircle, Presentation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MessageBubble from './MessageBubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { askTutor, autoTitleTutorSession, updateTutorSessionTitle } from '@/lib/tutorApi';

export default function ChatInterface({ messages, setMessages, isDarkMode = true, sessionIdRef, autoTitleNextMessage = false, onAutoTitleConsumed = null }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [apiError, setApiError] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleGenerateNotesFromChat = async () => {
    if (messages.length < 2 || isGeneratingNotes) return;
    try {
      setApiError('');
      setIsGeneratingNotes(true);
      const convo = messages
        .filter((m) => m?.content)
        .slice(-8)
        .map((m) => {
          const text = (m.content || '').replace(/\s+/g, ' ').trim();
          const compact = text.length > 220 ? `${text.slice(0, 220)}...` : text;
          return `${m.type === 'user' ? 'Student' : 'Tutor'}: ${compact}`;
        })
        .join('\n\n');

      let prompt = `Create concise study notes from this tutor conversation.
Return clear markdown with headings:
- Topic
- Key concepts
- Important points
- Quick revision bullets
- 5 short practice questions

Conversation:
${convo}`;

      // Backend AIRequest.message max_length is 2000, keep a safe margin.
      const MAX_PROMPT_LEN = 1800;
      if (prompt.length > MAX_PROMPT_LEN) {
        prompt = `${prompt.slice(0, MAX_PROMPT_LEN)}...`;
      }

      const ai = await askTutor(prompt, sessionIdRef?.current || null);
      const notesContent = ai?.message || '';
      if (!notesContent.trim()) {
        throw new Error('Unable to generate notes from conversation.');
      }

      const firstUser = messages.find((m) => m.type === 'user')?.content || 'Tutor Conversation';
      const topic = firstUser.length > 80 ? `${firstUser.slice(0, 80).trim()}...` : firstUser;

      navigate('/dashboard/student/notes', {
        state: {
          generatedTopic: topic,
          fromChatSessionId: sessionIdRef?.current || null,
          generatedNotesContent: notesContent,
          type: 'detailed',
        },
      });
    } catch (err) {
      setApiError(err?.message || 'Failed to generate notes from chat.');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const outgoingText = input.trim();
    const hadExistingSession = Boolean(sessionIdRef?.current);

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setApiError('');

    try {
      const data = await askTutor(outgoingText, sessionIdRef?.current || null);
      if (data?.sessionId && sessionIdRef) {
        sessionIdRef.current = data.sessionId;
        try {
          sessionStorage.setItem('intellilearn_active_chat_session_id', data.sessionId);
        } catch {
          // no-op if storage unavailable
        }

        // ChatGPT-style behavior: first user message becomes session title.
        if (!hadExistingSession) {
          const title = outgoingText.length > 36 ? `${outgoingText.slice(0, 36).trim()}...` : outgoingText;
          try {
            await updateTutorSessionTitle(data.sessionId, title || 'New Chat');
          } catch {
            // Keep chat usable even if title update fails.
          }
        }

        if (!hadExistingSession || autoTitleNextMessage) {
          try {
            await autoTitleTutorSession(data.sessionId, outgoingText);
          } catch {
            // Non-critical: default title already exists.
          } finally {
            if (typeof onAutoTitleConsumed === 'function') onAutoTitleConsumed();
          }
        }
      }

      const botMessage = {
        id: data.messageId || (Date.now() + 1).toString(),
        type: 'bot',
        content: data.message || 'No response returned by AI.',
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setApiError(err?.message || 'Unable to reach AI backend');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full rounded-xl overflow-hidden border ${isDarkMode ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
      {/* Header */}
      <div className={`p-6 border-b ${isDarkMode ? 'border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Intelli AI Tutor</h1>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Enter a topic or exam brief — you&apos;ll get animated notes, MCQs, and questions. Try &quot;8 MCQs on…&quot; or
          &quot;notes only&quot; to steer the layout.
        </p>
        {apiError ? (
          <p className="mt-2 text-xs text-amber-500">{apiError}</p>
        ) : null}
      </div>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isDarkMode ? 'scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent' : ''}`}>
        {messages.length === 0 && !isLoading ? (
          <div className="h-full min-h-[320px] flex items-center justify-center">
            <div className="w-full max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center justify-center">
                <HelpCircle className={`w-14 h-14 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <h2 className={`text-4xl font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                Welcome to AI Learning Platform
              </h2>
              <p className={`mt-3 text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Start a conversation by asking a question, requesting notes, or generating a quiz. I&apos;ll help you learn any topic!
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Sparkles, label: 'Explain photosynthesis', text: 'Explain photosynthesis' },
                  { icon: FileText, label: 'Create notes on World War II', text: 'Create notes on World War II' },
                  { icon: HelpCircle, label: 'Generate a math quiz', text: 'Generate a math quiz' },
                  { icon: Presentation, label: 'Make a presentation on climate change', text: 'Make a presentation on climate change' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setInput(item.text)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-base transition ${isDarkMode ? 'border-slate-700 bg-slate-900/50 text-slate-200 hover:border-blue-500/50' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'}`}
                  >
                    <item.icon className="w-4 h-4 text-blue-400" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <AnimatePresence initial={false}>
          {messages.map((message, idx) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <MessageBubble message={message} isDarkMode={isDarkMode} />
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className={`max-w-xs p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex gap-2">
                  <motion.div
                    className="w-3 h-3 rounded-full bg-blue-500"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, delay: 0 }}
                  />
                  <motion.div
                    className="w-3 h-3 rounded-full bg-blue-500"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                  <motion.div
                    className="w-3 h-3 rounded-full bg-blue-500"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-6 border-t ${isDarkMode ? 'border-slate-700/50 bg-gradient-to-t from-slate-900/50 to-transparent' : 'border-slate-200 bg-white'}`}>
        <form onSubmit={handleSendMessage} className="space-y-3">
          {/* Toolbar */}
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              className={isDarkMode ? 'border-slate-600 text-slate-400 hover:bg-slate-800/50' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className={isDarkMode ? 'border-slate-600 text-slate-400 hover:bg-slate-800/50' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={messages.length < 2 || isGeneratingNotes}
              onClick={handleGenerateNotesFromChat}
              className={isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800/50' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}
            >
              <FileText className="w-4 h-4 mr-2" />
              {isGeneratingNotes ? 'Generating Notes...' : 'Generate Notes'}
            </Button>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g. Deep notes + 6 MCQs on photosynthesis…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className={isDarkMode ? 'bg-slate-800/50 border-slate-700/50 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Quick Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { label: 'Deep notes', text: 'Deep, thorough notes on ' },
            { label: '8 MCQs', text: '8 MCQs on ' },
            { label: 'Exam prep', text: 'Exam prep: short + long questions on ' },
            { label: 'Notes only', text: 'Notes only (no questions): ' },
            { label: 'MCQs only', text: 'MCQs only — 10 questions on ' },
            { label: 'Quick recap', text: 'Brief summary notes on ' },
          ].map((chip) => (
            <motion.button
              key={chip.label}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setInput((prev) => (prev.trim() ? `${chip.text}${prev.trim()}` : `${chip.text}`))}
              className={`rounded-lg border p-2 text-left text-xs transition-colors ${isDarkMode ? 'border-slate-700/50 bg-slate-800/50 text-slate-300 hover:border-blue-500/50' : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-blue-300'}`}
            >
              {chip.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
