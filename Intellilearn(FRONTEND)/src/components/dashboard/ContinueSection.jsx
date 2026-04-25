'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { containerVariants, itemVariants } from '@/lib/animations';

export default function ContinueSection() {
  const items = [
    {
      id: '1',
      title: 'Advanced Calculus - Integration',
      subject: 'Mathematics',
      progress: 65,
      timeLeft: '15 min',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: '2',
      title: 'World War II History',
      subject: 'History',
      progress: 42,
      timeLeft: '20 min',
      color: 'from-purple-500 to-pink-600',
    },
    {
      id: '3',
      title: 'Photosynthesis Process',
      subject: 'Biology',
      progress: 78,
      timeLeft: '10 min',
      color: 'from-green-500 to-emerald-600',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          Continue Learning
        </h2>
        <Link to="/dashboard/student/modules" className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            className="group p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition-all cursor-pointer"
            whileHover={{ x: 4 }}
          >
            <div className="flex items-start gap-4">
              {/* Left */}
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all`}>
                <Play className="w-5 h-5 text-white fill-white" />
              </div>

              {/* Center */}
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-100 group-hover:text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{item.subject}</p>

                {/* Progress Bar */}
                <div className="mt-3 w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${item.color}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{item.progress}% Complete</p>
              </div>

              {/* Right */}
              <div className="text-right flex flex-col items-end">
                <Clock className="w-4 h-4 text-slate-400 mb-1" />
                <p className="text-xs font-medium text-slate-300">{item.timeLeft}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
