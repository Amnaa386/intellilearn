'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MessageSquare, 
  Headphones, 
  FileText, 
  Presentation, 
  History, 
  Sparkles, 
  Play, 
  Download,
  MoreVertical,
  ArrowRight,
  User,
  Mic,
  Image as ImageIcon,
  Send,
  Zap,
  CheckCircle2,
  Clock,
  TrendingUp,
  BrainCircuit,
  Layout,
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { FaRobot } from 'react-icons/fa';
import {
  getUserAnalyticsOverview,
  getUserActivityLogs,
  getChatStats,
  getQuizStats,
  getNotesStats,
} from '@/lib/analyticsApi';

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

function mapActionToActivity(action = '') {
  if (action.startsWith('quiz_')) return { icon: CheckCircle2, color: 'text-emerald-400' };
  if (action.startsWith('notes_')) return { icon: FileText, color: 'text-blue-400' };
  if (action === 'ppt_explanation') return { icon: Presentation, color: 'text-orange-400' };
  return { icon: Play, color: 'text-purple-400' };
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Student', email: '', role: 'student' });
  const [topic, setTopic] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('intellilearn_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  const [activeMode, setActiveMode] = useState('text');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateType, setGenerateType] = useState(''); // 'notes', 'quiz', 'voice'
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: "Hello! I'm Dr. Intelli, your AI Tutor. How can I help you with your studies today?", time: '9:00 AM' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [showPresentation, setShowPresentation] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [liveChatStats, setLiveChatStats] = useState(null);
  const [liveQuizStats, setLiveQuizStats] = useState(null);
  const [liveNotesStats, setLiveNotesStats] = useState(null);
  const [liveActivities, setLiveActivities] = useState([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  const slides = [
    { title: 'Introduction to AI', content: 'Artificial Intelligence is the simulation of human intelligence by machines.', explanation: 'Think of AI as a brain for computers. It helps them learn from data and make decisions just like we do!' },
    { title: 'Machine Learning', content: 'A subset of AI that focuses on the use of data and algorithms to imitate the way that humans learn.', explanation: 'Machine learning is how computers get smarter over time without being explicitly programmed for every single task.' },
    { title: 'Deep Learning', content: 'A type of machine learning based on artificial neural networks.', explanation: 'Deep learning is inspired by the human brain structure. It uses many layers of processing to understand complex patterns.' },
  ];

  useEffect(() => {
    let interval;
    if (isAutoPlaying && showPresentation) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => {
          if (prev === slides.length - 1) {
            setIsAutoPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, showPresentation, slides.length]);

  useEffect(() => {
    let cancelled = false;
    const loadDashboardData = async () => {
      setIsDashboardLoading(true);
      try {
        const [overviewRes, activityRes, chatRes, quizRes, notesRes] = await Promise.all([
          getUserAnalyticsOverview(),
          getUserActivityLogs({ page: 1, limit: 10 }),
          getChatStats(),
          getQuizStats(),
          getNotesStats(),
        ]);
        if (cancelled) return;
        setOverview(overviewRes || {});
        setLiveChatStats(chatRes || {});
        setLiveQuizStats(quizRes || {});
        setLiveNotesStats(notesRes || {});
        setLiveActivities(Array.isArray(activityRes?.logs) ? activityRes.logs.slice(0, 3) : []);
      } catch (err) {
        // Keep dashboard usable even if live fetch fails.
        console.error('Failed to load dashboard live stats:', err);
      } finally {
        if (!cancelled) setIsDashboardLoading(false);
      }
    };
    loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDownloadSlides = () => {
    setIsDownloading(true);
    // Simulate a download delay
    setTimeout(() => {
      setIsDownloading(false);
      alert(`Downloading ${slides[currentSlide].title} slides as PDF...`);
    }, 1500);
  };

  const stats = [
    { label: 'Topics Completed', value: String(liveNotesStats?.totalNotes ?? overview?.stats?.topicsCompleted ?? 0), icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Quizzes Attempted', value: String(liveQuizStats?.totalQuizzes ?? overview?.stats?.quizzesAttempted ?? 0), icon: BrainCircuit, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Performance', value: `${Math.round(Number(liveQuizStats?.averageScore ?? overview?.stats?.performance ?? 0))}%`, icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Study Streak', value: `${Number(overview?.stats?.studyStreak ?? 0)} Days`, icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  const quickActions = [
    { title: 'Generate Notes', icon: FileText, color: 'from-blue-500 to-cyan-500', desc: 'Create AI summaries' },
    { title: 'Create Quiz', icon: BrainCircuit, color: 'from-purple-500 to-pink-500', desc: 'Test your knowledge' },
    { title: 'Voice Lesson', icon: Headphones, color: 'from-orange-500 to-red-500', desc: 'Listen to AI audio' },
    { title: 'Analytics', icon: TrendingUp, color: 'from-emerald-500 to-teal-500', desc: 'Check progress' },
  ];

  const handleQuickActionClick = (action) => {
    const typeMap = {
      'Generate Notes': 'notes',
      'Create Quiz': 'quiz',
      'Voice Lesson': 'voice'
    };
    
    if (action.title === 'Analytics') {
      navigate('/dashboard/student/analytics');
    } else {
      setGenerateType(typeMap[action.title]);
      setShowGenerateModal(true);
    }
  };

  const aiFeatures = [
    { title: 'Topic Explanation', icon: MessageSquare, desc: 'Deep dive into any subject' },
    { title: 'PPT Generation', icon: Presentation, desc: 'Instant slides with AI visuals' },
    { title: 'Note Summarizer', icon: Layout, desc: 'Shrink long texts into points' },
    { title: 'Practice Qs', icon: Zap, desc: 'Exam-style prep questions' },
  ];

  const handleFeatureClick = (feature) => {
    if (feature.title === 'PPT Generation') {
      setShowPresentation(true);
    } else {
      const typeMap = {
        'Topic Explanation': 'explanation',
        'Note Summarizer': 'summarize',
        'Practice Qs': 'practice'
      };
      setGenerateType(typeMap[feature.title] || feature.title.toLowerCase());
      setShowGenerateModal(true);
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    // Simulate AI Generation
    setTimeout(() => {
      setIsGenerating(false);
      setShowGenerateModal(false);
      const targetPath = generateType === 'quiz' ? '/dashboard/student/quiz' : 
                         generateType === 'notes' ? '/dashboard/student/notes' : 
                         generateType === 'voice' ? '/dashboard/student/voice-lesson' :
                         '/dashboard/student/tutor';
      navigate(targetPath, { state: { generatedTopic: topic, type: generateType } });
      setTopic('');
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    const newMsg = { id: Date.now(), type: 'user', text: inputMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages([...messages, newMsg]);
    setInputMessage('');

    // Simulate Bot Response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: `That's an interesting question about "${inputMessage}". Let me analyze that for you...`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f2c] space-y-10">
        <section className="space-y-6">
          <div className="h-10 w-96 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-72 animate-pulse rounded bg-white/5" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="rounded-[2rem] border border-white/5 bg-[#0d1333] p-6">
                <div className="h-12 w-12 animate-pulse rounded-2xl bg-white/10" />
                <div className="mt-4 h-3 w-24 animate-pulse rounded bg-white/10" />
                <div className="mt-2 h-8 w-20 animate-pulse rounded bg-white/5" />
              </div>
            ))}
          </div>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 rounded-[2.5rem] border border-white/5 bg-[#0d1333] p-6 h-[600px]">
            <div className="h-6 w-44 animate-pulse rounded bg-white/10" />
            <div className="mt-5 space-y-3">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="h-12 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          </div>
          <div className="space-y-8">
            <div className="rounded-[2.5rem] border border-white/5 bg-[#0d1333] p-6">
              <div className="h-6 w-28 animate-pulse rounded bg-white/10" />
              <div className="mt-4 space-y-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="h-16 animate-pulse rounded-2xl bg-white/5" />
                ))}
              </div>
            </div>
            <div className="rounded-[2.5rem] border border-white/5 bg-[#0d1333] p-6">
              <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
              <div className="mt-4 h-24 animate-pulse rounded-2xl bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f2c] space-y-10">
      
      {/* Welcome & Progress Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">{user.name}!</span>
            </h1>
            <p className="text-slate-400 font-medium mt-1 text-sm md:text-base">Ready to continue your personalized AI learning journey?</p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
             <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
               <Zap className="w-5 h-5 fill-current" />
             </div>
             <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Global Rank</p>
               <p className="text-white font-bold text-sm">#{Number(overview?.stats?.globalRank ?? 1240).toLocaleString()}</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0d1333] p-5 md:p-6 rounded-[2rem] border border-white/5 shadow-xl group hover:border-white/10 transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              {isDashboardLoading ? (
                <div className="mt-1 h-7 w-20 animate-pulse rounded bg-white/10" />
              ) : (
                <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: AI Tutor & Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Tutor Chat Interface */}
          <section className="bg-[#0d1333] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl flex flex-col h-[600px]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <FaRobot className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold tracking-tight">AI Tutor - Dr. Intelli</h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Now</span>
                  </div>
                </div>
              </div>
              <button className="p-2 rounded-xl hover:bg-white/5 text-slate-400 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.type === 'bot' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.type === 'bot' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] flex flex-col ${msg.type === 'bot' ? 'items-start' : 'items-end'}`}>
                    <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                      msg.type === 'bot' 
                        ? 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5' 
                        : 'bg-purple-600 text-white rounded-tr-none shadow-lg shadow-purple-500/20'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase">{msg.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-6 bg-white/[0.02] border-t border-white/5">
              <div className="relative flex items-center bg-[#0a0f2c] border border-white/10 rounded-2xl p-2 focus-within:border-purple-500/50 transition-all">
                <div className="flex items-center gap-2 px-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'audio/*';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) alert(`Voice note "${file.name}" is being processed...`);
                      };
                      input.click();
                    }}
                    className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500 hover:text-purple-400 transition-all"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) alert(`Image "${file.name}" attached for analysis!`);
                      };
                      input.click();
                    }}
                    className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500 hover:text-blue-400 transition-all"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>
                <input 
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask anything to your AI Tutor..."
                  className="flex-1 bg-transparent border-none text-white focus:ring-0 placeholder:text-slate-600 py-3 text-sm font-medium"
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-white/10 text-white p-3 rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95 ml-2"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </section>

          {/* AI Features Grid */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Intelligent Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {aiFeatures.map((feature, i) => (
                <button 
                  key={i}
                  onClick={() => handleFeatureClick(feature)}
                  className="bg-[#0d1333] p-6 rounded-[2rem] border border-white/5 hover:border-purple-500/30 transition-all text-center group relative overflow-hidden flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 mb-4 group-hover:text-purple-400 group-hover:scale-110 transition-all relative z-10">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h4 className="text-white font-bold text-sm tracking-tight mb-1 relative z-10">{feature.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium relative z-10">{feature.desc}</p>
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Quick Actions & Recent Activity */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4">
              {quickActions.map((action, i) => (
                <button 
                  key={i}
                  onClick={() => handleQuickActionClick(action)}
                  className="bg-[#0d1333] p-5 rounded-3xl border border-white/5 hover:border-white/10 transition-all flex items-center gap-4 group w-full text-left relative overflow-hidden"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform relative z-10`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div className="text-left relative z-10">
                    <h4 className="text-white font-bold text-sm leading-tight">{action.title}</h4>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">{action.desc}</p>
                  </div>
                  <div className="ml-auto relative z-10">
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="bg-[#0d1333] p-6 rounded-[2.5rem] border border-white/5 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white tracking-tight">Recent Activity</h3>
              <History className="w-5 h-5 text-slate-600" />
            </div>
            <div className="space-y-4">
              {(liveActivities.length ? liveActivities : [
                { id: 'fallback-1', action: 'quiz_completed', timestamp: null, details: { topic: 'Neural Networks' } },
                { id: 'fallback-2', action: 'notes_generated', timestamp: null, details: { topic: 'History 101' } },
                { id: 'fallback-3', action: 'chat_message', timestamp: null, details: { topic: 'Python Advanced' } },
              ]).map((activity, i) => {
                const mapped = mapActionToActivity(activity?.action || '');
                const details = activity?.details && typeof activity.details === 'object' ? activity.details : {};
                const title = details.topic || details.title || details.source || details.quizId || details.noteId || '';
                return (
                <div key={i} className="flex gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${mapped.color}`}>
                    <mapped.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-bold text-xs leading-tight group-hover:text-white transition-colors">
                      {(activity?.action || 'activity').replaceAll('_', ' ')}{title ? `: ${title}` : ''}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">{formatRelativeTime(activity?.timestamp)}</p>
                  </div>
                </div>
              );
              })}
            </div>
            <button 
              onClick={() => navigate('/dashboard/student/activities')}
              className="w-full py-3 rounded-2xl bg-white/5 text-slate-400 font-bold text-xs hover:bg-white/10 transition-all border border-white/5"
            >
              View All Activity
            </button>
          </section>

          {/* Analytics Preview Placeholder */}
          <section 
            onClick={() => navigate('/dashboard/student/analytics')}
            className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-6 rounded-[2.5rem] border border-purple-500/20 shadow-xl overflow-hidden relative group cursor-pointer"
          >
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">Analytics Preview</h3>
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-end gap-2 h-20">
                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.1 }}
                    className="flex-1 bg-white/20 rounded-t-lg group-hover:bg-white/40 transition-colors"
                  />
                ))}
              </div>
              <p className="text-white/60 text-[10px] font-bold text-center uppercase tracking-widest">Growth +24% this week</p>
            </div>
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all" />
          </section>

        </div>
      </div>

      {/* Presentation Mode Modal */}
      <AnimatePresence>
        {showPresentation && (
          <motion.div
            key="presentation-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0f2c]/95 backdrop-blur-xl"
          >
            <div className="bg-[#0d1333] w-full max-w-6xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[85vh]">
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <Presentation className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold tracking-tight">Interactive AI Presentation</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Guided Learning Experience</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPresentation(false)}
                  className="p-3 rounded-2xl hover:bg-white/10 text-slate-400 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Main Slide Area */}
                <div className="flex-1 p-8 md:p-12 flex flex-col relative overflow-hidden">
                  <div className="flex-1 flex items-center justify-center w-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        className="w-full max-w-4xl aspect-video bg-[#0a0f2c] rounded-[2.5rem] p-10 border border-white/10 shadow-inner flex flex-col justify-center text-center relative z-10"
                      >
                        <h3 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                          {slides[currentSlide].title}
                        </h3>
                        <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed">
                          {slides[currentSlide].content}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-center gap-10 py-6 relative z-10">
                    <button 
                      onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                      disabled={currentSlide === 0}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3">
                      {slides.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${currentSlide === i ? 'w-10 bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'w-2 bg-white/10'}`} />
                      ))}
                    </div>
                    <button 
                      onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
                      disabled={currentSlide === slides.length - 1}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Robot Tutor Sidebar */}
                <div className="w-full lg:w-96 bg-white/[0.02] border-l border-white/5 p-8 flex flex-col items-center justify-between text-center">
                   <div className="flex-1 flex flex-col items-center justify-center w-full">
                     <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="relative mb-8"
                    >
                      <div className="w-32 h-32 rounded-3xl bg-[#0d1333] border border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20" />
                        <FaRobot className="w-16 h-16 text-purple-400 relative z-10 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                      </div>
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/40 blur-md rounded-[100%]" />
                    </motion.div>

                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Presenter Mode</span>
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentSlide}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <h4 className="text-white font-bold text-sm mb-3">Dr. Intelli Explains:</h4>
                          <p className="text-slate-400 text-[13px] font-medium leading-relaxed italic px-2">
                            "{slides[currentSlide].explanation}"
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="w-full space-y-3 pb-4">
                    <button 
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      className={`w-full py-3.5 rounded-2xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${
                        isAutoPlaying 
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' 
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
                      }`}
                    >
                      {isAutoPlaying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Stop Auto-Play
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          Auto-Play Presentation
                        </>
                      )}
                    </button>
                    <button 
                      onClick={handleDownloadSlides}
                      disabled={isDownloading}
                      className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download Slides (.pptx)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Content Generation Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <motion.div
            key="generate-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0a0f2c]/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d1333] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Sparkles className="w-10 h-10 text-purple-400 animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white capitalize">
                    Generate {generateType.replace('-', ' ')}
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Enter a topic below and Dr. Intelli will create personalized content for you instantly.
                  </p>
                </div>

                <form onSubmit={handleGenerate} className="w-full space-y-4">
                  <div className="relative">
                    <input 
                      type="text"
                      autoFocus
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Quantum Physics or World War II"
                      className="w-full bg-[#0a0f2c] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={!topic.trim() || isGenerating}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing Topic...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 fill-current" />
                        Generate Now
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
