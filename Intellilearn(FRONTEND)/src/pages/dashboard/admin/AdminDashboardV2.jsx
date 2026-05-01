import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  BrainCircuit,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  createAdminUser,
  deleteAdminUser,
  getAdminAiActivity,
  getAdminAnalytics,
  getAdminCommonQueries,
  getAdminOverview,
  getAdminSettings,
  getAdminUsers,
  updateAdminSetting,
  getAdminActivityLogs,
} from '@/lib/adminApi';

const defaultFeatureUsage = [
  { name: 'AI Chat', value: 38, color: '#3b82f6' },
  { name: 'PPT Explain', value: 22, color: '#8b5cf6' },
  { name: 'Quiz Gen', value: 24, color: '#14b8a6' },
  { name: 'Notes', value: 16, color: '#f59e0b' },
];

const defaultDailyAiTraffic = [];
const defaultCommonQueries = [];
const defaultActivityLogs = [];
const defaultSettings = [];

function AddUserModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'Student' });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Add New User</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Full name"
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Student</option>
            <option>Admin</option>
          </select>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl bg-slate-800 py-2 text-sm text-slate-300 hover:bg-slate-700">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!form.name.trim() || !form.email.trim()) return;
              onAdd(form);
              setForm({ name: '', email: '', role: 'Student' });
              onClose();
            }}
            className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add User
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SectionCard({ title, children, action }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function LoadingBlock({ className = 'h-16' }) {
  return <div className={`animate-pulse rounded-xl border border-slate-800 bg-slate-900/40 ${className}`} />;
}

function ViewLoadingSkeleton({ view }) {
  if (view === 'users') {
    return (
      <div className="space-y-4">
        <LoadingBlock className="h-12" />
        <LoadingBlock className="h-80" />
      </div>
    );
  }

  if (view === 'ai-activity') {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <LoadingBlock className="h-80 lg:col-span-2" />
        <LoadingBlock className="h-80" />
      </div>
    );
  }

  if (view === 'analytics') {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <LoadingBlock className="h-64" />
        <LoadingBlock className="h-64" />
      </div>
    );
  }

  if (view === 'settings') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <LoadingBlock key={idx} className="h-14" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <LoadingBlock key={idx} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <LoadingBlock className="h-72" />
        <LoadingBlock className="h-72" />
        <LoadingBlock className="h-72" />
      </div>
    </div>
  );
}

export default function AdminDashboardV2() {
  const { pathname } = useLocation();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [summary, setSummary] = useState(null);
  const [featureUsage, setFeatureUsage] = useState(defaultFeatureUsage);
  const [dailyAiTraffic, setDailyAiTraffic] = useState(defaultDailyAiTraffic);
  const [commonQueries, setCommonQueries] = useState(defaultCommonQueries);
  const [activityLogs, setActivityLogs] = useState(defaultActivityLogs);
  const [analyticsInsights, setAnalyticsInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [activityTimeframe, setActivityTimeframe] = useState('weekly');

  const summaryCards = useMemo(() => {
    const s = summary || {};
    return [
      { key: 'totalUsers', title: 'Total Users', value: String(s.totalUsers ?? 0), change: `${s.userGrowth ?? 0}%`, icon: Users, color: 'from-blue-500 to-cyan-500' },
      { key: 'activeUsers', title: 'Active Users', value: String(s.activeUsers ?? 0), change: `${s.engagementRate ?? 0}% active`, icon: LayoutDashboard, color: 'from-emerald-500 to-teal-500' },
      { key: 'aiRequests', title: 'Total AI Requests', value: String(s.aiRequests ?? 0), change: `${s.requestGrowth ?? 0}%`, icon: BrainCircuit, color: 'from-violet-500 to-purple-500' },
      { key: 'quizzes', title: 'Quizzes Generated', value: String(s.quizzesGenerated ?? 0), change: '-', icon: Sparkles, color: 'from-amber-500 to-orange-500' },
      { key: 'notes', title: 'Notes Created', value: String(s.notesCreated ?? 0), change: '-', icon: FileText, color: 'from-indigo-500 to-blue-500' },
    ];
  }, [summary]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const term = search.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.role.toLowerCase().includes(term));
  }, [search, users]);

  const view = useMemo(() => {
    if (pathname.includes('/users')) return 'users';
    if (pathname.includes('/ai-activity')) return 'ai-activity';
    if (pathname.includes('/analytics')) return 'analytics';
    if (pathname.includes('/settings')) return 'settings';
    return 'overview';
  }, [pathname]);

  useEffect(() => {
    let mounted = true;
    const loadAdminData = async () => {
      setLoading(true);
      setError('');
      const tasks = [];
      if (view === 'users') {
        tasks.push(getAdminUsers({ page: 1, limit: 100 }));
      } else if (view === 'settings') {
        tasks.push(getAdminSettings());
      } else if (view === 'ai-activity') {
        tasks.push(getAdminAiActivity(activityTimeframe), getAdminAnalytics(activityTimeframe));
      } else if (view === 'analytics') {
        tasks.push(getAdminOverview(), getAdminAnalytics(activityTimeframe), getAdminCommonQueries());
      } else {
        tasks.push(
          getAdminOverview(),
          getAdminAiActivity('weekly'),
          getAdminCommonQueries(),
          getAdminActivityLogs({ page: 1, limit: 10 }),
        );
      }
      const results = await Promise.allSettled(tasks);

      if (!mounted) return;

      const resultAt = (i) => results[i] || { status: 'rejected', reason: { message: 'No response' } };
      const overviewRes = view === 'users' || view === 'settings' || view === 'ai-activity' ? null : resultAt(0);
      const usersRes = view === 'users' ? resultAt(0) : null;
      const aiRes = view === 'ai-activity' ? resultAt(0) : (view === 'overview' ? resultAt(1) : null);
      const analyticsRes = view === 'ai-activity' ? resultAt(1) : (view === 'analytics' ? resultAt(1) : null);
      const settingsRes = view === 'settings' ? resultAt(0) : null;
      const queriesRes = view === 'analytics' ? resultAt(2) : (view === 'overview' ? resultAt(2) : null);
      const logsRes = view === 'overview' ? resultAt(3) : null;
      const errors = results
        .filter((r) => r.status === 'rejected')
        .map((r) => r.reason?.message)
        .filter(Boolean);

      if (overviewRes?.status === 'fulfilled') {
        setSummary(overviewRes.value || null);
      }
      if (usersRes?.status === 'fulfilled') {
        setUsers((usersRes.value?.users || []).map((u) => ({
          id: u.id,
          name: u.name || 'Unknown User',
          email: u.email || '-',
          role: (u.role || 'student').replace(/^./, (ch) => ch.toUpperCase()),
          status: (u.status || 'active').replace(/^./, (ch) => ch.toUpperCase()),
          joined: u.createdAt ? String(u.createdAt).slice(0, 10) : '-',
        })));
      }
      if (aiRes?.status === 'fulfilled') {
        const normalizedFeatureName = (rawName) => {
          const key = String(rawName || '').toLowerCase();
          if (key.includes('ppt')) return 'PPT Generation';
          if (key.includes('voice')) return 'Video Lectures';
          if (key.includes('notes')) return 'Notes Generated';
          return rawName || 'Feature';
        };
        const usageRows = (aiRes.value?.featureUsage || []).map((f, index) => ({
          name: normalizedFeatureName(f.feature) || `Feature ${index + 1}`,
          value: Number(f.usage || 0),
          color: defaultFeatureUsage[index % defaultFeatureUsage.length].color,
        })) || defaultFeatureUsage;
        const totalUsage = usageRows.reduce((acc, row) => acc + row.value, 0);
        setFeatureUsage(
          usageRows.map((row) => ({
            ...row,
            value: totalUsage > 0 ? Math.round((row.value / totalUsage) * 100) : 0,
          })),
        );
        setDailyAiTraffic((aiRes.value?.dailyTraffic || []).map((d) => ({
          day: d.day || d.date || 'N/A',
          requests: Number(d.requests || d.count || 0),
        })) || defaultDailyAiTraffic);
      }
      if (settingsRes?.status === 'fulfilled') {
        setSettings(settingsRes.value?.settings || defaultSettings);
      }
      if (queriesRes?.status === 'fulfilled') {
        setCommonQueries(queriesRes.value?.queries?.length ? queriesRes.value.queries : defaultCommonQueries);
      }
      if (logsRes?.status === 'fulfilled') {
        setActivityLogs((logsRes.value?.logs || []).map((l, idx) => ({
          id: l.id || idx,
          action: l.action || l.type || 'System activity',
          user: l.userName || l.userId || 'unknown-user',
          userId: l.userId || 'unknown-user',
          details: l.details || {},
          time: l.timestamp ? new Date(l.timestamp).toLocaleString() : 'recent',
        })) || defaultActivityLogs);
      }
      if (analyticsRes?.status === 'fulfilled') {
        setAnalyticsInsights(analyticsRes.value || null);
      }

      // Show error only when critical datasets fail; avoid noisy banner
      // when non-critical analytics endpoints are slow.
      const criticalError =
        (usersRes?.status === 'rejected' && usersRes.reason?.message) ||
        (overviewRes?.status === 'rejected' && overviewRes.reason?.message) ||
        '';
      setError(criticalError || errors[0] || '');
      setLoading(false);
    };

    loadAdminData();
    return () => {
      mounted = false;
    };
  }, [view]);

  useEffect(() => {
    let mounted = true;
    if (view !== 'ai-activity') return undefined;
    const loadTimeframedAi = async () => {
      setLoading(true);
      try {
        const [aiActivity, adminAnalytics] = await Promise.all([
          getAdminAiActivity(activityTimeframe),
          getAdminAnalytics(activityTimeframe),
        ]);
        if (!mounted) return;

        const usageRows = (aiActivity?.featureUsage || []).map((f, index) => ({
          name: f.feature || `Feature ${index + 1}`,
          value: Number(f.usage || 0),
          color: defaultFeatureUsage[index % defaultFeatureUsage.length].color,
        }));
        const totalUsage = usageRows.reduce((acc, row) => acc + row.value, 0);
        setFeatureUsage(
          usageRows.length
            ? usageRows.map((row) => ({
                ...row,
                value: totalUsage > 0 ? Math.round((row.value / totalUsage) * 100) : 0,
              }))
            : defaultFeatureUsage,
        );
        setDailyAiTraffic(
          (aiActivity?.dailyTraffic || []).map((d) => ({
            day: d.day || d.date || 'N/A',
            requests: Number(d.requests || d.count || 0),
          })),
        );
        setAnalyticsInsights(adminAnalytics || null);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load AI activity data.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadTimeframedAi();
    return () => {
      mounted = false;
    };
  }, [activityTimeframe, view]);

  const handleAddUser = async (data) => {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: 'Admin1234',
        role: String(data.role || 'Student').toLowerCase(),
        status: 'active',
      };
      const created = await createAdminUser(payload);
      setUsers((prev) => [
        {
          id: created.id,
          name: created.name,
          email: created.email,
          role: String(created.role || 'student').replace(/^./, (ch) => ch.toUpperCase()),
          status: String(created.status || 'active').replace(/^./, (ch) => ch.toUpperCase()),
          joined: String(created.createdAt || '').slice(0, 10),
        },
        ...prev,
      ]);
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to create user.');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((row) => row.id !== id));
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to delete user.');
    }
  };

  const handleToggleSetting = async (settingId, enabled) => {
    try {
      await updateAdminSetting(settingId, enabled);
      setSettings((prev) => prev.map((row) => (row.id === settingId ? { ...row, enabled } : row)));
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to update setting.');
    }
  };

  return (
    <div className="relative min-h-screen space-y-6 text-slate-200">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-blue-600/10 blur-[90px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-purple-600/10 blur-[110px]" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">IntelliLearn Admin Dashboard</h1>
          <p className="text-sm text-slate-400">AI system management, user control, and activity monitoring.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users, logs, features..."
            className="w-52 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
          <Bell className="h-4 w-4 text-slate-500" />
          <Settings className="h-4 w-4 text-slate-500" />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {(view === 'overview' || view === 'analytics') && !loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-xl bg-gradient-to-br p-2 ${card.color}`}>
                  <card.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-emerald-400">{card.change}</span>
              </div>
              <p className="text-xs text-slate-400">{card.title}</p>
              <p className="text-xl font-bold text-white">{card.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {view === 'overview' && (
        loading ? (
          <ViewLoadingSkeleton view="overview" />
        ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <SectionCard title="AI Feature Usage Overview">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={featureUsage} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85}>
                    {featureUsage.map((f) => (
                      <Cell key={f.name} fill={f.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#e2e8f0' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Recent Activity Logs">
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {!activityLogs.length && !loading && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-sm text-slate-400">
                  No activity logs yet.
                </div>
              )}
              {activityLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-slate-200">{log.action}</p>
                      <p className="mt-1 text-xs text-slate-500">{log.user} - {log.time}</p>
                    </div>
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
                    >
                      View details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Common User Queries">
            <ul className="space-y-2">
              {!commonQueries.length && !loading && (
                <li className="text-sm text-slate-400">No query data available yet.</li>
              )}
              {commonQueries.map((query) => (
                <li key={query} className="flex items-start gap-2 text-sm text-slate-300">
                  <ChevronRight className="mt-0.5 h-4 w-4 text-blue-400" />
                  <span>{query}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
        )
      )}

      {view === 'users' && (
        loading ? (
          <ViewLoadingSkeleton view="users" />
        ) : (
        <SectionCard
          title="User Management"
          action={
            <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
              <UserPlus className="h-4 w-4" /> Add User
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3">Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!filteredUsers.length && !loading && (
                  <tr>
                    <td className="py-4 text-slate-400" colSpan={6}>No users found.</td>
                  </tr>
                )}
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800/70 text-sm text-slate-300 hover:bg-slate-800/40">
                    <td className="py-3">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.status}</td>
                    <td>{u.joined}</td>
                    <td className="text-right">
                      <button className="mr-2 rounded-lg border border-slate-700 px-2 py-1 text-xs hover:bg-slate-700">View</button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="rounded-lg border border-rose-500/40 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
        )
      )}

      {view === 'ai-activity' && (
        loading ? (
          <ViewLoadingSkeleton view="ai-activity" />
        ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionCard
              title="AI Request Frequency"
              action={
                <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900/70 p-1 text-xs">
                  {[
                    { id: 'daily', label: 'Daily' },
                    { id: 'weekly', label: 'Weekly' },
                    { id: 'monthly', label: 'Monthly' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActivityTimeframe(tab.id)}
                      className={`rounded-md px-2 py-1 transition ${
                        activityTimeframe === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyAiTraffic}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#e2e8f0' }}
                      labelStyle={{ color: '#e2e8f0' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="requests" radius={[8, 8, 0, 0]} fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>
          <SectionCard title="Most Used Features">
            <div className="space-y-3">
              {!featureUsage.length && !loading && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-sm text-slate-400">
                  No feature usage data in selected range.
                </div>
              )}
              {featureUsage.map((feature) => (
                <div key={feature.name}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                    <span>{feature.name}</span>
                    <span>{feature.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full" style={{ width: `${feature.value}%`, backgroundColor: feature.color }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
        )
      )}

      {view === 'analytics' && (
        loading ? (
          <ViewLoadingSkeleton view="analytics" />
        ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SectionCard title="Usage Patterns">
            <p className="mb-3 text-sm text-slate-400">Peak activity observed between 4 PM and 9 PM, primarily from quiz and revision features.</p>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">Daily active ratio: {summary?.engagementRate ?? 0}%</div>
              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">Total active users: {summary?.activeUsers ?? 0}</div>
              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">Total AI requests (30-day): {summary?.aiRequests ?? 0}</div>
            </div>
          </SectionCard>
          <SectionCard title="System Insights">
            <div className="space-y-2 text-sm text-slate-300">
              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">Most requested topic: "{analyticsInsights?.systemHealth?.database === 'connected' ? 'Live data available' : 'N/A'}"</div>
              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">Most common query style: "{commonQueries[0] || 'N/A'}"</div>
              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">System health: DB {analyticsInsights?.systemHealth?.database || 'unknown'}, Redis {analyticsInsights?.systemHealth?.redis || 'unknown'}</div>
            </div>
          </SectionCard>
        </div>
        )
      )}

      {view === 'settings' && (
        loading ? (
          <ViewLoadingSkeleton view="settings" />
        ) : (
        <SectionCard title="System Settings">
          <div className="space-y-3">
            {!settings.length && !loading && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-sm text-slate-400">
                No settings available.
              </div>
            )}
            {settings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/40 p-3">
                <span className="text-sm text-slate-200">{setting.label}</span>
                <button
                  onClick={() =>
                    handleToggleSetting(setting.id, !setting.enabled)
                  }
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    setting.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {setting.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
        )
      )}

      <AddUserModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddUser}
      />

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Activity Details</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <p><span className="text-slate-500">Action:</span> {selectedLog.action}</p>
              <p><span className="text-slate-500">User:</span> {selectedLog.user}</p>
              <p><span className="text-slate-500">User ID:</span> {selectedLog.userId}</p>
              <p><span className="text-slate-500">Time:</span> {selectedLog.time}</p>
              <div>
                <p className="mb-1 text-slate-500">Meta:</p>
                <pre className="max-h-52 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-300">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
