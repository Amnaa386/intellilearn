'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Headphones, 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Sparkles, 
  ArrowLeft,
  Loader2,
  Mic,
  MessageSquare,
  History
} from 'lucide-react';
import { containerVariants, itemVariants, pageTransition } from '@/lib/animations';

export default function VoiceLessonPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { generatedTopic } = location.state || {};
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(!generatedTopic);
  const [lesson, setLesson] = useState(null);

  useEffect(() => {
    if (generatedTopic) {
      generateVoiceLesson(generatedTopic);
    } else {
      setIsGenerating(false);
    }
  }, [generatedTopic]);

  const generateVoiceLesson = (topic) => {
    setIsGenerating(true);
    setTimeout(() => {
      setLesson({
        title: topic,
        duration: '12:45',
        speaker: 'Dr. Intelli (AI Academic)',
        transcript: [
          { time: '0:00', text: `Welcome to this AI-powered voice lecture on ${topic}.` },
          { time: '0:15', text: 'Today, we will delve into the core concepts and historical developments.' },
          { time: '1:30', text: 'One of the most critical aspects of this field is the integration of modern methodologies.' },
          { time: '3:45', text: 'As we look at the data, we can see a clear trend towards digital transformation.' },
          { time: '6:00', text: 'Let\'s pause and consider the ethical implications of these advancements.' }
        ]
      });
      setIsGenerating(false);
    }, 3000);
  };

  useEffect(() => {
    let interval;
    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.1, 100));
      }, 100);
    } else if (progress >= 100) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  if (isGenerating) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
          <Headphones className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-orange-400" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Synthesizing Voice Lesson...</h2>
          <p className="text-slate-400">Dr. Intelli is preparing a personalized audio lecture for you.</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-20 space-y-6">
        <div className="p-6 rounded-full bg-slate-900 w-fit mx-auto">
          <Headphones className="w-12 h-12 text-slate-700" />
        </div>
        <h3 className="text-2xl font-bold text-slate-300">No lesson found</h3>
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
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
            <History className="w-5 h-5" />
          </button>
          <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Player Card */}
      <motion.div
        variants={containerVariants}
        className="bg-[#0d1333] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden p-8 md:p-12 relative"
      >
        <div className="absolute top-0 right-0 p-8">
           <div className="px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">AI Masterclass</span>
           </div>
        </div>

        <div className="flex flex-col items-center text-center space-y-8">
          {/* Visualizer Effect */}
          <div className="flex items-end gap-1 h-32">
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  height: isPlaying ? [20, Math.random() * 80 + 20, 20] : 20
                }}
                transition={{ 
                  duration: 0.5, 
                  repeat: Infinity, 
                  delay: i * 0.05 
                }}
                className={`w-1.5 rounded-full bg-gradient-to-t ${i % 2 === 0 ? 'from-orange-500 to-red-500' : 'from-blue-500 to-purple-500'}`}
              />
            ))}
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">{lesson.title}</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{lesson.speaker}</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-3">
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                className="h-full bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              <span>{(progress * 12.75 / 100).toFixed(2).replace('.', ':')}</span>
              <span>{lesson.duration}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-8 md:gap-12">
            <button className="p-4 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all">
              <RotateCcw className="w-6 h-6" />
            </button>
            <button className="p-4 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all">
              <SkipBack className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shadow-2xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
            <button className="p-4 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all">
              <SkipForward className="w-6 h-6" />
            </button>
            <button className="p-4 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all">
              <Mic className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Transcript Card */}
      <motion.div
        variants={itemVariants}
        className="bg-[#0d1333] border border-white/10 rounded-[2.5rem] p-8 shadow-xl space-y-6"
      >
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-bold">Interactive Transcript</h3>
        </div>
        <div className="space-y-4 max-h-60 overflow-y-auto pr-4 scrollbar-hide">
          {lesson.transcript.map((line, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group cursor-pointer">
              <span className="text-slate-600 font-black text-[10px] mt-1">{line.time}</span>
              <p className="text-slate-400 text-sm group-hover:text-slate-200 transition-colors">{line.text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
