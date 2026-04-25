'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  MessageSquare, 
  BrainCircuit, 
  FileText, 
  Presentation, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  Target,
  Zap,
  Activity,
  ArrowUpRight,
  ChevronRight,
  Lightbulb,
  Search
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

// Dummy data for AI Interaction Tracking
const timeRangeData = {
  Daily: [
    { day: '6 AM', interactions: 2, quizzes: 0, notes: 1 },
    { day: '9 AM', interactions: 8, quizzes: 1, notes: 2 },
    { day: '12 PM', interactions: 15, quizzes: 2, notes: 3 },
    { day: '3 PM', interactions: 10, quizzes: 1, notes: 1 },
    { day: '6 PM', interactions: 22, quizzes: 3, notes: 4 },
    { day: '9 PM', interactions: 18, quizzes: 2, notes: 2 },
    { day: '12 AM', interactions: 5, quizzes: 0, notes: 0 },
  ],
  Weekly: [
    { day: 'Mon', interactions: 12, quizzes: 2, notes: 3 },
    { day: 'Tue', interactions: 18, quizzes: 4, notes: 5 },
    { day: 'Wed', interactions: 15, quizzes: 3, notes: 2 },
    { day: 'Thu', interactions: 25, quizzes: 6, notes: 8 },
    { day: 'Fri', interactions: 22, quizzes: 5, notes: 4 },
    { day: 'Sat', interactions: 30, quizzes: 8, notes: 6 },
    { day: 'Sun', interactions: 28, quizzes: 7, notes: 7 },
  ],
  Monthly: [
    { day: 'Week 1', interactions: 85, quizzes: 12, notes: 15 },
    { day: 'Week 2', interactions: 110, quizzes: 18, notes: 22 },
    { day: 'Week 3', interactions: 95, quizzes: 15, notes: 18 },
    { day: 'Week 4', interactions: 148, quizzes: 24, notes: 32 },
  ]
};

const featureUsage = [
  { name: 'AI Chat', value: 45, color: '#8b5cf6' },
  { name: 'PPT Mode', value: 25, color: '#3b82f6' },
  { name: 'Quizzes', value: 20, color: '#f59e0b' },
  { name: 'Notes', value: 10, color: '#10b981' },
];

const recentActivities = [
  { id: 1, type: 'chat', title: 'Asked about Quantum Entanglement', time: '10 mins ago', icon: MessageSquare, color: 'text-purple-400' },
  { id: 2, type: 'quiz', title: 'Generated Quiz: Modern History', time: '45 mins ago', icon: BrainCircuit, color: 'text-amber-400' },
  { id: 3, type: 'ppt', title: 'Requested PPT: Neural Networks', time: '2 hours ago', icon: Presentation, color: 'text-blue-400' },
  { id: 4, type: 'notes', title: 'Created Notes: React Hooks', time: 'Yesterday', icon: FileText, color: 'text-emerald-400' },
];

const aiInsights = [
  { title: 'Learning Pattern', desc: 'You prefer visual learning. 60% of your interactions involve PPT or Video modes.', icon: TrendingUp },
  { title: 'Area for Improvement', desc: 'Consistency in Quizzes. Try taking one short quiz daily to improve retention.', icon: Target },
  { title: 'Top Topic', desc: 'Advanced Mathematics. You have explored 12 different sub-topics this week.', icon: Lightbulb },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('Weekly');
  const navigate = useNavigate();

  const getSummaryCards = (range) => {
    const data = {
      Daily: [
        { label: 'AI Interactions', value: '18', trend: '+8%', icon: MessageSquare, color: 'from-purple-500 to-indigo-500' },
        { label: 'Topics Explored', value: '4', trend: '+2', icon: Search, color: 'from-blue-500 to-cyan-500' },
        { label: 'Quizzes Created', value: '3', trend: '+1', icon: BrainCircuit, color: 'from-orange-500 to-amber-500' },
        { label: 'Engagement Score', value: '89', trend: 'High', icon: Zap, color: 'from-emerald-500 to-teal-500' },
      ],
      Weekly: [
        { label: 'AI Interactions', value: '148', trend: '+12%', icon: MessageSquare, color: 'from-purple-500 to-indigo-500' },
        { label: 'Topics Explored', value: '32', trend: '+5', icon: Search, color: 'from-blue-500 to-cyan-500' },
        { label: 'Quizzes Created', value: '24', trend: '+8', icon: BrainCircuit, color: 'from-orange-500 to-amber-500' },
        { label: 'Engagement Score', value: '94', trend: 'Elite', icon: Zap, color: 'from-emerald-500 to-teal-500' },
      ],
      Monthly: [
        { label: 'AI Interactions', value: '612', trend: '+24%', icon: MessageSquare, color: 'from-purple-500 to-indigo-500' },
        { label: 'Topics Explored', value: '127', trend: '+18', icon: Search, color: 'from-blue-500 to-cyan-500' },
        { label: 'Quizzes Created', value: '89', trend: '+32', icon: BrainCircuit, color: 'from-orange-500 to-amber-500' },
        { label: 'Engagement Score', value: '96', trend: 'Elite', icon: Zap, color: 'from-emerald-500 to-teal-500' },
      ]
    };
    return data[range] || data.Weekly;
  };

  const summaryCards = getSummaryCards(timeRange);

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
                <AreaChart data={timeRangeData[timeRange]}>
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
