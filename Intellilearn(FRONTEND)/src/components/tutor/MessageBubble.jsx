'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Cpu, File as FileIcon, Image as ImageIcon, Music, Square, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import StructuredLessonMessage from './StructuredLessonMessage';
import { cn } from '@/lib/utils';

let activeSpeechToken = null;
let activeSpeechStop = null;

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
  const [isCopied, setIsCopied] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const speechTokenRef = React.useRef(`msg-${message?.id || Math.random().toString(36).slice(2)}`);
  const isCancelledRef = React.useRef(false);
  const chunkTimeoutRef = React.useRef(null);

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

  const attachments = React.useMemo(() => {
    if (Array.isArray(message?.attachments) && message.attachments.length) return message.attachments;
    if (message?.attachment) return [message.attachment];
    return [];
  }, [message?.attachments, message?.attachment]);

  const readAloudText = React.useMemo(() => {
    const raw = String(message?.content || '');
    const normalized = raw
      .replace(/```[\s\S]*?```/g, ' code block ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/\bhttps?:\/\/\S+/gi, ' link ')
      .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, ' ')
      .replace(/\r/g, '\n')
      .replace(/[•◦▪]/g, '-')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/^\s*\d+\.\s+/gm, ' ')
      .replace(/#{1,6}\s*/g, '')
      .replace(/[>~]/g, ' ');

    const lines = normalized
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => Boolean(line) && !/^[=\-]{3,}$/.test(line));

    // Convert list-like lines to explicit "Point N" phrasing.
    let point = 1;
    const spokenLines = lines.map((line) => {
      const looksLikeListItem =
        /^[\-*]\s+/.test(line) ||
        /^([A-Za-z ]+:\s*)$/.test(line) ||
        /^(key concepts|important points|quick revision|answers|practice questions)/i.test(line);
      if (looksLikeListItem) {
        const text = line.replace(/^[\-*]\s+/, '').trim();
        if (!text) return '';
        const out = `Point ${point}. ${text}`;
        point += 1;
        return out;
      }
      return /[.!?]$/.test(line) ? line : `${line}.`;
    }).filter(Boolean);

    return spokenLines
      .map((line) => line.replace(/[ \t]+/g, ' ').replace(/\.{2,}/g, '.').trim())
      .filter(Boolean)
      .join('\n')
      .replace(/\b(\w+)(\s+\1\b){2,}/gi, '$1') // collapse accidental repeated words
      .trim();
  }, [message?.content]);

  const speechChunks = React.useMemo(() => {
    if (!readAloudText) return [];
    const chunks = [];
    const maxChars = 90;
    const maxWords = 16;

    const lines = readAloudText
      .replace(/\s*\n+\s*/g, '\n')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const pushByWords = (text) => {
      const words = text.split(/\s+/).filter(Boolean);
      if (!words.length) return;
      let currentWords = [];
      words.forEach((w) => {
        const candidateWords = [...currentWords, w];
        const candidate = candidateWords.join(' ');
        if (candidate.length > maxChars || candidateWords.length > maxWords) {
          if (currentWords.length) chunks.push(currentWords.join(' '));
          currentWords = [w];
        } else {
          currentWords = candidateWords;
        }
      });
      if (currentWords.length) chunks.push(currentWords.join(' '));
    };

    lines.forEach((line) => {
      if (line.length <= maxChars && line.split(/\s+/).length <= maxWords) {
        chunks.push(line);
      } else {
        line
          .split(/,\s+/)
          .map((x) => x.trim())
          .filter(Boolean)
          .forEach((part) => pushByWords(part));
      }
    });

    return chunks.length ? chunks : [readAloudText];
  }, [readAloudText]);

  const getAttachmentKind = React.useCallback((type) => {
    const rawType = String(type || '').toLowerCase();
    if (rawType.includes('image')) return 'image';
    if (rawType.includes('audio')) return 'audio';
    return 'file';
  }, []);

  const handleCopy = async () => {
    const text = String(message?.content || '').trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1400);
    } catch {
      // no-op fallback
    }
  };

  const stopSpeaking = React.useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    isCancelledRef.current = true;
    if (chunkTimeoutRef.current) {
      clearTimeout(chunkTimeoutRef.current);
      chunkTimeoutRef.current = null;
    }
    if (activeSpeechToken === speechTokenRef.current) {
      activeSpeechToken = null;
      activeSpeechStop = null;
    }
    setIsSpeaking(false);
  }, []);

  const handleListen = React.useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (!speechChunks.length) return;

    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if (activeSpeechStop && activeSpeechToken && activeSpeechToken !== speechTokenRef.current) {
      activeSpeechStop();
    }

    activeSpeechToken = speechTokenRef.current;
    activeSpeechStop = stopSpeaking;
    isCancelledRef.current = false;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const speakChunk = (index) => {
      if (isCancelledRef.current || activeSpeechToken !== speechTokenRef.current) {
        setIsSpeaking(false);
        return;
      }
      if (index >= speechChunks.length) {
        setIsSpeaking(false);
        if (activeSpeechToken === speechTokenRef.current) {
          activeSpeechToken = null;
          activeSpeechStop = null;
        }
        return;
      }

      const utterance = new SpeechSynthesisUtterance(speechChunks[index]);
      utterance.rate = 0.98;
      utterance.pitch = 1;
      let hasAdvanced = false;
      const advanceOnce = () => {
        if (hasAdvanced) return;
        hasAdvanced = true;
        if (chunkTimeoutRef.current) {
          clearTimeout(chunkTimeoutRef.current);
          chunkTimeoutRef.current = null;
        }
        speakChunk(index + 1);
      };
      utterance.onend = advanceOnce;
      utterance.onerror = () => {
        advanceOnce();
      };
      window.speechSynthesis.speak(utterance);

      // Safari can get stuck repeating a token; force-advance safety timeout.
      chunkTimeoutRef.current = setTimeout(() => {
        window.speechSynthesis.cancel();
        advanceOnce();
      }, 16000);
    };

    speakChunk(0);
  }, [isSpeaking, speechChunks, stopSpeaking]);

  React.useEffect(() => {
    return () => {
      if (activeSpeechToken === speechTokenRef.current) {
        stopSpeaking();
      }
    };
  }, [stopSpeaking]);

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
          {isUser && attachments.length ? (
            <div className={cn(message.content ? 'mt-2' : '', 'space-y-2')}>
              {attachments.map((attachment, idx) => {
                const kind = getAttachmentKind(attachment.type);
                return (
                  <div key={`${attachment.name || 'file'}-${idx}`} className="space-y-2">
                    {kind === 'image' && attachment.previewUrl ? (
                      <img
                        src={attachment.previewUrl}
                        alt={attachment.name || 'Attachment'}
                        className="max-h-52 w-full rounded-md border border-white/20 object-cover"
                      />
                    ) : null}
                    <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-black/20 px-2.5 py-2 text-xs text-blue-100">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-white/10">
                        {kind === 'image' ? (
                          <ImageIcon className="h-3.5 w-3.5" />
                        ) : kind === 'audio' ? (
                          <Music className="h-3.5 w-3.5" />
                        ) : (
                          <FileIcon className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span className="truncate">{attachment.name || 'file'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          {hasPack ? (
            <div className={cn(message.content ? `mt-4 border-t ${isDarkMode ? 'border-slate-600/50' : 'border-slate-200'} pt-4` : '')}>
              <StructuredLessonMessage pack={message.learningPack} />
            </div>
          ) : null}
          {!isUser && message.content ? (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors',
                  isDarkMode
                    ? 'border-slate-600/60 text-slate-300 hover:bg-slate-700/50'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100',
                )}
                aria-label="Copy message"
              >
                {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {isCopied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handleListen}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors',
                  isDarkMode
                    ? 'border-slate-600/60 text-slate-300 hover:bg-slate-700/50'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100',
                )}
                aria-label={isSpeaking ? 'Stop listening' : 'Listen to message'}
              >
                {isSpeaking ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                {isSpeaking ? 'Stop' : 'Listen'}
              </button>
            </div>
          ) : null}
          <p className={`mt-2 text-xs ${isUser ? 'text-blue-100' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatMsgTime(message.timestamp)}</p>
        </div>
      </motion.div>
    </div>
  );
}
