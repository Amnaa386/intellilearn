'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { containerVariants, itemVariants } from '@/lib/animations';

export default function WeakAreasHighlight() {
  const weakAreas = [
    {
      id: '1',
      topic: 'Electromagnetism',
      proficiency: 45,
      recommendedTime: '45 min/day',
      difficulty: 'hard',
    },
    {
      id: '2',
      topic: 'Multivariable Calculus',
      proficiency: 58,
      recommendedTime: '30 min/day',
      difficulty: 'hard',
    },
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'from-green-500 to-emerald-600';
      case 'medium':
        return 'from-orange-500 to-amber-600';
      case 'hard':
        return 'from-red-500 to-pink-600';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-red-500/20 p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle className="w-5 h-5 text-red-400" />
        <h2 className="text-xl font-bold text-slate-100">Areas to Improve</h2>
      </div>

      <div className="space-y-4">
        {weakAreas.map((area, idx) => (
          <motion.div
            key={area.id}
            variants={itemVariants}
            className="p-4 rounded-lg bg-slate-800/30 border border-red-500/10 hover:border-red-500/30 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-100">{area.topic}</h3>
                <p className="text-xs text-slate-400 mt-1">Proficiency: {area.proficiency}%</p>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium text-white bg-gradient-to-r ${getDifficultyColor(area.difficulty)}`}>
                {area.difficulty.charAt(0).toUpperCase() + area.difficulty.slice(1)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden mb-3">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-pink-600"
                initial={{ width: 0 }}
                whileInView={{ width: `${area.proficiency}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: idx * 0.1 }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">⏱️ {area.recommendedTime}</span>
              <Link to="/dashboard/student/tutor">
                <Button size="sm" variant="ghost" className="h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                  <Zap className="w-3 h-3 mr-1" />
                  Get Help
                </Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
