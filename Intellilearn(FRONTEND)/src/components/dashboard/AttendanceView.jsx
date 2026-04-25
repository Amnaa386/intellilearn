'use client';


import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Flame,
  ChevronLeft,
  ChevronRight,
  Info,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  getDay, 
  addMonths, 
  subMonths,
  isWeekend,
  startOfWeek,
  endOfWeek,
  isAfter,
  isBefore,
  getYear,
  getMonth,
  setYear,
  setMonth
} from 'date-fns';
import { containerVariants, itemVariants } from '@/lib/animations';
import { MonthlyAttendanceBar, YearlyAttendanceLine, DailyAttendanceBar } from './AttendanceCharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AttendanceView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Mock data generation based on selected date
  const attendanceData = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      if (isWeekend(day)) return { date: day, status: 'weekend' };
      if (isAfter(day, new Date())) return { date: day, status: 'upcoming' };
      
      // Seeded random for consistency
      const seed = day.getDate() + day.getMonth() * 31 + day.getFullYear();
      const random = Math.sin(seed) * 10000;
      const val = random - Math.floor(random);
      
      let status = 'present';
      if (val < 0.1) status = 'absent';
      else if (val < 0.2) status = 'late';
      
      return { date: day, status };
    });
  }, [currentDate]);

  const analytics = useMemo(() => {
    const weekDays = attendanceData.filter(d => d.status !== 'weekend' && d.status !== 'upcoming');
    const totalDays = weekDays.length;
    const presentDays = weekDays.filter(d => d.status === 'present').length;
    const lateDays = weekDays.filter(d => d.status === 'late').length;
    const absentDays = weekDays.filter(d => d.status === 'absent').length;
    
    const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays * 0.7) / totalDays) * 100) : 0;
    
    // Calculate streak (consecutive present/late days up to today)
    let streak = 0;
    const sortedDays = [...attendanceData]
      .filter(d => !isWeekend(d.date) && !isAfter(d.date, new Date()))
      .sort((a, b) => b.date - a.date);
    
    for (const d of sortedDays) {
      if (d.status === 'present' || d.status === 'late') streak++;
      else if (d.status === 'absent') break;
    }

    return {
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      attendanceRate,
      streak,
      warning: attendanceRate < 75 && totalDays > 5,
      improvement: 4.2, // Mock improvement
    };
  }, [attendanceData]);

  const chartData = useMemo(() => {
    const dailyLabels = attendanceData
      .filter(d => !isWeekend(d.date))
      .map(d => format(d.date, 'd MMM'));
    
    const dailyValues = attendanceData
      .filter(d => !isWeekend(d.date))
      .map(d => {
        if (d.status === 'present') return 100;
        if (d.status === 'late') return 70;
        if (d.status === 'absent') return 0;
        return -1; // Use -1 for upcoming days to distinguish from absent
      });

    // Generate last 6 months trend ending at currentDate
    const trendLabels = [];
    const trendValues = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(currentDate, i);
      trendLabels.push(format(date, 'MMM yy'));
      
      // If it's the current selected month, use the calculated rate
      if (i === 0) {
        trendValues.push(analytics.attendanceRate);
      } else {
        // Seeded random for previous months' rates
        const seed = getMonth(date) + getYear(date) * 12;
        const val = 75 + (Math.sin(seed) * 15); // Random between 60-90
        trendValues.push(Math.round(val));
      }
    }

    return {
      daily: {
        labels: dailyLabels,
        values: dailyValues,
      },
      yearly: {
        labels: trendLabels,
        values: trendValues,
      }
    };
  }, [attendanceData, analytics.attendanceRate, currentDate]);

  const calendarGrid = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const firstDayOfMonth = getDay(start); // 0 (Sun) to 6 (Sat)
    
    // Adjust to start from Monday (0: Mon, 6: Sun)
    const prefixDaysCount = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);
    
    const days = [];
    
    // Prefix days from previous month
    const prevMonthEnd = endOfMonth(subMonths(currentDate, 1));
    for (let i = prefixDaysCount - 1; i >= 0; i--) {
      days.push({ 
        date: new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), prevMonthEnd.getDate() - i),
        isCurrentMonth: false,
        status: 'other-month'
      });
    }
    
    // Current month days
    attendanceData.forEach(d => {
      days.push({ ...d, isCurrentMonth: true });
    });
    
    // Suffix days to complete the grid (usually 42 cells)
    const suffixDaysCount = 42 - days.length;
    for (let i = 1; i <= suffixDaysCount; i++) {
      const nextMonthStart = startOfMonth(addMonths(currentDate, 1));
      days.push({
        date: new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth(), i),
        isCurrentMonth: false,
        status: 'other-month'
      });
    }
    
    return days;
  }, [currentDate, attendanceData]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'absent': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'late': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return null;
    }
  };

  const getStatusColor = (day) => {
    if (!day.isCurrentMonth) return 'bg-slate-900/20 border-slate-800/50 opacity-30';
    if (day.status === 'weekend') return 'bg-slate-800/30 border-slate-700/30 text-slate-500';
    if (day.status === 'upcoming') return 'bg-slate-800/10 border-slate-700/20 text-slate-600';
    
    switch (day.status) {
      case 'present': return 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400';
      case 'absent': return 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400';
      case 'late': return 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-400';
      default: return 'bg-slate-800/50 border-slate-700/50';
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - 2 + i);

  const handleMonthChange = (val) => {
    const monthIdx = months.indexOf(val);
    setCurrentDate(prev => setMonth(prev, monthIdx));
  };

  const handleYearChange = (val) => {
    const year = parseInt(val);
    setCurrentDate(prev => setYear(prev, year));
  };

  const nextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const prevMonth = () => setCurrentDate(prev => subMonths(prev, 1));

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl backdrop-blur-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-blue-400" />
            </div>
            Attendance Intelligence
          </h2>
          <p className="text-slate-400 text-sm">Detailed tracking and performance insights for your learning journey.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-900/60 rounded-xl border border-slate-700 p-1">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-slate-400 hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Select value={months[getMonth(currentDate)]} onValueChange={handleMonthChange}>
              <SelectTrigger className="border-0 bg-transparent focus:ring-0 h-8 text-sm font-medium w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={getYear(currentDate).toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="border-0 bg-transparent focus:ring-0 h-8 text-sm font-medium w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-slate-400 hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Attendance Rate', 
            value: `${analytics.attendanceRate}%`, 
            icon: TrendingUp, 
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            sub: analytics.warning ? 'Below threshold' : 'On track',
            subColor: analytics.warning ? 'text-red-400' : 'text-green-400'
          },
          { 
            label: 'Current Streak', 
            value: `${analytics.streak} Days`, 
            icon: Flame, 
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            sub: 'Personal best: 15',
            subColor: 'text-slate-400'
          },
          { 
            label: 'Total Present', 
            value: analytics.presentDays, 
            icon: CheckCircle, 
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            sub: `+${analytics.improvement}% from last month`,
            subColor: 'text-green-400'
          },
          { 
            label: 'Days Absent', 
            value: analytics.absentDays, 
            icon: AlertCircle, 
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            sub: analytics.absentDays > 3 ? 'Action required' : 'Acceptable',
            subColor: analytics.absentDays > 3 ? 'text-red-400' : 'text-slate-400'
          }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {i === 0 && analytics.warning && (
                <div className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
              )}
            </div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
            <p className={`text-xs mt-2 flex items-center gap-1 ${stat.subColor}`}>
              {stat.subColor === 'text-green-400' && <ArrowUpRight className="w-3 h-3" />}
              {stat.subColor === 'text-red-400' && <ArrowDownRight className="w-3 h-3" />}
              {stat.sub}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar Card */}
        <div className="xl:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Monthly Calendar</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                <span className="text-slate-400">Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <span className="text-slate-400">Absent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <span className="text-slate-400">Late</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-500 py-2 uppercase tracking-tighter">
                {day}
              </div>
            ))}
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentDate.toISOString()}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={{
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: -10 }
                }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-7 gap-2 col-span-7"
              >
                {calendarGrid.map((day, idx) => (
                  <TooltipProvider key={idx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          whileHover={day.isCurrentMonth ? { scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' } : {}}
                          className={`
                            relative group p-2 min-h-[70px] rounded-xl border transition-all duration-200
                            flex flex-col items-center justify-between
                            ${getStatusColor(day)}
                            ${day.isCurrentMonth ? 'cursor-pointer' : 'cursor-default'}
                          `}
                        >
                          <span className={`text-sm font-bold ${!day.isCurrentMonth ? 'text-slate-700' : 'text-slate-200'}`}>
                            {day.date.getDate()}
                          </span>
                          <div className="mt-1">
                            {getStatusIcon(day.status)}
                          </div>
                          {isSameDay(day.date, new Date()) && (
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
                          )}
                        </motion.div>
                      </TooltipTrigger>
                      {day.isCurrentMonth && day.status !== 'weekend' && day.status !== 'upcoming' && (
                        <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                          <p className="font-medium capitalize">{day.status}</p>
                          <p className="text-xs text-slate-400">{format(day.date, 'PPPP')}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Charts & Insights Card */}
        <div className="space-y-6">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              Daily Distribution
              <Info className="w-4 h-4 text-slate-500" />
            </h3>
            <div className="h-[200px]">
              <DailyAttendanceBar key={`daily-${currentDate.toISOString()}`} data={chartData.daily} />
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Insights</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-blue-500/20 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-semibold text-blue-400">Trend Analysis</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your attendance has improved by <span className="text-green-400 font-bold">5.2%</span> compared to last month. Keep up the consistency!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-orange-500/20 rounded-lg">
                    <Flame className="w-4 h-4 text-orange-400" />
                  </div>
                  <span className="text-sm font-semibold text-orange-400">Active Streak</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You're on a <span className="text-orange-400 font-bold">{analytics.streak} day</span> streak. Only 3 more days to reach your personal record!
                </p>
              </div>

              {analytics.warning && (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-red-500/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-sm font-semibold text-red-400">Low Attendance Warning</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Your attendance is currently below the 75% threshold. We recommend attending more sessions to avoid falling behind.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Yearly Trend Chart */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Attendance Trend (6 Months)</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current Average:</span>
            <span className="text-xs font-bold text-blue-400">86.4%</span>
          </div>
        </div>
        <div className="h-[250px]">
          <YearlyAttendanceLine key={`yearly-${currentDate.toISOString()}`} data={chartData.yearly} />
        </div>
      </div>
    </motion.div>
  );
}

