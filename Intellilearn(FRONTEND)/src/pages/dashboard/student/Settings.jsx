'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Camera, 
  Save, 
  Shield, 
  Bell, 
  LogOut,
  ChevronRight,
  UserCircle,
  Sparkles,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { containerVariants, itemVariants, pageTransition } from '@/lib/animations';

export default function SettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const getInitials = (name = '') => {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    if (!parts.length) return 'U';
    return parts.map((p) => p[0]?.toUpperCase() || '').join('');
  };

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    major: '',
    university: '',
    bio: ''
  });

  useEffect(() => {
    const sanitizeAvatar = (avatar) => {
      if (typeof avatar !== 'string') return '';
      const trimmed = avatar.trim();
      if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return '';
      if (!trimmed.startsWith('data:image/') && !trimmed.startsWith('http')) return '';
      return trimmed;
    };

    const storedUser = localStorage.getItem('intellilearn_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser) {
          setProfile(prev => ({
            ...prev,
            name: parsedUser.name || '',
            email: parsedUser.email || '',
            major: parsedUser.profile?.major || '',
            university: parsedUser.profile?.university || '',
            bio: parsedUser.profile?.bio || '',
          }));
          setProfileImage(sanitizeAvatar(parsedUser.profile?.avatar));
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('intellilearn_detailed_settings');
      const parsed = raw ? JSON.parse(raw) : null;
      setIsDarkMode(parsed?.darkMode !== false);
    } catch {
      setIsDarkMode(true);
    }
  }, []);
  
  const [profileImage, setProfileImage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const fileInputRef = useRef(null);

  const theme = isDarkMode
    ? {
        panel: 'bg-slate-900/40 border-slate-800 text-white',
        panelSoft: 'bg-slate-900/40 border-slate-800',
        input: 'bg-slate-800/50 border-slate-700 text-white focus:border-blue-500',
        muted: 'text-slate-400',
        danger: 'bg-red-500/5 border-red-500/20',
      }
    : {
        panel: 'bg-white/95 border-slate-200 text-slate-900',
        panelSoft: 'bg-white/95 border-slate-200',
        input: 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500',
        muted: 'text-slate-600',
        danger: 'bg-red-50 border-red-200',
      };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
      const accessToken = localStorage.getItem('intellilearn_access_token') || '';
      const storedUser = localStorage.getItem('intellilearn_user');
      const parsed = storedUser ? JSON.parse(storedUser) : {};
      const avatarValue = typeof profileImage === 'string' && profileImage
        ? profileImage
        : (typeof parsed?.profile?.avatar === 'string' ? parsed.profile.avatar : '');
      const shouldSyncAvatarToBackend = avatarValue.startsWith('http');
      const normalizedProfile = {
        major: typeof profile.major === 'string' ? profile.major : '',
        university: typeof profile.university === 'string' ? profile.university : '',
        bio: typeof profile.bio === 'string' ? profile.bio : '',
        avatar: avatarValue,
      };
      const updatedUser = {
        ...parsed,
        name: profile.name,
        email: profile.email,
        profile: normalizedProfile,
      };

      if (accessToken) {
        const serverProfilePayload = {
          major: normalizedProfile.major,
          university: normalizedProfile.university,
          bio: normalizedProfile.bio,
        };
        if (shouldSyncAvatarToBackend) {
          serverProfilePayload.avatar = avatarValue;
        }

        const response = await fetch(`${apiBase}/api/user/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: updatedUser.name,
            profile: serverProfilePayload,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.detail || 'Failed to sync profile with server');
        }

        const serverUser = await response.json().catch(() => null);
        if (serverUser && typeof serverUser === 'object') {
          localStorage.setItem('intellilearn_user', JSON.stringify({
            ...updatedUser,
            ...serverUser,
            profile: {
              ...(updatedUser.profile || {}),
              ...(serverUser.profile || {}),
            },
          }));
        } else {
          localStorage.setItem('intellilearn_user', JSON.stringify(updatedUser));
        }
      } else {
        localStorage.setItem('intellilearn_user', JSON.stringify(updatedUser));
      }

      window.dispatchEvent(new Event('intellilearn-user-updated'));
      setSaveMessage('Profile updated successfully');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err) {
      console.error('Failed to save profile', err);
      setSaveMessage(err?.message || 'Unable to save profile');
    }
  };

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto space-y-8"
    >
      {isDarkMode && (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-slate-950"></div>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-600/30 to-transparent blur-[120px] rounded-full"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.15, 0.1],
              rotate: [0, -90, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-600/30 to-transparent blur-[120px] rounded-full"
          />
        </div>
      )}

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl"
          >
            <Settings className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Account Settings</h1>
        </div>
        <p className={theme.muted}>Manage your profile, preferences, and account security.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Navigation/Profile Summary */}
        <div className="space-y-6">
          <motion.div 
            variants={itemVariants}
            className={`border rounded-2xl p-6 backdrop-blur-xl text-center ${theme.panelSoft}`}
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative inline-block group cursor-pointer" 
              onClick={handleImageClick}
            >
              <motion.div 
                animate={{ 
                  boxShadow: ["0 0 20px rgba(59, 130, 246, 0.5)", "0 0 40px rgba(139, 92, 246, 0.5)", "0 0 20px rgba(59, 130, 246, 0.5)"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-32 h-32 rounded-full border-4 border-blue-500/20 overflow-hidden mb-4 bg-slate-800 flex items-center justify-center"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    onError={() => setProfileImage('')}
                  />
                ) : (
                  <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{getInitials(profile.name)}</span>
                )}
              </motion.div>
              <motion.div 
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full transition-opacity"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Camera className="w-8 h-8 text-white" />
                </motion.div>
              </motion.div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/*"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {profile.name}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </motion.div>
              </h3>
              <p className={`text-sm ${theme.muted}`}>
                {profile.major?.trim() ? profile.major : 'Add your major and profile details to personalize your experience.'}
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 flex flex-col gap-2"
            >
              <motion.div
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="outline" className={`w-full justify-start ${isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'}`}>
                  <Shield className="w-4 h-4 mr-3" /> Security
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="outline" className={`w-full justify-start ${isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'}`}>
                  <Bell className="w-4 h-4 mr-3" /> Notifications
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Column - Edit Forms */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            variants={itemVariants}
            className={`border rounded-2xl p-8 backdrop-blur-xl ${theme.panel}`}
          >
            <h2 className={`text-xl font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <UserCircle className="w-5 h-5 text-blue-400" />
              Personal Information
            </h2>
            <p className={`mb-6 text-sm ${theme.muted}`}>
              Update your profile identity. You can edit username and photo here; email comes from your account login.
            </p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ staggerChildren: 0.1 }}
              className="space-y-6"
            >
              <div className={`rounded-xl border p-4 ${isDarkMode ? 'border-slate-800/80 bg-slate-900/30' : 'border-slate-200 bg-slate-50/80'}`}>
                <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Basic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                <label className={`text-sm font-medium ${theme.muted}`}>Full Name</label>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02 }}
                  className="relative"
                >
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <Input 
                    name="name"
                    value={profile.name}
                    onChange={handleInputChange}
                    className={`pl-10 transition-colors ${theme.input}`}
                  />
                </motion.div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <label className={`text-sm font-medium ${theme.muted}`}>Email Address</label>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02 }}
                  className="relative"
                >
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <Input 
                    name="email"
                    value={profile.email}
                    readOnly
                    className={`pl-10 cursor-not-allowed ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-600'}`}
                  />
                </motion.div>
              </motion.div>
                </div>
              </div>

              <div className={`rounded-xl border p-4 ${isDarkMode ? 'border-slate-800/80 bg-slate-900/30' : 'border-slate-200 bg-slate-50/80'}`}>
                <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label className={`text-sm font-medium ${theme.muted}`}>University</label>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02 }}
                >
                  <Input 
                    name="university"
                    value={profile.university}
                    onChange={handleInputChange}
                    className={`transition-colors ${theme.input}`}
                  />
                </motion.div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <label className={`text-sm font-medium ${theme.muted}`}>Major</label>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02 }}
                >
                  <Input 
                    name="major"
                    value={profile.major}
                    onChange={handleInputChange}
                    className={`transition-colors ${theme.input}`}
                  />
                </motion.div>
              </motion.div>
                </div>
              </div>

              <div className={`rounded-xl border p-4 ${isDarkMode ? 'border-slate-800/80 bg-slate-900/30' : 'border-slate-200 bg-slate-50/80'}`}>
                <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>About You</h3>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <label className={`text-sm font-medium ${theme.muted}`}>Bio</label>
                <motion.textarea 
                  name="bio"
                  value={profile.bio}
                  onChange={handleInputChange}
                  rows={4}
                  whileHover={{ scale: 1.01 }}
                  whileFocus={{ scale: 1.01 }}
                  placeholder="Write a short intro about yourself (optional)"
                  className={`w-full rounded-md border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${theme.input}`}
                />
              </motion.div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex items-center justify-between"
            >
              {saveMessage ? (
                <p className="text-sm text-emerald-400">{saveMessage}</p>
              ) : (
                <span />
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 shadow-lg shadow-purple-500/20">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                  </motion.div>
                  Save Changes
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className={`border rounded-2xl p-6 backdrop-blur-xl flex items-center justify-between ${theme.danger}`}
          >
            <div>
              <h3 className="text-lg font-bold text-red-400">Danger Zone</h3>
              <p className={`text-sm ${theme.muted}`}>Once you delete your account, there is no going back. Please be certain.</p>
            </div>
            <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
              Delete Account
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
