'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, BookOpen, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { containerVariants, itemVariants } from '@/lib/animations';

export default function RecommendationsPanel() {
  const recommendations = [
    {
      id: '1',
      title: 'Quantum Mechanics',
      reason: 'Based on your interest in Physics',
      difficulty: 'Expert',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: '2',
      title: 'Multivariable Calculus',
      reason: 'Next step in your math path',
      difficulty: 'Advanced',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: '3',
      title: 'Data Structures & Algorithms',
      reason: 'Essential for CS students',
      difficulty: 'Advanced',
      icon: <BookOpen className="w-5 h-5" />,
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-6 h-fit sticky top-24"
    >
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-5 h-5 text-yellow-400" />
        <h2 className="text-lg font-bold text-slate-100">Recommended for You</h2>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => (
          <motion.div
            key={rec.id}
            variants={itemVariants}
            whileHover={{ x: 4 }}
            className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg group-hover:shadow-yellow-500/50 transition-all">
                {rec.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-white">{rec.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{rec.reason}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-300">{rec.difficulty}</span>
                  <Star className="w-3 h-3 text-yellow-400" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Link to="/dashboard/student/modules" className="mt-4 w-full inline-block">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium transition-all"
        >
          Explore All Topics
        </motion.button>
      </Link>
    </motion.div>
  );
}
