'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, BarChart3, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { containerVariants, itemVariants } from '@/lib/animations';

export default function QuizStart({ onSelectQuiz }) {
  const quizzes = [
    {
      id: '1',
      title: 'Multivariable Calculus',
      subject: 'Mathematics',
      questions: 20,
      duration: 45,
      difficulty: 'advanced',
      yourScore: 85,
      bestScore: 92,
    },
    {
      id: '2',
      title: 'Quantum Entanglement',
      subject: 'Physics',
      questions: 15,
      duration: 40,
      difficulty: 'expert',
      yourScore: 72,
      bestScore: 88,
    },
    {
      id: '3',
      title: 'Organic Synthesis',
      subject: 'Chemistry',
      questions: 25,
      duration: 50,
      difficulty: 'advanced',
      yourScore: 78,
      bestScore: 95,
    },
    {
      id: '4',
      title: 'Operating Systems',
      subject: 'Computer Science',
      questions: 30,
      duration: 60,
      difficulty: 'advanced',
    },
    {
      id: '5',
      title: 'Molecular Genetics',
      subject: 'Biology',
      questions: 18,
      duration: 35,
      difficulty: 'expert',
      yourScore: 81,
      bestScore: 89,
    },
    {
      id: '6',
      title: 'Critical Theory',
      subject: 'English',
      questions: 22,
      duration: 40,
      difficulty: 'advanced',
    },
  ];


  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'from-green-500 to-emerald-600';
      case 'intermediate':
        return 'from-orange-500 to-amber-600';
      case 'advanced':
        return 'from-red-500 to-pink-600';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-slate-100 mb-2">Quiz Hub</h1>
        <p className="text-slate-400">Test your knowledge and track your progress</p>
      </motion.div>

      {/* Quiz Grid */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {quizzes.map((quiz) => (
          <motion.div
            key={quiz.id}
            variants={itemVariants}
            className="group p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 flex flex-col"
            whileHover={{ y: -4 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-white">{quiz.title}</h3>
                <p className="text-sm text-slate-400 mt-1">{quiz.subject}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getDifficultyColor(quiz.difficulty)}`}>
                {quiz.difficulty}
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2 mb-4 flex-1">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <BarChart3 className="w-4 h-4" />
                <span>{quiz.questions} Questions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                <span>{quiz.duration} Minutes</span>
              </div>

              {/* Scores */}
              {quiz.yourScore && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 mt-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-slate-400">Your Score</span>
                    <span className="text-sm font-bold text-blue-400">{quiz.yourScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Best Score</span>
                    <span className="text-sm font-bold text-green-400">{quiz.bestScore}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectQuiz(quiz.id)}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Play className="w-4 h-4" />
              Start Quiz
            </motion.button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
