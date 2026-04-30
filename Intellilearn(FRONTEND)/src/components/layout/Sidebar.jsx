'use client';

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BrandLogo from '@/components/branding/BrandLogo';
import {
  Home, 
  BookOpen, 
  BarChart3, 
  Settings,
  Users,
  FileText,
  LogOut,
  Zap,
  HelpCircle,
  LayoutDashboard,
  Bell,
  Presentation
} from 'lucide-react';

export default function Sidebar({ isOpen, userRole }) {
  const navigate = useNavigate();
  const [user, setUser] = React.useState({ name: '', role: userRole });

  React.useEffect(() => {
    const storedUser = localStorage.getItem('intellilearn_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser) setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  const handleLogout = () => {
     localStorage.clear(); 
     window.location.href = '/auth/login';
   };

  const getNavItems = () => {
    if (userRole === 'admin') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin/overview' },
        { icon: Users, label: 'User Management', href: '/dashboard/admin/users' },
        { icon: Zap, label: 'AI Activity Monitoring', href: '/dashboard/admin/ai-activity' },
        { icon: BarChart3, label: 'Analytics', href: '/dashboard/admin/analytics' },
        { icon: Settings, label: 'System Settings', href: '/dashboard/admin/settings' },
      ];
    }

    if (userRole === 'student') {
      return [
        { icon: Home, label: 'Dashboard', href: '/dashboard/student' },
        { icon: Zap, label: 'AI Tutor', href: '/dashboard/student/tutor' },
        { icon: FileText, label: 'Quizzes', href: '/dashboard/student/quiz' },
        { icon: FileText, label: 'Notes', href: '/dashboard/student/notes' },
        { icon: Presentation, label: 'Presentations', href: '/dashboard/student/presentations' },
        { icon: BarChart3, label: 'Analytics', href: '/dashboard/student/analytics' },
        { icon: Settings, label: 'Settings', href: '/dashboard/student/settings' },
      ];
    }

    return [
      { icon: Home, label: 'Dashboard', href: '/dashboard/student' },
      { icon: Zap, label: 'AI Tutor', href: '/dashboard/student/tutor' },
      { icon: FileText, label: 'Quizzes', href: '/dashboard/student/quiz' },
      { icon: FileText, label: 'Notes', href: '/dashboard/student/notes' },
      { icon: Presentation, label: 'Presentations', href: '/dashboard/student/presentations' },
      { icon: BarChart3, label: 'Analytics', href: '/dashboard/student/analytics' },
      { icon: Settings, label: 'Settings', href: '/dashboard/student/settings' },
    ];
  };

  const navItems = getNavItems();

  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: isOpen ? 0 : -250 }}
      transition={{ duration: 0.3 }}
      className="w-64 bg-[#0d1333] border-r border-white/5 hidden md:flex flex-col shadow-2xl"
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2.5 group">
          <BrandLogo
            iconClassName="h-9 w-9"
            textClassName="text-sm"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 mt-2">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = window.location.pathname === item.href;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                to={item.href}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                  ? 'bg-purple-500/10 text-purple-400 font-bold' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-6 bg-purple-500 rounded-r-full" 
                  />
                )}
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="text-xs tracking-tight">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <Link
          to="/help-center"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium"
        >
          <HelpCircle className="w-5 h-5 text-slate-500" />
          <span className="text-xs tracking-tight">Help Center</span>
        </Link>
        <Link
          to="/settings"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium"
        >
          <Settings className="w-5 h-5 text-slate-500" />
          <span className="text-xs tracking-tight">Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all font-medium mt-2"
        >
          <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-400" />
          <span className="text-xs tracking-tight">Logout</span>
        </button>
      </div>
    </motion.aside>
  );
}
