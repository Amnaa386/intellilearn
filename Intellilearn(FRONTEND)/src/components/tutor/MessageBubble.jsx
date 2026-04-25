'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Cpu } from 'lucide-react';
import StructuredLessonMessage from './StructuredLessonMessage';
import { cn } from '@/lib/utils';

function formatMsgTime(ts) {
  try {
    const d = ts instanceof Date ? ts : new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function MessageBubble({ message }) {
  const isUser = message.type === 'user';
  const hasPack = Boolean(message.learningPack);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex gap-3',
          isUser ? 'max-w-xs flex-row-reverse md:max-w-md' : 'max-w-[min(100%,52rem)] flex-row',
        )}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-purple-600'
              : 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600'
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Cpu className="w-4 h-4 text-slate-300" />
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={cn(
            'rounded-lg',
            isUser
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white'
              : 'border border-slate-700/50 bg-slate-800/50 p-4 text-slate-100',
            hasPack && !isUser && 'p-4 sm:p-5',
          )}
        >
          {message.content ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
          ) : null}
          {hasPack ? (
            <div className={cn(message.content ? 'mt-4 border-t border-slate-600/50 pt-4' : '')}>
              <StructuredLessonMessage pack={message.learningPack} />
            </div>
          ) : null}
          <p className={`mt-2 text-xs ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>{formatMsgTime(message.timestamp)}</p>
        </div>
      </motion.div>
    </div>
  );
}
