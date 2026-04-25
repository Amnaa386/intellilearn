'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Mic } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { analyzeLearningRequest, generateLearningPack } from '@/lib/tutorLearningPack';

export default function ChatInterface({ messages, setMessages }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

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

    const intent = analyzeLearningRequest(input);
    const pack = generateLearningPack(input, intent);

    window.setTimeout(() => {
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `Structured module for **${intent.topicDisplay}**. Counts follow your wording (e.g. more MCQs, exam prep, notes only). Refine your next message to expand any section.`,
        learningPack: pack,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <h1 className="text-2xl font-bold text-slate-100">Intelli AI Tutor</h1>
        <p className="text-sm text-slate-400 mt-1">
          Enter a topic or exam brief — you&apos;ll get animated notes, MCQs, and questions. Try &quot;8 MCQs on…&quot; or
          &quot;notes only&quot; to steer the layout.
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {messages.map((message, idx) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <MessageBubble message={message} />
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-xs p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
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
      <div className="p-6 border-t border-slate-700/50 bg-gradient-to-t from-slate-900/50 to-transparent">
        <form onSubmit={handleSendMessage} className="space-y-3">
          {/* Toolbar */}
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              className="border-slate-600 text-slate-400 hover:bg-slate-800/50"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="border-slate-600 text-slate-400 hover:bg-slate-800/50"
            >
              <Mic className="w-4 h-4" />
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
              className="bg-slate-800/50 border-slate-700/50 text-slate-100 placeholder:text-slate-500"
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
              className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-2 text-left text-xs text-slate-300 transition-colors hover:border-blue-500/50"
            >
              {chip.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
