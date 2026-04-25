'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Send,
  Bot,
  Hash,
  Clock,
  ListChecks,
  PenLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { loadChatSessions } from '@/lib/chatSessions';
import {
  generateQuizQuestionsFromSession,
  scoreChatQuiz,
  buildResultFeedback,
  evaluateWrittenAnswer,
  getWrittenHint,
  WRITTEN_MIN_CHARS,
  MAX_HINTS_PER_WRITTEN,
} from '@/lib/mockQuizFromChat';
import { cn } from '@/lib/utils';

function buildHighlightParts(text, highlights) {
  if (!text || !highlights?.length) return [{ type: 't', text }];
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const parts = [];
  let cursor = 0;
  for (const h of sorted) {
    const start = Math.max(0, Math.min(h.start, text.length));
    const end = Math.max(start, Math.min(h.end, text.length));
    if (start > cursor) parts.push({ type: 't', text: text.slice(cursor, start) });
    if (end > start) parts.push({ type: 'h', text: text.slice(start, end), label: h.label || 'Review' });
    cursor = Math.max(cursor, end);
  }
  if (cursor < text.length) parts.push({ type: 't', text: text.slice(cursor) });
  return parts.length ? parts : [{ type: 't', text }];
}

function formatRelativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Animated AI assistant for quiz generation (SVG + motion — no external assets) */
function AiAssistantLoader() {
  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
      <motion.div
        className="absolute inset-2 rounded-full bg-blue-500/25 blur-2xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-purple-500/15 blur-xl"
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="relative z-10 flex flex-col items-center"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 120 120" className="h-28 w-28 drop-shadow-[0_0_24px_rgba(59,130,246,0.35)]" aria-hidden>
          <defs>
            <linearGradient id="botHead" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <motion.rect
            x="28"
            y="32"
            width="64"
            height="56"
            rx="14"
            fill="url(#botHead)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
            animate={{ rotate: [0, -1.5, 1.5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '60px 60px' }}
          />
          <motion.circle cx="48" cy="56" r="5" fill="#e2e8f0" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
          <motion.circle cx="72" cy="56" r="5" fill="#e2e8f0" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity, delay: 0.2 }} />
          <rect x="44" y="70" width="32" height="4" rx="2" fill="rgba(255,255,255,0.35)" />
          <motion.g
            animate={{ rotate: [-6, 6, -6] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '60px 32px' }}
          >
            <line x1="60" y1="20" x2="60" y2="32" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <motion.circle cx="60" cy="16" r="5" fill="#60a5fa" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }} />
          </motion.g>
        </svg>
        <motion.div
          className="mt-1 flex gap-1"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-blue-400"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function QuizFromChatFlow() {
  const [stage, setStage] = useState('sessions');
  const [sessions, setSessions] = useState(() => loadChatSessions());
  const [selectedId, setSelectedId] = useState(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  /** @type {null | 'mcq' | 'written'} */
  const [answerMode, setAnswerMode] = useState(null);
  /** @type {Record<string, { evaluated?: boolean, quality?: number, bullets?: string[], highlights?: Array<{start:number,end:number,label?:string}>, hintsUsed?: number, hintLog?: string[], checkedAgainst?: string | null }>} */
  const [writtenByQ, setWrittenByQ] = useState({});

  useEffect(() => {
    setSessions(loadChatSessions());
  }, []);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedId) || null,
    [sessions, selectedId],
  );

  /** After transition to generating stage, simulate AI quiz build then choose answer mode */
  useEffect(() => {
    if (stage !== 'generating' || !activeSession) return undefined;
    const t = window.setTimeout(() => {
      setQuestions([]);
      setAnswers({});
      setWrittenByQ({});
      setCurrentIndex(0);
      setAnswerMode(null);
      setStage('chooseMode');
    }, 2600);
    return () => window.clearTimeout(t);
  }, [stage, activeSession]);

  const handleGenerate = useCallback(
    (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      if (!selectedSession || isLaunching) return;
      setActiveSession(selectedSession);
      setIsLaunching(true);
      window.setTimeout(() => {
        setIsLaunching(false);
        setStage('generating');
      }, 720);
    },
    [selectedSession, isLaunching],
  );

  const handleAnswerMcq = (qid, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [qid]: optionIndex }));
  };

  const handleWrittenDraftChange = (qid, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
    setWrittenByQ((prev) => {
      const row = prev[qid];
      const checked = row?.checkedAgainst;
      if (checked != null && value.trim() !== checked) {
        return {
          ...prev,
          [qid]: {
            ...row,
            evaluated: false,
            bullets: [],
            highlights: [],
            checkedAgainst: null,
            quality: undefined,
          },
        };
      }
      return prev;
    });
  };

  const startQuizWithMode = useCallback(
    (mode) => {
      if (!activeSession) return;
      const qs = generateQuizQuestionsFromSession(activeSession, mode);
      setAnswerMode(mode);
      setQuestions(qs);
      setAnswers({});
      setWrittenByQ({});
      setCurrentIndex(0);
      setStage('quiz');
    },
    [activeSession],
  );

  const handleCheckWritten = (qid) => {
    const q = questions.find((x) => x.id === qid);
    if (!q || q.type !== 'written') return;
    const text = (answers[qid] || '').trim();
    const result = evaluateWrittenAnswer(q, text);
    setWrittenByQ((prev) => ({
      ...prev,
      [qid]: {
        ...prev[qid],
        evaluated: true,
        quality: result.quality,
        bullets: result.bullets,
        highlights: result.highlights,
        checkedAgainst: text,
        hintsUsed: prev[qid]?.hintsUsed || 0,
        hintLog: prev[qid]?.hintLog || [],
      },
    }));
  };

  const handleWrittenHint = (qid) => {
    const q = questions.find((x) => x.id === qid);
    if (!q || q.type !== 'written') return;
    setWrittenByQ((prev) => {
      const used = prev[qid]?.hintsUsed || 0;
      const next = getWrittenHint(q, used);
      if (!next) return prev;
      return {
        ...prev,
        [qid]: {
          ...prev[qid],
          hintsUsed: used + 1,
          hintLog: [...(prev[qid]?.hintLog || []), next],
        },
      };
    });
  };

  const isQuestionComplete = useCallback(
    (q) => {
      if (!q) return false;
      if (q.type === 'mcq') return answers[q.id] !== undefined && answers[q.id] !== null;
      if (q.type === 'written') {
        const min = q.minLength ?? WRITTEN_MIN_CHARS;
        const text = (answers[q.id] || '').trim();
        if (text.length < min) return false;
        return Boolean(writtenByQ[q.id]?.evaluated);
      }
      return false;
    },
    [answers, writtenByQ],
  );

  const canNavigateToIndex = useCallback(
    (targetIndex) => {
      if (!questions.length) return false;
      if (targetIndex < 0 || targetIndex >= questions.length) return false;
      for (let k = 0; k < targetIndex; k += 1) {
        if (!isQuestionComplete(questions[k])) return false;
      }
      return true;
    },
    [questions, isQuestionComplete],
  );

  const handleSubmitQuiz = () => {
    const writtenById = Object.fromEntries(
      Object.entries(writtenByQ).map(([id, row]) => [
        id,
        { evaluated: Boolean(row?.evaluated), quality: typeof row?.quality === 'number' ? row.quality : 0 },
      ]),
    );
    const s = scoreChatQuiz(questions, answers, { writtenById });
    setScore(s);
    setFeedback(buildResultFeedback(s));
    setStage('results');
  };

  const resetFlow = () => {
    setStage('sessions');
    setSelectedId(null);
    setIsLaunching(false);
    setQuestions([]);
    setActiveSession(null);
    setAnswers({});
    setCurrentIndex(0);
    setFeedback(null);
    setAnswerMode(null);
    setWrittenByQ({});
    setSessions(loadChatSessions());
  };

  const leaveChooseMode = () => {
    setStage('sessions');
    setActiveSession(null);
    setQuestions([]);
    setAnswerMode(null);
    setWrittenByQ({});
    setAnswers({});
    setCurrentIndex(0);
  };

  const currentQ = questions[currentIndex];
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const currentStepComplete = currentQ ? isQuestionComplete(currentQ) : false;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 text-center sm:text-left"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
          <Bot className="h-3.5 w-3.5" />
          Chat-based quiz
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Quiz from AI chats</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
          Pick a conversation you had with the AI tutor. We&apos;ll generate practice questions grounded in that thread—no
          fixed subject lists, just your own learning context.
        </p>
      </motion.header>

      <AnimatePresence mode="wait">
        {stage === 'sessions' && (
          <motion.section
            key="sessions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            <div className="grid gap-4">
              {sessions.map((session, i) => {
                const isSelected = selectedId === session.id;
                const expandActive = isLaunching && isSelected;
                const dimOthers = isLaunching && !isSelected;
                return (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{
                      opacity: dimOthers ? 0.35 : 1,
                      y: 0,
                      scale: expandActive ? 1.01 : 1,
                    }}
                    transition={{ delay: i * 0.04, layout: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
                    className={cn(dimOthers && 'pointer-events-none blur-[0.5px]')}
                  >
                    <motion.button
                      type="button"
                      layout
                      disabled={isLaunching}
                      whileHover={!isLaunching ? { scale: 1.008 } : undefined}
                      whileTap={!isLaunching ? { scale: 0.992 } : undefined}
                      onClick={() => {
                        if (isLaunching) return;
                        setSelectedId(session.id);
                      }}
                      className={cn(
                        'relative w-full rounded-2xl border p-5 text-left transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f2c]',
                        isSelected
                          ? 'border-blue-500/55 bg-blue-500/[0.12] shadow-lg shadow-blue-900/25'
                          : 'border-white/10 bg-slate-900/40 hover:border-white/25',
                        expandActive && 'ring-2 ring-blue-400/50 ring-offset-2 ring-offset-[#0a0f2c]',
                      )}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="chat-active-badge"
                          className="absolute right-4 top-4 rounded-full bg-blue-600/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          Selected
                        </motion.span>
                      )}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:pr-24">
                        <div className="flex items-start gap-3">
                          <motion.div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 ring-1 ring-white/10"
                            animate={isSelected ? { scale: [1, 1.06, 1] } : {}}
                            transition={{ duration: 2, repeat: isSelected ? Infinity : 0, ease: 'easeInOut' }}
                          >
                            <MessageSquare className="h-5 w-5 text-blue-300" />
                          </motion.div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                <Hash className="mr-0.5 inline h-3 w-3" />
                                {session.id}
                              </span>
                              <span className="text-[10px] text-slate-600">·</span>
                              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(session.updatedAt)}
                              </span>
                            </div>
                            <motion.div
                              initial={false}
                              animate={{ height: expandActive ? 'auto' : 'auto' }}
                              className="overflow-hidden"
                            >
                              <p
                                className={cn(
                                  'mt-2 text-sm leading-relaxed text-slate-200 transition-all duration-500',
                                  expandActive ? 'line-clamp-none' : 'line-clamp-3',
                                )}
                              >
                                {session.preview}
                              </p>
                            </motion.div>
                            <AnimatePresence>
                              {expandActive && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-4 overflow-hidden rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5"
                                >
                                  <p className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                                    <span className="relative flex h-2 w-2">
                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                                    </span>
                                    Active session — opening thread and preparing your quiz…
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-[11px] text-slate-500">
                          {session.messageCount != null ? (
                            <span className="rounded-lg bg-white/5 px-2 py-1">{session.messageCount} messages</span>
                          ) : null}
                        </div>
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              className="flex flex-col items-stretch justify-end gap-4 sm:flex-row sm:items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <p className="flex-1 text-xs text-slate-500">
                Tip: longer chats give richer context for question wording. Visit the AI Tutor to add more threads.
              </p>
              <motion.button
                type="button"
                disabled={!selectedSession || isLaunching}
                onClick={handleGenerate}
                whileHover={selectedSession && !isLaunching ? { scale: 1.03, y: -1 } : undefined}
                whileTap={selectedSession && !isLaunching ? { scale: 0.97 } : undefined}
                className={cn(
                  'relative inline-flex min-h-[52px] w-full cursor-pointer select-none items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-900/35 transition-shadow',
                  'hover:shadow-xl hover:shadow-blue-800/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f2c]',
                  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45',
                  'sm:min-w-[280px] sm:w-auto',
                )}
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity hover:opacity-100" />
                {isLaunching ? (
                  <Loader2 className="relative z-10 h-5 w-5 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="relative z-10 h-5 w-5 shrink-0" aria-hidden />
                )}
                <span className="relative z-10">
                  {isLaunching ? 'Preparing…' : 'Generate quiz from this chat'}
                </span>
              </motion.button>
            </motion.div>
          </motion.section>
        )}

        {stage === 'generating' && (
          <motion.section
            key="generating"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 shadow-2xl"
          >
            <motion.div
              layout
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="border-b border-white/10 bg-gradient-to-r from-blue-600/15 via-slate-900/80 to-purple-600/10 px-5 py-4 sm:px-8"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300/90">Active chat</p>
              <p className="mt-1 font-mono text-sm text-white">{activeSession?.id}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{activeSession?.preview}</p>
            </motion.div>

            <div className="flex flex-col items-center px-5 py-12 text-center sm:px-10">
              <AiAssistantLoader />
              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 text-xl font-bold text-white sm:text-2xl"
              >
                Generating your quiz
              </motion.h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Our assistant is reading your thread. Next, you&apos;ll choose how you want to answer: multiple choice or
                written responses with guided feedback.
              </p>
              <div className="mt-10 w-full max-w-md">
                <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <span>Processing context</span>
                  <span>Almost there</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {stage === 'chooseMode' && activeSession && (
          <motion.section
            key="chooseMode"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300/90">Ready</p>
              <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">How do you want to answer?</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-400">
                MCQ mode is fastest for recall. Written mode asks you to compose answers; a mock tutor checks your text,
                flags vague spots, and offers at most {MAX_HINTS_PER_WRITTEN} short hints per question—never a full model
                answer—so you still do the thinking.
              </p>
              <p className="mt-2 font-mono text-xs text-slate-500">{activeSession.id}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => startQuizWithMode('mcq')}
                className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-lg transition-colors hover:border-blue-500/40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-500/25">
                  <ListChecks className="h-6 w-6 text-blue-300" aria-hidden />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white">MCQs mode</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Six multiple-choice questions. You&apos;ll need an option on each item before moving on.
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-300/90">Select to start →</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => startQuizWithMode('written')}
                className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-lg transition-colors hover:border-purple-500/40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 ring-1 ring-purple-500/25">
                  <PenLine className="h-6 w-6 text-purple-300" aria-hidden />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white">Written answer mode</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Type answers, run a check, and use limited hints. Navigation unlocks only after each step is
                    completed properly.
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-300/90">Select to start →</span>
              </motion.button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={leaveChooseMode}
              className="w-full rounded-xl border-white/15 py-5 text-slate-300 hover:bg-white/5 sm:w-auto"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to chat sessions
            </Button>
          </motion.section>
        )}

        {stage === 'quiz' && currentQ && (
          <motion.section
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-start gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Session</p>
                  <p className="font-mono text-sm text-blue-300/90">{activeSession?.id}</p>
                </div>
                {answerMode ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ring-1',
                      answerMode === 'mcq'
                        ? 'bg-blue-500/15 text-blue-200 ring-blue-500/30'
                        : 'bg-purple-500/15 text-purple-100 ring-purple-500/35',
                    )}
                  >
                    {answerMode === 'mcq' ? (
                      <>
                        <ListChecks className="h-3.5 w-3.5" aria-hidden />
                        MCQs mode
                      </>
                    ) : (
                      <>
                        <PenLine className="h-3.5 w-3.5" aria-hidden />
                        Written mode
                      </>
                    )}
                  </span>
                ) : null}
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800 sm:max-w-xs">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
              <span className="text-sm font-medium text-slate-400">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-xl sm:p-8"
              >
                <div className="mb-6 flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white">
                    {currentIndex + 1}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {currentQ.type === 'mcq' ? 'Multiple choice' : 'Written response'}
                  </span>
                </div>
                <h2 className="text-lg font-semibold leading-relaxed text-white sm:text-xl">{currentQ.question}</h2>

                {currentQ.type === 'mcq' && (
                  <div className="mt-8 space-y-3">
                    {currentQ.options.map((opt, idx) => (
                      <motion.button
                        key={opt}
                        type="button"
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleAnswerMcq(currentQ.id, idx)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-colors',
                          answers[currentQ.id] === idx
                            ? 'border-blue-500/60 bg-blue-500/15 text-blue-50'
                            : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-blue-500/30',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                            answers[currentQ.id] === idx ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400',
                          )}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {currentQ.type === 'written' && (
                  <div className="mt-8 space-y-4">
                    <p className="text-xs text-slate-500">
                      Minimum {currentQ.minLength ?? WRITTEN_MIN_CHARS} characters. Use &quot;Check my answer&quot; so
                      feedback can unlock forward navigation. Hints are capped at {MAX_HINTS_PER_WRITTEN} per question and
                      stay process-focused.
                    </p>
                    <Textarea
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleWrittenDraftChange(currentQ.id, e.target.value)}
                      placeholder="Write your answer in your own words…"
                      rows={6}
                      className="min-h-[140px] resize-y rounded-xl border-white/10 bg-slate-950/50 py-3 text-base text-slate-100 placeholder:text-slate-600 focus-visible:ring-blue-500/30"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleCheckWritten(currentQ.id)}
                        className="rounded-xl bg-white/10 text-white hover:bg-white/15"
                      >
                        Check my answer
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          (writtenByQ[currentQ.id]?.hintsUsed || 0) >= MAX_HINTS_PER_WRITTEN ||
                          !getWrittenHint(currentQ, writtenByQ[currentQ.id]?.hintsUsed || 0)
                        }
                        onClick={() => handleWrittenHint(currentQ.id)}
                        className="rounded-xl border-amber-500/35 text-amber-100/90 hover:bg-amber-500/10"
                      >
                        Hint (
                        {Math.min(
                          writtenByQ[currentQ.id]?.hintsUsed || 0,
                          MAX_HINTS_PER_WRITTEN,
                        )}
                        /{MAX_HINTS_PER_WRITTEN})
                      </Button>
                    </div>
                    {writtenByQ[currentQ.id]?.hintLog?.length ? (
                      <ul className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90">
                        {writtenByQ[currentQ.id].hintLog.map((h) => (
                          <li key={h} className="flex gap-2">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/90" aria-hidden />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {writtenByQ[currentQ.id]?.evaluated ? (
                      <div className="space-y-3 rounded-xl border border-blue-500/25 bg-blue-500/5 px-4 py-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200/90">Tutor check</p>
                        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-300">
                          {(writtenByQ[currentQ.id].bullets || []).map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                        {(() => {
                          const raw = (answers[currentQ.id] || '').trim();
                          const parts = buildHighlightParts(raw, writtenByQ[currentQ.id]?.highlights);
                          if (!raw || parts.every((p) => p.type === 't')) return null;
                          return (
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Phrases to revisit
                              </p>
                              <p className="rounded-lg bg-slate-950/60 px-3 py-2 text-sm leading-relaxed text-slate-200">
                                {parts.map((p, idx) =>
                                  p.type === 'h' ? (
                                    <mark
                                      key={`${idx}-${p.text}`}
                                      className="rounded bg-rose-500/25 px-0.5 text-rose-100 ring-1 ring-rose-500/30"
                                      title={p.label}
                                    >
                                      {p.text}
                                    </mark>
                                  ) : (
                                    <span key={`${idx}-${p.text}`}>{p.text}</span>
                                  ),
                                )}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    ) : null}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="rounded-xl border-white/15 bg-transparent text-slate-300 hover:bg-white/5"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <div className="flex flex-wrap gap-2">
                {questions.map((q, i) => {
                  const unlocked = canNavigateToIndex(i);
                  const done = isQuestionComplete(q);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      disabled={!unlocked}
                      title={!unlocked ? 'Complete earlier questions first' : undefined}
                      onClick={() => {
                        if (!unlocked) return;
                        setCurrentIndex(i);
                      }}
                      className={cn(
                        'h-9 w-9 rounded-lg text-xs font-bold transition-colors',
                        !unlocked && 'cursor-not-allowed opacity-40 hover:bg-slate-800',
                        i === currentIndex
                          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                          : done
                            ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700',
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              {currentIndex < questions.length - 1 ? (
                <Button
                  type="button"
                  disabled={!currentStepComplete}
                  onClick={() => {
                    if (!currentStepComplete) return;
                    setCurrentIndex((i) => i + 1);
                  }}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={!currentStepComplete}
                  onClick={() => {
                    if (!currentStepComplete) return;
                    handleSubmitQuiz();
                  }}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit quiz
                </Button>
              )}
            </div>
          </motion.section>
        )}

        {stage === 'results' && feedback && (
          <motion.section
            key="results"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl"
          >
            <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/15 to-transparent px-6 py-10 text-center sm:px-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-4xl font-black text-white shadow-xl shadow-blue-900/40"
              >
                {score}
              </motion.div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Score out of 100</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{feedback.headline}</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">{feedback.summary}</p>
            </div>
            <div className="space-y-4 border-t border-white/5 p-6 sm:p-8">
              <h3 className="text-sm font-semibold text-slate-300">Suggestions</h3>
              <ul className="space-y-3">
                {feedback.suggestions.map((line) => (
                  <li
                    key={line}
                    className="flex gap-3 rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-400"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                    {line}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                onClick={resetFlow}
                variant="outline"
                className="mt-4 w-full rounded-xl border-white/15 py-6 text-base hover:bg-white/5"
              >
                Back to chat sessions
              </Button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
