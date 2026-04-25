'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Zap, BarChart3 } from 'lucide-react';

export default function FloatingCards() {
  const cards = [
    {
      icon: BookOpen,
      title: 'Smart Learning',
      description: 'Adaptive content based on your pace',
      delay: 0,
    },
    {
      icon: Zap,
      title: 'AI Tutor',
      description: 'Available 24/7 for instant help',
      delay: 0.2,
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking',
      description: 'Real-time insights on your growth',
      delay: 0.4,
    },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={idx}
            className="absolute hidden lg:block"
            initial={{ x: Math.random() * 400 - 200, y: Math.random() * 400 - 200, opacity: 0 }}
            animate={{
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 8 + card.delay,
              repeat: Infinity,
              delay: card.delay,
            }}
            style={{
              left: `${20 + idx * 30}%`,
              top: `${10 + idx * 20}%`,
            }}
          >
            <motion.div
              className="w-64 p-4 rounded-xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/30 backdrop-blur-sm hover:border-blue-500/50 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">{card.title}</h3>
              <p className="text-xs text-slate-400">{card.description}</p>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
