'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Award, Clock } from 'lucide-react';
import { containerVariants, itemVariants } from '@/lib/animations';

import { Link } from 'react-router-dom';

export default function QuickStatsCards() {
  const stats = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'Learning Progress',
      value: '68%',
      change: '+5% this week',
      color: 'from-blue-500 to-cyan-600',
      href: '/dashboard/student/analytics',
    },
    {
      icon: <Target className="w-5 h-5" />,
      label: 'Current Streak',
      value: '7 days',
      change: 'Keep it going!',
      color: 'from-orange-500 to-pink-600',
    },
    {
      icon: <Award className="w-5 h-5" />,
      label: 'Badges Earned',
      value: '12',
      change: '+2 this month',
      color: 'from-purple-500 to-pink-600',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Study Time',
      value: '24h',
      change: 'This month',
      color: 'from-green-500 to-emerald-600',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((stat, idx) => {
        const CardContent = (
          <motion.div
            variants={itemVariants}
            className="group p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer h-full"
            whileHover={{ y: -4 }}
          >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all`}>
              <span className="text-white">{stat.icon}</span>
            </div>

            {/* Content */}
            <h3 className="text-sm font-medium text-slate-400 mb-1">{stat.label}</h3>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
            </div>

            {/* Change */}
            {stat.change && (
              <div className="text-xs text-slate-400 mt-2">{stat.change}</div>
            )}
          </motion.div>
        );

        return stat.href ? (
          <Link key={idx} to={stat.href}>
            {CardContent}
          </Link>
        ) : (
          <div key={idx}>
            {CardContent}
          </div>
        );
      })}
    </motion.div>
  );
}
