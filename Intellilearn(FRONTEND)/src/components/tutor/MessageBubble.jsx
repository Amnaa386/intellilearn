'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

export default function MessageBubble({ message, isDarkMode = true }) {
  const isUser = message.type === 'user';
  const hasPack = Boolean(message.learningPack);
  const [userName, setUserName] = React.useState('');
  const [userAvatar, setUserAvatar] = React.useState('');

  const sanitizeAvatar = React.useCallback((avatar) => {
    if (typeof avatar !== 'string') return '';
    const trimmed = avatar.trim();
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return '';
    if (!trimmed.startsWith('http') && !trimmed.startsWith('data:image/')) return '';
    return trimmed;
  }, []);

  const getInitials = React.useCallback((name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, []);

  React.useEffect(() => {
    const hydrateUser = () => {
      try {
        const raw = localStorage.getItem('intellilearn_user');
        if (!raw) {
          setUserName('');
          setUserAvatar('');
          return;
        }
        const parsed = JSON.parse(raw);
        setUserName(parsed?.name || '');
        setUserAvatar(sanitizeAvatar(parsed?.profile?.avatar));
      } catch {
        setUserName('');
        setUserAvatar('');
      }
    };

    hydrateUser();
    window.addEventListener('intellilearn-user-updated', hydrateUser);
    return () => window.removeEventListener('intellilearn-user-updated', hydrateUser);
  }, [sanitizeAvatar]);

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
              : isDarkMode
                ? 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600'
                : 'bg-gradient-to-br from-slate-200 to-slate-100 border border-slate-300'
          }`}
        >
          {isUser ? userAvatar ? (
            <img
              src={userAvatar}
              alt={userName || 'User'}
              className="h-full w-full rounded-full object-cover"
              onError={() => setUserAvatar('')}
            />
          ) : (
            <span className="text-[10px] font-bold text-white">{getInitials(userName)}</span>
          ) : (
            <Cpu className={`w-4 h-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`} />
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={cn(
            'rounded-lg',
            isUser
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white'
              : isDarkMode
                ? 'border border-slate-700/50 bg-slate-800/50 p-4 text-slate-100'
                : 'border border-slate-300 bg-white p-4 text-slate-900',
            hasPack && !isUser && 'p-4 sm:p-5',
          )}
        >
          {message.content ? (
            isUser ? (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
            ) : (
              <div className="break-words text-sm leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
                    li: ({ children }) => <li>{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    code: ({ children }) => (
                      <code className={`rounded px-1.5 py-0.5 ${isDarkMode ? 'bg-slate-700/70 text-sky-200' : 'bg-slate-100 text-slate-800'}`}>
                        {children}
                      </code>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )
          ) : null}
          {hasPack ? (
            <div className={cn(message.content ? `mt-4 border-t ${isDarkMode ? 'border-slate-600/50' : 'border-slate-200'} pt-4` : '')}>
              <StructuredLessonMessage pack={message.learningPack} />
            </div>
          ) : null}
          <p className={`mt-2 text-xs ${isUser ? 'text-blue-100' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatMsgTime(message.timestamp)}</p>
        </div>
      </motion.div>
    </div>
  );
}
