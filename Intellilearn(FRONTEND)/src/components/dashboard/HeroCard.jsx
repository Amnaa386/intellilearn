'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Book, Zap, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function HeroCard() {
  const [userName, setUserName] = React.useState('Student');

  React.useEffect(() => {
    const storedUser = localStorage.getItem('intellilearn_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.name) setUserName(user.name.split(' ')[0]);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 blur-xl"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-95"></div>

      {/* Animated background elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-40 -right-40 w-80 h-80 border border-blue-500/20 rounded-full"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute -bottom-40 -left-40 w-80 h-80 border border-purple-500/20 rounded-full"
      />

      {/* Content */}
      <div className="relative p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {userName}!
              </span>
            </h1>
            <p className="text-slate-300 text-lg mb-6">
              You&apos;re on track! Keep pushing to reach your learning goals. 🚀
            </p>

            {/* Quick Info */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="text-2xl font-bold text-blue-400">7</div>
                <div className="text-xs text-slate-400">Day Streak</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="text-2xl font-bold text-purple-400">24</div>
                <div className="text-xs text-slate-400">Lessons Done</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="text-2xl font-bold text-cyan-400">92%</div>
                <div className="text-xs text-slate-400">Avg Score</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/dashboard/student/tutor">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full sm:w-auto">
                  <Zap className="w-4 h-4 mr-2" />
                  Ask AI Tutor
                </Button>
              </Link>
              <Link to="/dashboard/student/quiz">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800/50 w-full sm:w-auto">
                  <Calendar className="w-4 h-4 mr-2" />
                  Take Quiz
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right Side - Visual Element */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:flex items-center justify-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="relative w-64 h-64"
            >
              {/* Floating books animation */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-blue-500/30"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-8 rounded-full border-2 border-purple-500/30"
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/50"
                >
                  <Book className="w-10 h-10 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
