'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  BrainCircuit,
  FileText,
  Presentation,
  TrendingUp,
  Clock,
  Target,
  Zap,
  Activity,
  ChevronRight,
  Search,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getUserAnalyticsOverview,
  getUserActivityLogs,
  getChatStats,
  getQuizStats,
  getNotesStats,
} from '@/lib/analyticsApi';

const FEATURE_COLORS = {
  'AI Chat': '#8b5cf6',
  'PPT Mode': '#3b82f6',
  Quizzes: '#f59e0b',
  Notes: '#10b981',
};

function toDateSafe(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getActionMeta(action = '') {
  if (action.startsWith('quiz_')) return { label: 'Quizzes', icon: BrainCircuit, color: 'text-amber-400' };
  if (action.startsWith('notes_')) return { label: 'Notes', icon: FileText, color: 'text-emerald-400' };
  if (action === 'ppt_explanation') return { label: 'PPT Mode', icon: Presentation, color: 'text-blue-400' };
  return { label: 'AI Chat', icon: MessageSquare, color: 'text-purple-400' };
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

function buildTimeSeries(logs, range) {
  const now = new Date();
  if (range === 'Daily') {
    const labels = ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM', '12 AM'];
    const bucketEdges = [6, 9, 12, 15, 18, 21, 24];
    const counts = labels.map((day) => ({ day, interactions: 0 }));
    logs.forEach((row) => {
      const d = toDateSafe(row?.timestamp);
      if (!d) return;
      const isToday = d.toDateString() === now.toDateString();
      if (!isToday) return;
      const hour = d.getHours();
      const idx = bucketEdges.findIndex((edge) => hour < edge);
      if (idx >= 0) counts[idx].interactions += 1;
    });
    return counts;
  }

  if (range === 'Weekly') {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monday = new Date(now);
    const day = monday.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    const counts = labels.map((label, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      return { day: label, stamp: d.getTime(), interactions: 0 };
    });
    logs.forEach((row) => {
      const d = toDateSafe(row?.timestamp);
      if (!d) return;
      const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const idx = counts.findIndex((x) => x.stamp === dateOnly);
      if (idx >= 0) counts[idx].interactions += 1;
    });
    return counts.map(({ day: label, interactions }) => ({ day: label, interactions }));
  }

  const counts = [
    { day: 'Week 1', interactions: 0 },
    { day: 'Week 2', interactions: 0 },
    { day: 'Week 3', interactions: 0 },
    { day: 'Week 4', interactions: 0 },
  ];
  logs.forEach((row) => {
    const d = toDateSafe(row?.timestamp);
    if (!d) return;
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays < 0 || diffDays >= 28) return;
    const weekIndex = 3 - Math.floor(diffDays / 7);
    if (weekIndex >= 0 && weekIndex < 4) counts[weekIndex].interactions += 1;
  });
  return counts;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('Weekly');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [chatStats, setChatStats] = useState(null);
  const [quizStats, setQuizStats] = useState(null);
  const [notesStats, setNotesStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const loadAnalytics = async () => {
      try {
        setError('');
        setIsLoading(true);
        const [overviewRes, activityRes, chatRes, quizRes, notesRes] = await Promise.all([
          getUserAnalyticsOverview(),
          getUserActivityLogs({ page: 1, limit: 300 }),
          getChatStats(),
          getQuizStats(),
          getNotesStats(),
        ]);
        if (cancelled) return;
        setOverview(overviewRes || {});
        setActivityLogs(Array.isArray(activityRes?.logs) ? activityRes.logs : []);
        setChatStats(chatRes || {});
        setQuizStats(quizRes || {});
        setNotesStats(notesRes || {});
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load analytics.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, []);

  const timeSeries = useMemo(() => buildTimeSeries(activityLogs, timeRange), [activityLogs, timeRange]);
  const interactionsCount = useMemo(() => {
    const now = Date.now();
    const windowDays = timeRange === 'Daily' ? 1 : timeRange === 'Weekly' ? 7 : 30;
    return activityLogs.filter((row) => {
      const d = toDateSafe(row?.timestamp);
      if (!d) return false;
      return now - d.getTime() <= windowDays * 86400000;
    }).length;
  }, [activityLogs, timeRange]);

  const featureUsage = useMemo(() => {
    const raw = {
      'AI Chat': 0,
      'PPT Mode': 0,
      Quizzes: 0,
      Notes: 0,
    };
    activityLogs.forEach((row) => {
      const action = row?.action || '';
      if (action.startsWith('quiz_')) raw.Quizzes += 1;
      else if (action.startsWith('notes_')) raw.Notes += 1;
      else if (action === 'ppt_explanation') raw['PPT Mode'] += 1;
      else raw['AI Chat'] += 1;
    });
    const total = Object.values(raw).reduce((sum, x) => sum + x, 0) || 1;
    return Object.entries(raw).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      color: FEATURE_COLORS[name] || '#8b5cf6',
    }));
  }, [activityLogs]);

  const recentActivities = useMemo(() => {
    return activityLogs.slice(0, 5).map((row) => {
      const meta = getActionMeta(row?.action);
      const details = row?.details && typeof row.details === 'object' ? row.details : {};
      const descriptor =
        details.topic || details.title || details.source || details.noteId || details.quizId || details.sessionId || '';
      return {
        id: row?.id || `${row?.action || 'activity'}-${row?.timestamp || ''}`,
        icon: meta.icon,
        color: meta.color,
        title: descriptor ? `${row?.action?.replaceAll('_', ' ') || 'Activity'}: ${descriptor}` : row?.action?.replaceAll('_', ' ') || 'Activity',
        time: formatRelativeTime(row?.timestamp),
      };
    });
  }, [activityLogs]);

  const engagementScore = useMemo(() => {
    const quizPerf = Number(quizStats?.averageScore || overview?.stats?.performance || 0);
    const quizVolume = Number(quizStats?.totalQuizzes || 0);
    const notesVolume = Number(notesStats?.totalNotes || 0);
    const chats = Number(chatStats?.totalSessions || 0);
    const activityFactor = Math.min(100, interactionsCount * 2);
    const consistencyFactor = Math.min(100, (quizVolume + notesVolume + chats) * 4);
    return Math.round((quizPerf * 0.5) + (activityFactor * 0.3) + (consistencyFactor * 0.2));
  }, [quizStats, overview, notesStats, chatStats, interactionsCount]);

  const summaryCards = [
    { label: 'AI Interactions', value: String(interactionsCount), trend: `${timeRange} live`, icon: MessageSquare, color: 'from-purple-500 to-indigo-500' },
    { label: 'Topics Explored', value: String(notesStats?.totalCategories || 0), trend: `${notesStats?.totalNotes || 0} notes`, icon: Search, color: 'from-blue-500 to-cyan-500' },
    { label: 'Quizzes Created', value: String(quizStats?.totalQuizzes || 0), trend: `${quizStats?.totalQuestions || 0} questions`, icon: BrainCircuit, color: 'from-orange-500 to-amber-500' },
    { label: 'Engagement Score', value: String(engagementScore), trend: engagementScore >= 85 ? 'High' : engagementScore >= 65 ? 'Good' : 'Build streak', icon: Zap, color: 'from-emerald-500 to-teal-500' },
  ];

  const aiInsights = [
    {
      title: 'Learning Pattern',
      desc: `Average ${Number(chatStats?.averageMessagesPerSession || 0).toFixed(1)} messages per chat session.`,
      icon: TrendingUp,
    },
    {
      title: 'Area for Improvement',
      desc: `Current quiz average is ${Number(quizStats?.averageScore || 0).toFixed(1)}%. Daily quiz attempts can improve retention.`,
      icon: Target,
    },
    {
      title: 'Top Topic Source',
      desc: `${Number(notesStats?.totalNotes || 0)} notes saved across ${Number(notesStats?.totalCategories || 0)} categories.`,
      icon: Search,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f2c] space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-purple-500" />
            AI Interaction Analytics
          </h1>
          <p className="text-slate-400 font-medium mt-1">Tracking how you learn with Dr. Intelli</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          {['Daily', 'Weekly', 'Monthly'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                timeRange === range ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
      {isLoading ? (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          Loading live analytics...
        </div>
      ) : null}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0d1333] p-6 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden group hover:border-white/10 transition-all"
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              <card.icon className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{card.label}</p>
            <div className="flex items-end gap-3">
              <h3 className="text-2xl font-black text-white tracking-tight">{card.value}</h3>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mb-1">
                {card.trend}
              </span>
            </div>
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Usage Graph */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-[#0d1333] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">AI Usage Consistency</h3>
                <p className="text-slate-500 text-xs font-medium">Weekly interaction volume across all AI tools</p>
              </div>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries}>
                  <defs>
                    <linearGradient id="colorInter" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d1333', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="interactions" 
                    stroke="#8b5cf6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorInter)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* AI Insights Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiInsights.map((insight, i) => (
              <div key={i} className="bg-[#0d1333] p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                  <insight.icon className="w-5 h-5" />
                </div>
                <h4 className="text-white font-bold text-sm mb-2">{insight.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{insight.desc}</p>
              </div>
            ))}
          </section>
        </div>

        {/* Right Column: Feature Distribution & Recent Activity */}
        <div className="space-y-8">
          
          {/* Feature Distribution */}
          <section className="bg-[#0d1333] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 tracking-tight">Feature Usage</h3>
            <div className="space-y-6">
              {featureUsage.map((feature, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-slate-400">{feature.name}</span>
                    <span className="text-white">{feature.value}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${feature.value}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                      style={{ backgroundColor: feature.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity Log */}
          <section className="bg-[#0d1333] p-8 rounded-[2.5rem] border border-white/5 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white tracking-tight">Recent AI Activity</h3>
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            <div className="space-y-5">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-4 group cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${activity.color} group-hover:scale-110 transition-transform`}>
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 border-b border-white/5 pb-4 group-last:border-0">
                    <p className="text-slate-200 font-bold text-xs leading-tight group-hover:text-white transition-colors">{activity.title}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/dashboard/student/activities')}
              className="w-full py-3.5 rounded-2xl bg-white/5 text-slate-400 font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              View Detailed Log
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </section>

        </div>
      </div>
    </div>
  );
}
