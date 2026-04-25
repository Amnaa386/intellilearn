'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function QuizResults({ score, totalQuestions, onBack }) {
  const getScoreMessage = (score) => {
    if (score >= 90) return "Outstanding! You&apos;re a master of this topic!";
    if (score >= 80) return "Excellent work! Keep practicing to maintain this level.";
    if (score >= 70) return "Good job! You&apos;re understanding the material well.";
    if (score >= 60) return "You&apos;re on the right track! Review the weak areas.";
    return "Keep practicing! You&apos;ll improve with more study.";
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 80) return 'from-blue-500 to-cyan-600';
    if (score >= 70) return 'from-orange-500 to-amber-600';
    return 'from-red-500 to-pink-600';
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Results Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="p-8 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 text-center mb-6"
      >
        {/* Trophy Animation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex justify-center"
          >
            <Trophy className="w-16 h-16 text-yellow-400" />
          </motion.div>
        </motion.div>

        {/* Score Circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
          className={`w-40 h-40 rounded-full mx-auto mb-6 bg-gradient-to-br ${getScoreColor(score)} flex flex-col items-center justify-center`}
        >
          <div className="text-6xl font-bold text-white">{score}%</div>
          <div className="text-sm text-white/80">Score</div>
        </motion.div>

        {/* Message */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-slate-100 mb-4"
        >
          {getScoreMessage(score)}
        </motion.h2>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-2 text-slate-400 mb-6"
        >
          <p>You answered {Math.round((score / 100) * totalQuestions)} out of {totalQuestions} questions correctly.</p>
          <p>Keep practicing to improve your score!</p>
        </motion.div>
      </motion.div>

      {/* Results Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >
        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
          <p className="text-sm text-slate-400 mb-2">Correct Answers</p>
          <p className="text-2xl font-bold text-green-400">{Math.round((score / 100) * totalQuestions)}/{totalQuestions}</p>
        </div>
        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
          <p className="text-sm text-slate-400 mb-2">Time Taken</p>
          <p className="text-2xl font-bold text-blue-400">~25 min</p>
        </div>
        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
          <p className="text-sm text-slate-400 mb-2">Accuracy</p>
          <p className="text-2xl font-bold text-purple-400">{score}%</p>
        </div>
      </motion.div>

      {/* Recommendations */}
      {score < 80 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-6"
        >
          <p className="text-sm text-blue-300">
            💡 <strong>Recommendation:</strong> Review the topics you found challenging and take the quiz again to improve your score!
          </p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex gap-3 flex-col sm:flex-row"
      >
        <Button
          onClick={onBack}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-800/50 flex-1"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Retake Quiz
        </Button>
        <Link to="/dashboard/student/tutor" className="flex-1">
          <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            <TrendingUp className="w-4 h-4 mr-2" />
            Review with AI Tutor
          </Button>
        </Link>
        <Link to="/dashboard/student" className="flex-1">
          <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
