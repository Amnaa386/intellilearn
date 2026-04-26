import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Search, User, Settings, LogOut, CheckCircle, Clock, AlertCircle, HelpCircle, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function TopNav({ onToggleSidebar }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [user, setUser] = useState({ name: 'User', email: '', role: 'student' });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Quiz Available', message: 'Multivariable Calculus quiz is now live.', icon: CheckCircle, color: 'text-green-400', time: '2h ago', isRead: false },
    { id: 2, title: 'Study Reminder', message: 'You have a scheduled session for Quantum Mechanics.', icon: Clock, color: 'text-blue-400', time: '5h ago', isRead: false },
    { id: 3, title: 'Grade Update', message: 'Your Algorithms assignment has been graded.', icon: AlertCircle, color: 'text-purple-400', time: '1d ago', isRead: false },
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const sanitizeAvatar = (avatar) => {
      if (typeof avatar !== 'string') return '';
      const trimmed = avatar.trim();
      if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return '';
      return trimmed;
    };

    const hydrateUser = () => {
      const storedUser = localStorage.getItem('intellilearn_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser) {
            setUser(parsedUser);
            setProfileImage(sanitizeAvatar(parsedUser.profile?.avatar));
          }
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      }
    };
    hydrateUser();
    window.addEventListener('intellilearn-user-updated', hydrateUser);
    return () => window.removeEventListener('intellilearn-user-updated', hydrateUser);
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      try {
        const raw = localStorage.getItem('intellilearn_detailed_settings');
        const parsed = raw ? JSON.parse(raw) : null;
        setIsDarkMode(parsed?.darkMode !== false);
      } catch {
        setIsDarkMode(true);
      }
    };
    syncTheme();
    window.addEventListener('intellilearn-theme-changed', syncTheme);
    window.addEventListener('storage', syncTheme);
    return () => {
      window.removeEventListener('intellilearn-theme-changed', syncTheme);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  const getInitials = (name = '') => {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    if (!parts.length) return 'U';
    return parts.map((p) => p[0]?.toUpperCase() || '').join('');
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/auth/login';
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <motion.header
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className={`h-16 backdrop-blur-md border-b px-6 flex items-center justify-between sticky top-0 z-40 ${
        isDarkMode ? 'bg-[#0a0f2c]/80 border-white/5' : 'bg-white/90 border-slate-200'
      }`}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`} />
        </button>

        {/* Search Bar */}
        <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500" />
          <Input
            type="text"
            placeholder="Search academic content..."
            className={`h-9 focus:ring-purple-500/50 ${
              isDarkMode
                ? 'bg-white/5 border-white/10 text-slate-300 placeholder:text-slate-500'
                : 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-500'
            }`}
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg transition-colors relative ${
              showNotifications
                ? 'bg-white/10 text-purple-400'
                : isDarkMode
                  ? 'hover:bg-white/5 text-slate-400'
                  : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0f2c] animate-pulse"></span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute right-0 mt-2 w-80 border rounded-2xl shadow-2xl z-20 overflow-hidden ${
                    isDarkMode ? 'bg-[#0d1333] border-white/10' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => markAsRead(n.id)}
                          className={`p-4 border-b transition-colors cursor-pointer group relative ${
                            isDarkMode ? 'border-white/5 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'
                          } ${!n.isRead ? 'bg-purple-500/5' : ''}`}
                        >
                          {!n.isRead && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-r-full"></div>
                          )}
                          <div className="flex gap-3">
                            <div className={`p-2 rounded-lg bg-white/5 h-fit ${n.color.replace('600', '400')}`}>
                              <n.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold transition-colors ${
                                !n.isRead ? (isDarkMode ? 'text-white' : 'text-slate-900') : (isDarkMode ? 'text-slate-400' : 'text-slate-600')
                              } group-hover:text-purple-400`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-slate-600 mt-2 font-medium">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">No new notifications</p>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 text-center ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                    <button 
                      onClick={() => {
                        setShowNotifications(false);
                        const path = user.role === 'admin' ? '/dashboard/admin/analytics' : '/dashboard/student/activities';
                        navigate(path);
                      }}
                      className={`text-xs transition-colors w-full py-1 font-bold ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      {user.role === 'admin' ? 'View all notifications' : 'View all activities'}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-1.5 pr-4 rounded-full transition-colors flex items-center gap-3 border border-transparent group ${
                isDarkMode ? 'hover:bg-white/5 hover:border-white/10' : 'hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 overflow-hidden group-hover:border-purple-500 transition-colors bg-slate-700 flex items-center justify-center">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setProfileImage('')}
                  />
                ) : (
                  <span className="text-[10px] font-bold text-white">{getInitials(user.name)}</span>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className={`text-sm font-bold transition-colors ${isDarkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-900'}`}>{user.name}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-colors ${isDarkMode ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-700'}`} />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={`w-56 shadow-2xl ${isDarkMode ? 'bg-[#0d1333] border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-700'}`}>
            <DropdownMenuLabel className={isDarkMode ? 'text-white' : 'text-slate-900'}>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className={isDarkMode ? 'bg-white/5' : 'bg-slate-200'} />
            <DropdownMenuItem 
              onClick={() => navigate('/settings')}
              className={`cursor-pointer flex items-center gap-2 focus:text-purple-400 transition-colors ${isDarkMode ? 'hover:bg-white/5 focus:bg-white/5' : 'hover:bg-slate-100 focus:bg-slate-100'}`}
            >
              <User className="w-4 h-4" /> Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate('/help-center')}
              className={`cursor-pointer flex items-center gap-2 focus:text-purple-400 transition-colors ${isDarkMode ? 'hover:bg-white/5 focus:bg-white/5' : 'hover:bg-slate-100 focus:bg-slate-100'}`}
            >
              <HelpCircle className="w-4 h-4" /> Help Center
            </DropdownMenuItem>
            <DropdownMenuSeparator className={isDarkMode ? 'bg-white/5' : 'bg-slate-200'} />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="hover:bg-red-500/10 text-red-400 cursor-pointer flex items-center gap-2 focus:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
