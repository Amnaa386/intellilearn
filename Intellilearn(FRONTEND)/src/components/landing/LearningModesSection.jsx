import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Headphones, Layout, PlayCircle, ArrowRight, Loader2 } from 'lucide-react';

const modes = [
  {
    id: 'text',
    title: 'AI Text Explanation',
    desc: 'Deep, contextual breakdowns that simplify complex topics into clear insights.',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    id: 'voice',
    title: 'Voice Learning',
    desc: 'AI-generated audio lectures tailored for on-the-go and auditory learners.',
    icon: <Headphones className="w-6 h-6" />,
    color: 'from-purple-500/20 to-blue-500/20'
  },
  {
    id: 'ppt',
    title: 'PPT Generation',
    desc: 'Instantly create slides with an AI robot teacher that presents interactively.',
    icon: <Layout className="w-6 h-6" />,
    color: 'from-indigo-500/20 to-purple-500/20'
  },
  {
    id: 'video',
    title: 'Video Lectures',
    desc: 'Engaging animated video lectures featuring a friendly AI robot teacher.',
    icon: <PlayCircle className="w-6 h-6" />,
    color: 'from-blue-600/20 to-indigo-600/20'
  }
];

export default function LearningModesSection() {
  const navigate = useNavigate();
  const [loadingMode, setLoadingMode] = useState(null);

  const handleTryMode = (modeId) => {
    setLoadingMode(modeId);
    setTimeout(() => {
      navigate(`/learning-modes/${modeId}`);
    }, 800);
  };

  return (
    <section id="learning-modes" className="py-32 px-6 relative overflow-hidden bg-[#0a0f2c]">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            className="text-3xl md:text-5xl font-black mb-6 text-white tracking-tight"
          >
            Unified Learning Ecosystem
          </motion.h2>
          <div className="w-16 h-1.5 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full mb-8" />
          <p className="text-slate-400 text-sm md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Experience a seamless transition between various learning formats. 
            Master any subject through our integrated AI-driven educational suite.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {modes.map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ 
                y: -10, 
                transition: { duration: 0.3 } 
              }}
              className="group relative p-10 rounded-[2.5rem] bg-[#0d1333] border border-white/10 backdrop-blur-xl hover:border-purple-500/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] transition-all duration-500 flex flex-col h-full"
            >
              {/* Icon Container with Gradient Background */}
              <div className={`mb-8 p-5 rounded-2xl bg-gradient-to-br ${mode.color} w-fit group-hover:scale-110 transition-transform duration-500 border border-white/5 shadow-inner`}>
                <div className="text-white drop-shadow-md">
                  {mode.icon}
                </div>
              </div>

              <h3 className="text-xl font-black mb-4 text-white group-hover:text-purple-400 transition-colors tracking-tight">
                {mode.title}
              </h3>
              
              <p className="text-slate-400 leading-relaxed text-[15px] font-medium flex-grow mb-8">
                {mode.desc}
              </p>

              <motion.button 
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTryMode(mode.id)}
                disabled={loadingMode !== null}
                className="flex items-center gap-2 text-xs font-black text-purple-400 hover:text-purple-300 transition-all uppercase tracking-[0.2em] group/btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative flex items-center gap-2">
                  <AnimatePresence mode="wait">
                    {loadingMode === mode.id ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Activating...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="normal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Try this Mode
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-purple-400 group-hover/btn:w-full transition-all duration-300"></span>
                </span>
                {loadingMode !== mode.id && <ArrowRight className="w-4 h-4" />}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}




