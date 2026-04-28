'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  ChevronRight,
  History,
  Activity
} from 'lucide-react';
import { containerVariants, itemVariants, pageTransition } from '@/lib/animations';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getUserActivityLogs } from '@/lib/analyticsApi';

function toDateSafe(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatRelativeTime(value) {
  const d = toDateSafe(value);
  if (!d) return 'Unknown time';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  return `${days} days ago`;
}

function mapActionToType(action = '') {
  if (action.startsWith('quiz_')) return 'quiz';
  if (action.startsWith('notes_')) return 'topic';
  return 'system';
}

function mapTypeMeta(type) {
  if (type === 'quiz') return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' };
  if (type === 'reminder') return { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' };
  if (type === 'grade') return { icon: AlertCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' };
  if (type === 'topic') return { icon: CheckCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' };
  return { icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' };
}

function toActivityItem(row) {
  const action = row?.action || 'activity';
  const type = mapActionToType(action);
  const details = row?.details && typeof row.details === 'object' ? row.details : {};
  const meta = mapTypeMeta(type);
  const descriptor = details.topic || details.title || details.source || details.quizId || details.noteId || details.sessionId || '';
  const titleMap = {
    notes_created_manual: 'Notes Created',
    notes_generated: 'Notes Generated',
    quiz_generated: 'Quiz Generated',
    quiz_completed: 'Quiz Completed',
    user_login: 'Signed In',
    user_login_google: 'Signed In with Google',
    user_registered: 'Account Created',
    ppt_explanation: 'PPT Explanation Used',
    voice_lesson: 'Voice Lesson Generated',
  };
  return {
    id: row?.id || `${action}-${row?.timestamp || Date.now()}`,
    type,
    title: titleMap[action] || action.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    description: descriptor ? `Related: ${descriptor}` : 'Activity recorded.',
    time: formatRelativeTime(row?.timestamp),
    timestamp: row?.timestamp || null,
    icon: meta.icon,
    color: meta.color,
    bg: meta.bg,
  };
}

export default function ActivitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [showTimeFilterMenu, setShowTimeFilterMenu] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadError('');
        setIsLoading(true);
        const response = await getUserActivityLogs({ page: 1, limit: 200 });
        const rows = Array.isArray(response?.logs) ? response.logs.map(toActivityItem) : [];
        if (!cancelled) setActivities(rows);
      } catch (err) {
        if (!cancelled) setLoadError(err?.message || 'Failed to load activity history.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredActivities = useMemo(() => activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || activity.type === activeFilter;
    const now = Date.now();
    let matchesTime = true;
    const stamp = activity?.timestamp ? new Date(activity.timestamp).getTime() : null;
    if (timeFilter !== 'all' && stamp) {
      if (timeFilter === '24h') matchesTime = now - stamp <= 24 * 60 * 60 * 1000;
      if (timeFilter === '7d') matchesTime = now - stamp <= 7 * 24 * 60 * 60 * 1000;
      if (timeFilter === '30d') matchesTime = now - stamp <= 30 * 24 * 60 * 60 * 1000;
    }
    if (timeFilter !== 'all' && !stamp) matchesTime = false;
    return matchesSearch && matchesFilter && matchesTime;
  }), [activities, searchQuery, activeFilter, timeFilter]);
  const availableFilters = useMemo(() => {
    const ordered = ['quiz', 'topic', 'system'];
    const seen = new Set(activities.map((a) => a.type));
    return ['all', ...ordered.filter((x) => seen.has(x))];
  }, [activities]);

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
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTimeFilterMenu((v) => !v)}
              className="border-slate-700 text-slate-300 h-11 rounded-xl"
            >
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
            {showTimeFilterMenu ? (
              <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-700 bg-slate-900/95 p-1 shadow-2xl backdrop-blur-xl">
                {[
                  { id: 'all', label: 'All time' },
                  { id: '24h', label: 'Last 24 hours' },
                  { id: '7d', label: 'Last 7 days' },
                  { id: '30d', label: 'Last 30 days' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setTimeFilter(option.id);
                      setShowTimeFilterMenu(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      timeFilter === option.id
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {availableFilters.map((filter) => (
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

      {loadError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {loadError}
        </div>
      ) : null}
      {isLoading ? (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          Loading live activity history...
        </div>
      ) : null}

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
