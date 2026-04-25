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
  const [profile, setProfile] = useState({
    name: 'User',
    email: 'user@university.edu',
    major: 'Computer Science',
    university: 'State University of Technology',
    bio: 'Passionate about learning and academic excellence.'
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('intellilearn_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser) {
          setProfile(prev => ({
            ...prev,
            name: parsedUser.name || prev.name,
            email: parsedUser.email || `${parsedUser.name?.toLowerCase().replace(/\s+/g, '.')}@university.edu`
          }));
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);
  
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2000&auto=format&fit=crop');
  const fileInputRef = useRef(null);

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
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
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
      {/* Background Animated Gradient */}
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
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
        </div>
        <p className="text-slate-400">Manage your profile, preferences, and account security.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Navigation/Profile Summary */}
        <div className="space-y-6">
          <motion.div 
            variants={itemVariants}
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl text-center"
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
                className="w-32 h-32 rounded-full border-4 border-blue-500/20 overflow-hidden mb-4"
              >
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
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
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {profile.name}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </motion.div>
              </h3>
              <p className="text-slate-400 text-sm">{profile.major}</p>
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
                <Button variant="outline" className="w-full border-slate-800 text-slate-300 justify-start">
                  <Shield className="w-4 h-4 mr-3" /> Security
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="outline" className="w-full border-slate-800 text-slate-300 justify-start">
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
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-blue-400" />
              Personal Information
            </h2>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ staggerChildren: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-slate-400">Full Name</label>
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
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white focus:border-blue-500 transition-colors"
                  />
                </motion.div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-slate-400">Email Address</label>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02 }}
                  className="relative"
                >
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <Input 
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white focus:border-blue-500 transition-colors"
                  />
                </motion.div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-slate-400">University</label>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02 }}
                >
                  <Input 
                    name="university"
                    value={profile.university}
                    onChange={handleInputChange}
                    className="bg-slate-800/50 border-slate-700 text-white focus:border-blue-500 transition-colors"
                  />
                </motion.div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-slate-400">Major</label>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02 }}
                >
                  <Input 
                    name="major"
                    value={profile.major}
                    onChange={handleInputChange}
                    className="bg-slate-800/50 border-slate-700 text-white focus:border-blue-500 transition-colors"
                  />
                </motion.div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="md:col-span-2 space-y-2"
              >
                <label className="text-sm font-medium text-slate-400">Bio</label>
                <motion.textarea 
                  name="bio"
                  value={profile.bio}
                  onChange={handleInputChange}
                  rows={4}
                  whileHover={{ scale: 1.01 }}
                  whileFocus={{ scale: 1.01 }}
                  className="w-full rounded-md bg-slate-800/50 border border-slate-700 text-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex justify-end"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 shadow-lg shadow-purple-500/20">
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
            className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 backdrop-blur-xl flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-bold text-red-400">Danger Zone</h3>
              <p className="text-slate-400 text-sm">Once you delete your account, there is no going back. Please be certain.</p>
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
