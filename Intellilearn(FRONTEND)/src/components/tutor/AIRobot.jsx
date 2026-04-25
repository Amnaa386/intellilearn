'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Brain, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function AIRobot() {
  const navigate = useNavigate();

  const handleStartLearning = () => {
    // Navigate to the main dashboard where users can start learning
    navigate('/dashboard/student');
  };

  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 flex flex-col items-center text-center h-full">
      {/* Robot Animation */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="relative w-32 h-32 mb-6"
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 blur-xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Main robot container */}
        <motion.div
          className="relative w-full h-full rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-purple-500/50 flex items-center justify-center shadow-2xl shadow-purple-500/30"
          whileHover={{ scale: 1.1 }}
        >
          {/* Inner circles */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 rounded-full border-2 border-blue-500/30"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-6 rounded-full border-2 border-purple-500/30"
          />

          {/* Icon */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Cpu className="w-12 h-12 text-blue-400 relative z-10" />
          </motion.div>
        </motion.div>

        {/* Floating particles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-purple-500"
            animate={{
              x: [0, Math.cos((i / 3) * Math.PI * 2) * 40, 0],
              y: [0, Math.sin((i / 3) * Math.PI * 2) * 40, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: (i / 3) * 1,
            }}
          />
        ))}
      </motion.div>

      {/* Status */}
      <h2 className="text-lg font-bold text-slate-100 mb-2">Your AI Tutor</h2>
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <p className="text-sm text-slate-400">Ready to help</p>
      </div>

      {/* Features */}
      <div className="space-y-3 mb-6 w-full">
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-left">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-semibold text-slate-300">Smart Explanation</p>
          </div>
          <p className="text-xs text-slate-400">Personalized learning style</p>
        </div>

        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-left">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-purple-400" />
            <p className="text-xs font-semibold text-slate-300">Quick Answers</p>
          </div>
          <p className="text-xs text-slate-400">Get help instantly</p>
        </div>

        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-left">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="w-4 h-4 text-cyan-400" />
            <p className="text-xs font-semibold text-slate-300">Chat Anytime</p>
          </div>
          <p className="text-xs text-slate-400">24/7 availability</p>
        </div>
      </div>

      {/* CTA */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button 
          onClick={handleStartLearning}
          className="w-full bg-gradient-to-r from-purple-500 to-cyan-600 hover:from-purple-600 hover:to-cyan-700 text-sm cursor-pointer"
        >
          Start Learning
        </Button>
      </motion.div>
    </div>
  );
}
