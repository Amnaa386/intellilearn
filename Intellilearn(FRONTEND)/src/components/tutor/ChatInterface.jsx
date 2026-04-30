'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Mic, Sparkles, FileText, HelpCircle, Presentation, X, Image as ImageIcon, Music, File, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MessageBubble from './MessageBubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { askTutor, autoTitleTutorSession, updateTutorSessionTitle, handleUnauthorized } from '@/lib/tutorApi';
import { createPresentation } from '@/lib/presentationsApi';
import { createVideoLecture } from '@/lib/videoLecturesApi';

export default function ChatInterface({ messages, setMessages, isDarkMode = true, sessionIdRef, autoTitleNextMessage = false, onAutoTitleConsumed = null }) {
  const PPT_THEMES = [
    { id: 'classic', label: 'Classic', description: 'Clean light slides for formal study decks.' },
    { id: 'modern', label: 'Modern', description: 'Dark modern style with crisp contrast.' },
    { id: 'premium', label: 'Premium', description: 'Bold gradient look for AI-like presentation feel.' },
  ];
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [isGeneratingPpt, setIsGeneratingPpt] = useState(false);
  const [isGeneratingVideoLecture, setIsGeneratingVideoLecture] = useState(false);
  const [isPreparingQuiz, setIsPreparingQuiz] = useState(false);
  const [showPptThemeModal, setShowPptThemeModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedPptTheme, setSelectedPptTheme] = useState('modern');
  const [selectedVoiceStyle, setSelectedVoiceStyle] = useState('humanized');
  const [selectedVoiceSpeed, setSelectedVoiceSpeed] = useState(1.0);
  const [successMessage, setSuccessMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [apiError, setApiError] = useState('');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const isActionLocked = isLoading || isGeneratingNotes || isGeneratingPpt || isPreparingQuiz || isGeneratingVideoLecture;
  const actionStatusText = isGeneratingNotes
    ? 'Generating notes...'
    : isGeneratingPpt
      ? 'Generating presentation...'
      : isGeneratingVideoLecture
        ? 'Generating video lecture...'
      : isPreparingQuiz
        ? 'Preparing quiz...'
        : isLoading
          ? 'Getting AI response...'
          : '';

  const derivePptTitleFromMarkdown = (markdown = '', fallback = 'AI Presentation') => {
    const lines = String(markdown)
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !/^[=\-]{3,}$/.test(line));

    for (const line of lines) {
      const cleaned = line
        .replace(/^#{1,6}\s+/, '')
        .replace(/^[-*]\s+/, '')
        .replace(/^\d+\.\s+/, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^(title|slide title)\s*:\s*/i, '')
        .trim();
      if (cleaned.length >= 8) {
        return cleaned.slice(0, 120);
      }
    }

    return fallback;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const id = setTimeout(() => setSuccessMessage(''), 1800);
    return () => clearTimeout(id);
  }, [successMessage]);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    setVoiceSupported(true);
    const recognition = new SpeechRecognition();
    recognition.lang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        finalTranscript += event.results[i][0].transcript;
      }
      const cleaned = finalTranscript.trim();
      if (cleaned) {
        setInput(cleaned);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      const reason = event?.error;
      if (reason === 'not-allowed' || reason === 'service-not-allowed') {
        setApiError('Microphone permission denied. Please allow mic access in browser settings.');
      } else if (reason === 'audio-capture') {
        setApiError('No microphone detected. Please connect a mic and try again.');
      } else if (reason === 'no-speech') {
        setApiError('No speech detected. Try speaking a bit louder.');
      } else {
        setApiError('Voice input failed. Please try again.');
      }
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore cleanup errors
      }
      recognitionRef.current = null;
    };
  }, []);

  const handleVoiceInput = async () => {
    if (!voiceSupported || !recognitionRef.current) {
      setApiError('Voice input is not supported in this browser.');
      return;
    }

    try {
      setApiError('');
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        if (!navigator?.mediaDevices?.getUserMedia) {
          setApiError('Microphone API not available in this browser.');
          return;
        }
        setIsRequestingMic(true);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        recognitionRef.current.start();
        setIsListening(true);
      }
    } catch (error) {
      setIsListening(false);
      if (error?.name === 'NotAllowedError') {
        setApiError('Microphone permission denied. Please allow mic access and retry.');
      } else {
        setApiError('Unable to start voice input. Please try again.');
      }
    } finally {
      setIsRequestingMic(false);
    }
  };

  const getUploadPathForFile = (file) => {
    const name = (file?.name || '').toLowerCase();
    const type = (file?.type || '').toLowerCase();
    if (type.startsWith('image/')) return '/api/upload/image';
    if (type.startsWith('audio/')) return '/api/upload/audio';
    if (name.endsWith('.ppt') || name.endsWith('.pptx')) return '/api/upload/presentation';
    if (
      name.endsWith('.pdf') ||
      name.endsWith('.doc') ||
      name.endsWith('.docx') ||
      name.endsWith('.txt')
    ) return '/api/upload/document';
    return '';
  };

  const handleAttachmentButtonClick = () => {
    if (isUploadingAttachment) return;
    setApiError('');
    fileInputRef.current?.click();
  };

  const getAttachmentMeta = (file) => {
    const rawType = String(file?.type || '').toLowerCase();
    const isImage = rawType.includes('image');
    const isAudio = rawType.includes('audio');
    if (isImage) return { label: 'Image', icon: ImageIcon };
    if (isAudio) return { label: 'Audio', icon: Music };
    return { label: 'File', icon: File };
  };

  const getResolvedFileUrl = (apiBase, url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return `${apiBase}${url}`;
  };

  const handleAttachmentSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selectedFiles.length) return;

    const token = localStorage.getItem('intellilearn_access_token') || '';
    if (!token) {
      setApiError('Session missing. Please login again.');
      return;
    }

    try {
      setApiError('');
      setIsUploadingAttachment(true);
      const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

      const draftItems = selectedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        type: file.type || 'file',
        url: '',
        previewUrl: file.type?.startsWith('image/') ? URL.createObjectURL(file) : '',
        status: 'uploading',
      }));
      setAttachedFiles((prev) => [...prev, ...draftItems]);

      const failedNames = [];
      for (const file of selectedFiles) {
        const item = draftItems.find((entry) => entry.name === file.name && entry.type === (file.type || 'file') && entry.status === 'uploading');
        const uploadPath = getUploadPathForFile(file);
        if (!uploadPath) {
          if (item) {
            setAttachedFiles((prev) => prev.filter((entry) => entry.id !== item.id));
          }
          failedNames.push(file.name);
          continue;
        }
        const form = new FormData();
        form.append('file', file);
        if (uploadPath === '/api/upload/image') {
          form.append('description', 'Uploaded from tutor chat');
        }

        const response = await fetch(`${apiBase}${uploadPath}`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: form,
        });

        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          handleUnauthorized();
          return;
        }
        if (!response.ok) {
          if (item) {
            setAttachedFiles((prev) => prev.filter((entry) => entry.id !== item.id));
          }
          failedNames.push(file.name);
          continue;
        }
        if (item) {
          setAttachedFiles((prev) =>
            prev.map((entry) =>
              entry.id === item.id
                ? {
                    ...entry,
                    name: payload?.filename || file.name,
                    type: payload?.fileType || file.type || 'file',
                    url: getResolvedFileUrl(apiBase, payload?.url),
                    status: 'uploaded',
                  }
                : entry
            )
          );
        }
      }

      if (failedNames.length) {
        const msg = `Some files failed to upload: ${failedNames.join(', ')}`;
        setApiError(msg);
        window.alert(msg);
      }
    } catch (error) {
      setApiError(error?.message || 'Unable to upload attachment.');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

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
          successMessage: 'Notes generated successfully.',
        },
      });
    } catch (err) {
      setApiError(err?.message || 'Failed to generate notes from chat.');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleGenerateQuizFromChat = () => {
    const activeSessionId = sessionIdRef?.current || null;
    if (!activeSessionId || isPreparingQuiz) {
      setApiError('Start or continue a chat first, then generate a quiz.');
      return;
    }
    setApiError('');
    setIsPreparingQuiz(true);
    setSuccessMessage('Quiz ready. Opening quiz page...');
    setTimeout(() => {
      navigate('/dashboard/student/quiz', {
        state: {
          fromChatSessionId: activeSessionId,
          successMessage: 'Quiz loaded from your chat context.',
        },
      });
      setIsPreparingQuiz(false);
    }, 450);
  };

  const handleGeneratePptFromChat = async (theme = 'modern') => {
    if (messages.length < 2 || isGeneratingPpt) return;
    try {
      setApiError('');
      setIsGeneratingPpt(true);
      setShowPptThemeModal(false);
      const convo = messages
        .filter((m) => m?.content)
        .slice(-10)
        .map((m) => {
          const text = (m.content || '').replace(/\s+/g, ' ').trim();
          const compact = text.length > 240 ? `${text.slice(0, 240)}...` : text;
          return `${m.type === 'user' ? 'Student' : 'Tutor'}: ${compact}`;
        })
        .join('\n\n');

      const firstUser = messages.find((m) => m.type === 'user')?.content || 'Tutor Conversation';
      const topic = firstUser.length > 80 ? `${firstUser.slice(0, 80).trim()}...` : firstUser;
      let prompt = `Create presentation-ready markdown content from this tutor conversation.
Keep sections concise and clear for slides:
- Title
- 5 to 8 slide sections using headings
- Bullet points under each section
- Final recap

Conversation:
${convo}`;
      const MAX_PROMPT_LEN = 1800;
      if (prompt.length > MAX_PROMPT_LEN) prompt = `${prompt.slice(0, MAX_PROMPT_LEN)}...`;

      const ai = await askTutor(prompt, sessionIdRef?.current || null);
      const pptContent = ai?.message || '';
      if (!pptContent.trim()) throw new Error('Unable to generate presentation content from conversation.');
      const aiGeneratedTitle = derivePptTitleFromMarkdown(
        pptContent,
        topic ? `AI Presentation on ${topic}` : 'AI Presentation',
      );

      const created = await createPresentation({
        title: aiGeneratedTitle,
        topic,
        content: pptContent,
        theme,
      });

      navigate('/dashboard/student/presentations', {
        state: {
          createdPresentationId: created?.id || null,
          successMessage: 'Presentation generated successfully.',
        },
      });
    } catch (err) {
      setApiError(err?.message || 'Failed to generate presentation from chat.');
    } finally {
      setIsGeneratingPpt(false);
    }
  };

  const handleGenerateVideoFromChat = async () => {
    if (messages.length < 2 || isGeneratingVideoLecture) return;
    try {
      setApiError('');
      setIsGeneratingVideoLecture(true);
      setShowVideoModal(false);
      const convo = messages
        .filter((m) => m?.content)
        .slice(-10)
        .map((m) => {
          const text = (m.content || '').replace(/\s+/g, ' ').trim();
          const compact = text.length > 260 ? `${text.slice(0, 260)}...` : text;
          return `${m.type === 'user' ? 'Student' : 'Tutor'}: ${compact}`;
        })
        .join('\n\n');

      const firstUser = messages.find((m) => m.type === 'user')?.content || 'Tutor Conversation';
      const topic = firstUser.length > 80 ? `${firstUser.slice(0, 80).trim()}...` : firstUser;
      let prompt = `Create a clean spoken lecture script from this tutor conversation.
Requirements:
- 3 to 6 concise sections
- conversational teaching tone
- avoid markdown symbols
- total length around 2 to 4 minutes speech

Conversation:
${convo}`;
      const MAX_PROMPT_LEN = 1800;
      if (prompt.length > MAX_PROMPT_LEN) prompt = `${prompt.slice(0, MAX_PROMPT_LEN)}...`;
      const ai = await askTutor(prompt, sessionIdRef?.current || null);
      const script = (ai?.message || '').replace(/\*\*/g, '').trim();
      if (!script) throw new Error('Unable to generate lecture script from conversation.');
      const title = derivePptTitleFromMarkdown(script, topic ? `Video Lecture on ${topic}` : 'AI Video Lecture');

      await createVideoLecture({
        title,
        topic,
        script,
        voiceStyle: selectedVoiceStyle,
        voiceSpeed: Number(selectedVoiceSpeed),
      });

      navigate('/dashboard/student/video-lectures', {
        state: {
          successMessage: 'Video lecture generated successfully.',
        },
      });
    } catch (err) {
      setApiError(err?.message || 'Failed to generate video lecture from chat.');
    } finally {
      setIsGeneratingVideoLecture(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;
    const sanitizedInput = input
      .replace(/^Use this attached file as context:\s*.*$/gim, '')
      .trim();
    const outgoingText = sanitizedInput;
    const hadExistingSession = Boolean(sessionIdRef?.current);
    const readyFiles = attachedFiles.filter((file) => file.status === 'uploaded');
    const imageUrls = readyFiles
      .filter((file) => String(file.type || '').toLowerCase().includes('image') && file.url)
      .map((file) => file.url);
    const hasImageAttachment = imageUrls.length > 0;
    const attachmentMetaPrompt = readyFiles.length
      ? `\n\nUser attached files:\n${readyFiles
          .map((file) => `- name: ${file.name}\n- type: ${file.type}`)
          .join('\n')}${
          hasImageAttachment ? '\n- note: Please analyze attached image(s) carefully and answer using visual details.' : ''
        }`
      : '';
    const payloadText = `${outgoingText || 'Please use the attached file as context.'}${attachmentMetaPrompt}`.trim();

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: outgoingText || '',
      attachments: readyFiles.map((file) => ({
        name: file.name,
        type: file.type,
        previewUrl: file.url || file.previewUrl || '',
      })),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    readyFiles.forEach((file) => {
      if (file?.previewUrl && file.previewUrl.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(file.previewUrl), 60000);
      }
    });
    setAttachedFiles([]);
    setIsLoading(true);
    setApiError('');

    try {
      const data = await askTutor(
        payloadText,
        sessionIdRef?.current || null,
        hasImageAttachment ? { image_urls: imageUrls } : null,
      );
      if (data?.sessionId && sessionIdRef) {
        sessionIdRef.current = data.sessionId;
        try {
          sessionStorage.setItem('intellilearn_active_chat_session_id', data.sessionId);
        } catch {
          // no-op if storage unavailable
        }

        // ChatGPT-style behavior: first user message becomes session title.
        if (!hadExistingSession) {
          const titleSeed = outgoingText || `Attached: ${readyFiles[0]?.name || 'file'}`;
          const title = titleSeed.length > 36 ? `${titleSeed.slice(0, 36).trim()}...` : titleSeed;
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
    <div className={`relative flex flex-col h-full rounded-xl overflow-hidden border ${isDarkMode ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
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
        {successMessage ? (
          <p className="mt-2 text-xs text-emerald-400">{successMessage}</p>
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
              type="button"
              onClick={handleAttachmentButtonClick}
              disabled={isUploadingAttachment || isActionLocked}
              className={isDarkMode ? 'border-slate-600 text-slate-400 hover:bg-slate-800/50 disabled:opacity-60' : 'border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-60'}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              type="button"
              onClick={handleVoiceInput}
              disabled={isActionLocked}
              className={
                isListening
                  ? (isDarkMode
                    ? 'border-rose-400/50 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
                    : 'border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100')
                  : (isDarkMode
                    ? 'border-slate-600 text-slate-400 hover:bg-slate-800/50'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100')
              }
              title={
                !voiceSupported
                  ? 'Voice input not supported in this browser'
                  : isListening
                    ? 'Stop listening'
                    : 'Start voice input'
              }
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
            <Button
              type="button"
              variant="outline"
              disabled={messages.length < 2 || !sessionIdRef?.current}
              onClick={handleGenerateQuizFromChat}
              className={isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800/50' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Generate Quiz
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={messages.length < 2 || isGeneratingPpt || isActionLocked}
              onClick={() => setShowPptThemeModal(true)}
              className={isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800/50' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}
            >
              <Presentation className="w-4 h-4 mr-2" />
              {isGeneratingPpt ? 'Generating PPT...' : 'Generate PPT'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={messages.length < 2 || isGeneratingVideoLecture || isActionLocked}
              onClick={() => setShowVideoModal(true)}
              className={isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800/50' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}
            >
              <Video className="w-4 h-4 mr-2" />
              {isGeneratingVideoLecture ? 'Generating Video...' : 'Generate Video Lecture'}
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
              disabled={isActionLocked || (!input.trim() && attachedFiles.length === 0) || isUploadingAttachment}
              size="icon"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,audio/*,.pdf,.doc,.docx,.txt,.ppt,.pptx"
            onChange={handleAttachmentSelect}
          />
          {isUploadingAttachment ? (
            <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
              Uploading attachment...
            </p>
          ) : null}
          {attachedFiles.length ? (
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file) => {
                const meta = getAttachmentMeta(file);
                const IconComp = meta.icon;
                return (
                  <div
                    key={file.id}
                    className={`inline-flex max-w-[280px] items-center gap-2 rounded-xl border px-2.5 py-2 ${
                      isDarkMode ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <span
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      <IconComp className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className={`truncate text-xs font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        {file.name}
                      </p>
                      <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {file.status === 'uploading' ? 'Uploading...' : meta.label}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove attachment"
                      onClick={() => {
                        if (file?.previewUrl && file.previewUrl.startsWith('blob:')) {
                          URL.revokeObjectURL(file.previewUrl);
                        }
                        setAttachedFiles((prev) => prev.filter((item) => item.id !== file.id));
                      }}
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                        isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
          {isRequestingMic ? (
            <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
              Requesting microphone permission...
            </p>
          ) : null}
          {isListening ? (
            <p className={`text-xs ${isDarkMode ? 'text-rose-300' : 'text-rose-600'}`}>
              Listening... speak now, then tap mic again to stop.
            </p>
          ) : null}
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

      <AnimatePresence>
        {showPptThemeModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className={isDarkMode ? 'w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-5' : 'w-full max-w-xl rounded-2xl border border-slate-300 bg-white p-5'}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className={isDarkMode ? 'text-lg font-semibold text-slate-100' : 'text-lg font-semibold text-slate-900'}>Select PPT theme</h3>
                  <p className={isDarkMode ? 'mt-1 text-sm text-slate-400' : 'mt-1 text-sm text-slate-600'}>
                    Choose style before generating your presentation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPptThemeModal(false)}
                  className={isDarkMode ? 'rounded-md p-1 text-slate-300 hover:bg-slate-800' : 'rounded-md p-1 text-slate-600 hover:bg-slate-100'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {PPT_THEMES.map((theme) => {
                  const active = selectedPptTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedPptTheme(theme.id)}
                      className={`rounded-xl border px-3 py-3 text-left transition ${
                        active
                          ? 'border-blue-500 bg-blue-500/10'
                          : isDarkMode
                            ? 'border-slate-700 hover:border-slate-500'
                            : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <p className={isDarkMode ? 'text-sm font-semibold text-slate-100' : 'text-sm font-semibold text-slate-900'}>{theme.label}</p>
                      <p className={isDarkMode ? 'mt-1 text-xs text-slate-400' : 'mt-1 text-xs text-slate-600'}>{theme.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPptThemeModal(false)}
                  className={isDarkMode ? 'rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800' : 'rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100'}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleGeneratePptFromChat(selectedPptTheme)}
                  disabled={isGeneratingPpt}
                  className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 text-sm font-medium text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-60"
                >
                  {isGeneratingPpt ? 'Generating...' : 'Generate PPT'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
        {showVideoModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className={isDarkMode ? 'w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-5' : 'w-full max-w-xl rounded-2xl border border-slate-300 bg-white p-5'}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className={isDarkMode ? 'text-lg font-semibold text-slate-100' : 'text-lg font-semibold text-slate-900'}>Video lecture settings</h3>
                  <p className={isDarkMode ? 'mt-1 text-sm text-slate-400' : 'mt-1 text-sm text-slate-600'}>
                    Choose voice style and speed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className={isDarkMode ? 'rounded-md p-1 text-slate-300 hover:bg-slate-800' : 'rounded-md p-1 text-slate-600 hover:bg-slate-100'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { id: 'standard', label: 'Standard', description: 'Clear and stable AI voice.' },
                  { id: 'humanized', label: 'Humanized AI', description: 'Softer pacing for natural lecture tone.' },
                ].map((voice) => {
                  const active = selectedVoiceStyle === voice.id;
                  return (
                    <button
                      key={voice.id}
                      type="button"
                      onClick={() => setSelectedVoiceStyle(voice.id)}
                      className={`rounded-xl border px-3 py-3 text-left transition ${
                        active
                          ? 'border-blue-500 bg-blue-500/10'
                          : isDarkMode
                            ? 'border-slate-700 hover:border-slate-500'
                            : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <p className={isDarkMode ? 'text-sm font-semibold text-slate-100' : 'text-sm font-semibold text-slate-900'}>{voice.label}</p>
                      <p className={isDarkMode ? 'mt-1 text-xs text-slate-400' : 'mt-1 text-xs text-slate-600'}>{voice.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                <label className={isDarkMode ? 'mb-1 block text-xs text-slate-400' : 'mb-1 block text-xs text-slate-600'}>
                  Voice Speed: {Number(selectedVoiceSpeed).toFixed(2)}x
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="1.25"
                  step="0.05"
                  value={selectedVoiceSpeed}
                  onChange={(e) => setSelectedVoiceSpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className={isDarkMode ? 'rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800' : 'rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100'}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateVideoFromChat}
                  disabled={isGeneratingVideoLecture}
                  className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 text-sm font-medium text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-60"
                >
                  {isGeneratingVideoLecture ? 'Generating...' : 'Generate Video Lecture'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {isActionLocked ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/60 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 shadow-xl">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
            <span>{actionStatusText || 'Please wait...'}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
