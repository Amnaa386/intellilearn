import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaRobot, FaSearch } from 'react-icons/fa';
import { ArrowRight, Sparkles, MessageSquare, Headphones, PlayCircle, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState('text');
  const [topic, setTopic] = useState('');

  const handleStartLearning = (e) => {
    e.preventDefault();
    const targetPath = '/auth/register';
    navigate(targetPath, { state: { initialTopic: topic, initialMode: activeMode } });
  };

  const modes = [
    { id: 'text', label: 'Text Explanation', icon: MessageSquare, color: 'text-blue-400' },
    { id: 'voice', label: 'Voice Lecture', icon: Headphones, color: 'text-purple-400' },
    { id: 'video', label: 'Animated Video Lecture', icon: PlayCircle, color: 'text-pink-400' },
  ];

  const modeVisuals = {
    text: {
      cardGlow: 'from-blue-500/10 to-indigo-500/10',
      robotOrb: 'from-purple-500/20 to-blue-500/20',
      robotIcon: 'text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]',
      labelStyle: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
      screenTitle: 'Generating Text Summary',
      bars: ['w-[80%] bg-purple-500/40', 'w-[60%] bg-blue-500/40', 'w-[90%] bg-slate-700'],
      panelIcon: Sparkles,
      panelIconStyle: 'text-purple-400/60',
    },
    voice: {
      cardGlow: 'from-violet-500/10 to-cyan-500/10',
      robotOrb: 'from-violet-500/20 to-cyan-500/20',
      robotIcon: 'text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.45)]',
      labelStyle: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
      screenTitle: 'Synthesizing Voice Guide',
      bars: ['w-[70%] bg-cyan-500/50', 'w-[45%] bg-violet-500/45', 'w-[85%] bg-slate-700'],
      panelIcon: Headphones,
      panelIconStyle: 'text-cyan-300/60',
    },
    video: {
      cardGlow: 'from-pink-500/10 to-indigo-500/10',
      robotOrb: 'from-pink-500/20 to-indigo-500/20',
      robotIcon: 'text-pink-300 drop-shadow-[0_0_15px_rgba(244,114,182,0.45)]',
      labelStyle: 'bg-pink-500/20 border-pink-500/30 text-pink-300',
      screenTitle: 'Preparing Animated Presentation',
      bars: ['w-[85%] bg-pink-500/45', 'w-[58%] bg-indigo-500/45', 'w-[92%] bg-slate-700'],
      panelIcon: PlayCircle,
      panelIconStyle: 'text-pink-300/60',
    },
  };

  const currentVisual = modeVisuals[activeMode];
  const CurrentPanelIcon = currentVisual.panelIcon;

  return (
    <section className="relative min-h-[95vh] flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden bg-[#0a0f2c]">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-black mb-8 leading-[1.05] tracking-tight text-white"
        >
          Your AI Tutor <br />
          <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-2xl">
            for Any Topic
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
        >
          Type any subject or topic and get instant explanation in <br className="hidden md:block" />
          Text, Voice, or Animated Video with AI Robot.
        </motion.p>

        {/* ChatGPT Style Search Box */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          onSubmit={handleStartLearning}
          className="w-full max-w-3xl relative group mb-10"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-[#0d1333] border border-white/10 rounded-2xl p-2 shadow-2xl">
            <div className="flex-grow flex items-center px-4">
              <FaSearch className="text-slate-500 mr-3" />
              <input 
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter any topic you want to learn… (e.g. Quantum Physics, World War II, Python Loops)"
                className="w-full bg-transparent border-none text-white focus:ring-0 placeholder:text-slate-600 py-4 text-lg"
              />
            </div>
            <button 
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl transition-all shadow-lg group-hover:scale-105 active:scale-95"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </motion.form>

        {/* Mode Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-20"
        >
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300 ${
                activeMode === mode.id 
                ? 'bg-white/10 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                : 'bg-white/5 border-white/5 hover:border-white/20'
              }`}
            >
              <mode.icon className={`w-5 h-5 ${activeMode === mode.id ? mode.color : 'text-slate-500'}`} />
              <span className={`text-sm font-bold tracking-wide ${activeMode === mode.id ? 'text-white' : 'text-slate-500'}`}>
                {mode.label}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Visual Content Area - Robot Tutor */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className={`w-full max-w-5xl relative aspect-video md:aspect-[21/9] rounded-[2rem] overflow-hidden border border-white/10 bg-slate-950/50 backdrop-blur-xl shadow-2xl bg-gradient-to-br ${currentVisual.cardGlow}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center p-8 gap-12"
            >
              {/* Robot Teacher */}
              <div className="relative w-1/3 flex flex-col items-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <div className={`w-40 h-40 rounded-full bg-gradient-to-br ${currentVisual.robotOrb} flex items-center justify-center border border-white/10 backdrop-blur-md`}>
                    <FaRobot className={`w-20 h-20 ${currentVisual.robotIcon}`} />
                  </div>
                  <div className="absolute -bottom-2 w-full h-4 bg-black/40 rounded-[100%] blur-md" />
                </motion.div>
                <div className="mt-6 text-center">
                  <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${currentVisual.labelStyle}`}>AI Instructor</span>
                  <p className="text-white font-bold mt-2 text-lg">Intelli</p>
                </div>
              </div>

              {/* Dynamic Feedback Screen */}
              <div className="flex-grow h-full bg-[#0d1333] rounded-2xl border border-white/10 p-6 flex flex-col shadow-inner">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                  <Monitor className="w-4 h-4 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {currentVisual.screenTitle}
                  </span>
                </div>
                <div className="flex-grow flex flex-col justify-center gap-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: currentVisual.bars[0].match(/w-\[(.*?)\]/)?.[1] || '80%' }}
                    className={`h-2 rounded-full ${currentVisual.bars[0]}`}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: currentVisual.bars[1].match(/w-\[(.*?)\]/)?.[1] || '60%' }}
                    transition={{ delay: 0.2 }}
                    className={`h-2 rounded-full ${currentVisual.bars[1]}`}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: currentVisual.bars[2].match(/w-\[(.*?)\]/)?.[1] || '90%' }}
                    transition={{ delay: 0.4 }}
                    className={`h-2 rounded-full ${currentVisual.bars[2]}`}
                  />
                  <div className="mt-8 flex justify-center">
                    <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                      <CurrentPanelIcon className={`w-8 h-8 ${currentVisual.panelIconStyle}`} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}





