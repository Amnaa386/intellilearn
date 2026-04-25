'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Trash2, 
  ChevronRight,
  History,
  Activity
} from 'lucide-react';
import { containerVariants, itemVariants, pageTransition } from '@/lib/animations';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ActivitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activities, setActivities] = useState([
    { id: 1, type: 'quiz', title: 'Multivariable Calculus Quiz', description: 'You scored 85% in the advanced integration module.', time: '2 hours ago', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
    { id: 2, type: 'reminder', title: 'Study Session Reminder', description: 'Upcoming: Quantum Mechanics session in 3 hours.', time: '5 hours ago', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 3, type: 'grade', title: 'Algorithms Assignment Graded', description: 'Your submission for "Dynamic Programming" received an A.', time: '1 day ago', icon: AlertCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 4, type: 'topic', title: 'Topic Completed', description: 'You finished "Electromagnetism" and earned a new badge.', time: '2 days ago', icon: CheckCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 5, type: 'system', title: 'Welcome to IntelliLearn', description: 'Your university-level academic journey has started!', time: '1 week ago', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ]);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || activity.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const deleteActivity = (id) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-5xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <History className="w-8 h-8 text-blue-400" />
            </div>
            Activity History
          </h1>
          <p className="text-slate-400">Track your notifications, completed tasks, and academic milestones.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <Input 
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-700 h-11 w-full sm:w-64 rounded-xl"
            />
          </div>
          <Button variant="outline" className="border-slate-700 text-slate-300 h-11 rounded-xl">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'quiz', 'reminder', 'grade', 'topic'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`
              px-6 py-2.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap
              ${activeFilter === filter 
                ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'}
            `}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <motion.div
                key={activity.id}
                layout
                variants={itemVariants}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0, x: -20 }}
                className="group bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center gap-6 hover:border-blue-500/30 transition-all"
              >
                <div className={`p-4 rounded-2xl ${activity.bg} ${activity.color} h-fit`}>
                  <activity.icon className="w-6 h-6" />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{activity.title}</h3>
                    <span className="text-xs text-slate-500 font-medium whitespace-nowrap ml-4">{activity.time}</span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{activity.description}</p>
                </div>

                <div className="flex items-center gap-2 mt-4 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteActivity(activity.id)}
                    className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="p-6 rounded-full bg-slate-900 mb-6">
                <Activity className="w-12 h-12 text-slate-700" />
              </div>
              <h3 className="text-2xl font-bold text-slate-300 mb-2">No activities found</h3>
              <p className="text-slate-500">Your recent history and notifications will appear here.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
