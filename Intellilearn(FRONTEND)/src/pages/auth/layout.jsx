'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Link, Outlet } from 'react-router-dom';
import BrandLogo from '@/components/branding/BrandLogo';

export default function AuthLayout({
  children,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Background: soft AI / edtech gradient + subtle mesh + floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_40%,transparent_100%)]" />
        <motion.div
          animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
          className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-600/20 blur-3xl"
        />
        <motion.div
          animate={{ opacity: [0.15, 0.28, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-1/2 h-64 w-[120%] -translate-x-1/2 rounded-[100%] bg-gradient-to-t from-indigo-600/10 to-transparent blur-2xl"
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 border-b border-slate-800/50 relative z-10"
      >
        <Link to="/" className="flex items-center gap-2 inline-block">
          <BrandLogo iconClassName="h-10 w-10" textClassName="text-xl" />
        </Link>
      </motion.header>

      {/* Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
        {children || <Outlet />}
      </div>
    </div>
  );
}
