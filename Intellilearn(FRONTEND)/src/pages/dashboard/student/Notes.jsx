'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  FileText, 
  Download, 
  Copy, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft,
  Bookmark,
  Trash2
} from 'lucide-react';
import { containerVariants, itemVariants, pageTransition } from '@/lib/animations';
import aiNotesGenerator from '@/lib/aiNotesGenerator';
import { createNote, deleteNote, getNotes } from '@/lib/notesApi';

const GENERATED_NOTE_GUARD_KEY = 'intellilearn_last_generated_note_guard';

export default function NotesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { generatedTopic, generatedNotesContent, fromChatSessionId } = location.state || {};
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [notesLibrary, setNotesLibrary] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const generateTimeoutRef = useRef(null);

  const selectedNote = notesLibrary.find((note) => note.id === selectedNoteId) || null;
  const groupedNotes = notesLibrary.reduce((acc, note) => {
    const createdTimestamp = Number(note.createdAt) || Date.now();
    const date = new Date(createdTimestamp);
    const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(note);
    return acc;
  }, {});
  const sortedDateKeys = Object.keys(groupedNotes)
    .map((key) => Number(key))
    .sort((a, b) => b - a);

  const getDateGroupLabel = (dateKey) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((startOfToday.getTime() - dateKey) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return new Date(dateKey).toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatNoteDateTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const deriveTitleFromMarkdown = (markdown = '', fallback = 'Study Notes') => {
    const lines = String(markdown)
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      const cleaned = line
        .replace(/^#{1,6}\s+/, '')
        .replace(/^\*+\s*/, '')
        .replace(/\*+$/g, '')
        .replace(/^[-•]\s+/, '')
        .trim();
      if (cleaned.length >= 6) {
        return cleaned.slice(0, 90);
      }
    }

    return fallback;
  };

  const markdownToPdfText = (markdown = '') => {
    return String(markdown)
      .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, '').trim())
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '- ')
      .replace(/^\s*\d+\.\s+/gm, (m) => m.trim() + ' ')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const addNoteToLibrary = (note, openAfterCreate = true) => {
    setNotesLibrary((prev) => [note, ...prev]);
    if (openAfterCreate) setSelectedNoteId(note.id);
  };

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const response = await getNotes(1, 100);
        const serverNotes = (response?.notes || []).map((note) => ({
          ...note,
          date: note?.generatedAt ? new Date(note.generatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
          createdAt: note?.generatedAt ? new Date(note.generatedAt).getTime() : Date.now(),
          source: 'server',
        }));
        setNotesLibrary(serverNotes);
      } catch (error) {
        console.error('Failed to load notes from server:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadNotes();
  }, []);

  useEffect(() => {
    const persistChatGeneratedNote = async () => {
      if (!generatedNotesContent) return;
      setIsGenerating(true);

      const topic = generatedTopic || 'Tutor Conversation';
      const title = deriveTitleFromMarkdown(
        generatedNotesContent,
        generatedTopic ? `Chat Summary Notes: ${generatedTopic}` : 'Chat Summary Notes',
      );
      const payload = {
        title,
        content: generatedNotesContent,
        category: 'general',
        type: 'detailed',
        tags: ['AI-Generated', 'From Chat', topic],
        topic,
        bookmarked: false,
      };

      const guardValue = `${topic}::${(generatedNotesContent || '').slice(0, 160)}`;
      try {
        const lastGuard = sessionStorage.getItem(GENERATED_NOTE_GUARD_KEY);
        if (lastGuard === guardValue) {
          setIsGenerating(false);
          return;
        }
        sessionStorage.setItem(GENERATED_NOTE_GUARD_KEY, guardValue);
      } catch {
        // ignore storage errors; continue flow
      }

      try {
        const created = await createNote(payload);
        addNoteToLibrary(
          {
            ...created,
            date: created?.generatedAt ? new Date(created.generatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
            createdAt: created?.generatedAt ? new Date(created.generatedAt).getTime() : Date.now(),
            source: fromChatSessionId ? 'chat' : 'manual',
          },
          true,
        );
        navigate('/dashboard/student/notes', { replace: true, state: {} });
      } catch (error) {
        console.error('Failed to save chat note to server:', error);
        const fallbackNote = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title,
          date: new Date().toLocaleDateString(),
          createdAt: Date.now(),
          content: generatedNotesContent,
          tags: ['AI-Generated', 'From Chat', topic],
          type: 'detailed',
          category: 'general',
          source: fromChatSessionId ? 'chat' : 'manual',
        };
        addNoteToLibrary(fallbackNote, true);
      } finally {
        setIsGenerating(false);
      }
    };

    if (generatedNotesContent) {
      persistChatGeneratedNote();
      return;
    }

    if (generatedTopic) {
      generateNotes(generatedTopic);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedTopic, generatedNotesContent, fromChatSessionId]);

  const generateNotes = (topic) => {
    setIsGenerating(true);
    
    // Simulate AI generation delay while using the intelligent generator
    generateTimeoutRef.current = setTimeout(async () => {
      try {
        const generatedNotes = aiNotesGenerator.generateNotes(topic);
        const payload = {
          title: generatedNotes.title,
          content: generatedNotes.content,
          category: generatedNotes.category || 'general',
          type: generatedNotes.type || 'simple',
          tags: ['AI-Generated', 'Academic', generatedNotes.category || 'general', topic],
          topic,
          bookmarked: false,
        };

        const created = await createNote(payload);
        addNoteToLibrary(
          {
            ...created,
            date: created?.generatedAt ? new Date(created.generatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
            createdAt: created?.generatedAt ? new Date(created.generatedAt).getTime() : Date.now(),
            source: 'manual',
          },
          true,
        );
      } catch (error) {
        console.error('Error generating notes:', error);
        // Fallback to basic notes if generation fails
        const fallbackNote = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: `Study Notes: ${topic}`,
          date: new Date().toLocaleDateString(),
          createdAt: Date.now(),
          content: `# Study Notes: ${topic}

## Overview
${topic} is an important concept that forms the foundation for understanding related subjects.

## Key Points
- Main concept and definition
- Important details and applications
- Examples and relevance

## Summary
Understanding ${topic} is essential for academic success and practical application.
`,
          tags: ['AI-Generated', 'Academic', topic],
          source: 'manual',
        };
        addNoteToLibrary(fallbackNote, true);
      }
      setIsGenerating(false);
    }, 2000);
  };

  useEffect(() => () => {
    if (generateTimeoutRef.current) {
      clearTimeout(generateTimeoutRef.current);
    }
  }, []);

  const handleCopy = () => {
    if (!selectedNote?.content) return;
    navigator.clipboard.writeText(selectedNote.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedNote?.content) return;
    const safeTitle = (selectedNote.title || 'notes')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80) || 'notes';

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxTextWidth = pageWidth - margin * 2;

    let y = margin;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    const titleLines = pdf.splitTextToSize(selectedNote.title || 'Study Notes', maxTextWidth);
    pdf.text(titleLines, margin, y);
    y += titleLines.length * 20 + 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const meta = `Generated: ${selectedNote.date || new Date().toLocaleDateString()}`;
    pdf.text(meta, margin, y);
    y += 18;

    pdf.setDrawColor(180);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 16;

    pdf.setFontSize(11);
    const plainTextContent = markdownToPdfText(selectedNote.content);
    const contentLines = pdf.splitTextToSize(plainTextContent, maxTextWidth);

    contentLines.forEach((line) => {
      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += 15;
    });

    pdf.save(`${safeTitle}.pdf`);
  };

  const openDeleteConfirmation = (note) => {
    if (!note?.id) return;
    setDeleteTarget(note);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteNote(deleteTarget.id);
      setNotesLibrary((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      if (selectedNoteId === deleteTarget.id) {
        setSelectedNoteId(null);
      }
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-purple-400" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">AI Notes Generator is working...</h2>
          <p className="text-slate-400">Analyzing topic complexity and creating structured study materials.</p>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading your notes...</p>
      </div>
    );
  }

  if (!notesLibrary.length) {
    return (
      <div className="text-center py-20 space-y-6">
        <div className="p-6 rounded-full bg-slate-900 w-fit mx-auto">
          <FileText className="w-12 h-12 text-slate-700" />
        </div>
        <h3 className="text-2xl font-bold text-slate-300">No notes to display</h3>
        <button 
          onClick={() => navigate('/dashboard/student')}
          className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!selectedNote) {
    return (
      <motion.div
        variants={pageTransition}
        initial="initial"
        animate="animate"
        className="max-w-6xl mx-auto py-8 px-1"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <h2 className="text-2xl font-bold text-white">Your Notes Library</h2>
          <p className="text-slate-400 text-sm mt-1">
            Sare generated notes cards me save hain. Kisi bhi card pe click karo aur full notes open kar lo.
          </p>
        </motion.div>

        {sortedDateKeys.map((dateKey) => (
          <motion.div key={dateKey} variants={containerVariants} className="mb-7">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <h3 className="text-sm font-semibold text-slate-200">{getDateGroupLabel(dateKey)}</h3>
              <span className="text-xs text-slate-400">
                {groupedNotes[dateKey].length} note{groupedNotes[dateKey].length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupedNotes[dateKey].map((note) => (
                <motion.button
                  key={note.id}
                  variants={itemVariants}
                  onClick={() => setSelectedNoteId(note.id)}
                  className="group text-left rounded-2xl border border-slate-700/60 bg-gradient-to-br from-[#0f173d] to-[#0b1231] hover:from-[#15204d] hover:to-[#101a42] transition p-5 shadow-xl hover:shadow-blue-900/20 hover:border-blue-400/40"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex items-center gap-2 text-xs text-slate-300">
                      <Bookmark className="w-3.5 h-3.5" />
                      {note.source === 'chat' ? 'From AI Tutor' : 'Generated Note'}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {formatNoteDateTime(note.generatedAt || note.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white line-clamp-2 mb-2 group-hover:text-blue-100">
                    {note.title}
                  </h3>
                  <p className="text-sm text-slate-300 line-clamp-4 mb-4">
                    {(note.content || '').replace(/[#*`>-]/g, '').trim()}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {(note.tags || []).slice(0, 3).map((tag) => (
                      <span
                        key={`${note.id}-${tag}`}
                        className="text-[11px] rounded-full border border-white/10 px-2 py-0.5 text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto py-8"
    >
      <motion.button
        variants={itemVariants}
        onClick={() => setSelectedNoteId(null)}
        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to notes cards
      </motion.button>

      {/* Content Card */}
      <motion.div
        variants={containerVariants}
        className="bg-[#0d1333] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="text-xs text-slate-400">
            {selectedNote.source === 'chat' ? 'Generated from AI Tutor conversation' : 'Generated notes'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openDeleteConfirmation(selectedNote)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 transition"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        </div>

        {/* Notes Body */}
        <div className="p-8 md:p-12 prose prose-invert max-w-none">
          <div className="text-slate-300 leading-relaxed font-medium">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold text-white mt-6 mb-3">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold text-white mt-5 mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="mb-3 text-slate-300">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-slate-300">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                code: ({ children }) => (
                  <code className="rounded bg-slate-900/80 px-1.5 py-0.5 text-sky-300">{children}</code>
                ),
              }}
            >
              {selectedNote.content || ''}
            </ReactMarkdown>
          </div>
        </div>

        </motion.div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1333] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Delete note?</h3>
            <p className="mt-2 text-sm text-slate-300">
              This will permanently remove <span className="font-semibold text-white">{deleteTarget.title || 'this note'}</span>.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/30 transition disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
