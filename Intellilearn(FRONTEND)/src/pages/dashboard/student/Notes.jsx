'use client';

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Share2, 
  Copy, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft,
  Loader2,
  Bookmark,
  Printer
} from 'lucide-react';
import { containerVariants, itemVariants, pageTransition } from '@/lib/animations';
import aiNotesGenerator from '@/lib/aiNotesGenerator';

export default function NotesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { generatedTopic, type } = location.state || {};
  
  const [isGenerating, setIsGenerating] = useState(!generatedTopic);
  const [notes, setNotes] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (generatedTopic) {
      generateNotes(generatedTopic);
    } else {
      // Fallback or redirect if no topic
      setIsGenerating(false);
    }
  }, [generatedTopic]);

  const generateNotes = (topic) => {
    setIsGenerating(true);
    
    // Simulate AI generation delay while using the intelligent generator
    setTimeout(() => {
      try {
        const generatedNotes = aiNotesGenerator.generateNotes(topic);
        setNotes({
          title: generatedNotes.title,
          date: new Date().toLocaleDateString(),
          content: generatedNotes.content,
          tags: ['AI-Generated', 'Academic', generatedNotes.category, topic],
          type: generatedNotes.type,
          category: generatedNotes.category
        });
      } catch (error) {
        console.error('Error generating notes:', error);
        // Fallback to basic notes if generation fails
        setNotes({
          title: `Study Notes: ${topic}`,
          date: new Date().toLocaleDateString(),
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
          tags: ['AI-Generated', 'Academic', topic]
        });
      }
      setIsGenerating(false);
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(notes?.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (!notes) {
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

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto py-8"
    >

      {/* Content Card */}
      <motion.div
        variants={containerVariants}
        className="bg-[#0d1333] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >

        {/* Notes Body */}
        <div className="p-8 md:p-12 prose prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-slate-300 leading-relaxed font-medium">
            {notes.content}
          </div>
        </div>

        </motion.div>
    </motion.div>
  );
}
