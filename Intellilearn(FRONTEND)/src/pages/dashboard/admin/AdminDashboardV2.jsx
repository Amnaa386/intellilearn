import React, { useMemo, useState } from 'react';
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

const summaryCards = [
  { key: 'totalUsers', title: 'Total Users', value: '8,420', change: '+12.5%', icon: Users, color: 'from-blue-500 to-cyan-500' },
  { key: 'activeUsers', title: 'Active Users', value: '3,186', change: '+8.2%', icon: LayoutDashboard, color: 'from-emerald-500 to-teal-500' },
  { key: 'aiRequests', title: 'Total AI Requests', value: '129,438', change: '+19.1%', icon: BrainCircuit, color: 'from-violet-500 to-purple-500' },
  { key: 'quizzes', title: 'Quizzes Generated', value: '12,906', change: '+9.8%', icon: Sparkles, color: 'from-amber-500 to-orange-500' },
  { key: 'notes', title: 'Notes Created', value: '36,477', change: '+14.6%', icon: FileText, color: 'from-indigo-500 to-blue-500' },
];

const initialUsers = [
  { id: 1, name: 'Aarav Mehta', email: 'aarav@intellilearn.ai', role: 'Student', status: 'Active', joined: '2026-04-02' },
  { id: 2, name: 'Sara Khan', email: 'sara.khan@intellilearn.ai', role: 'Student', status: 'Active', joined: '2026-03-28' },
  { id: 3, name: 'Dr. Emily Chen', email: 'echen@intellilearn.ai', role: 'Teacher', status: 'Inactive', joined: '2026-03-18' },
  { id: 4, name: 'Noah Reed', email: 'nreed@intellilearn.ai', role: 'Student', status: 'Pending', joined: '2026-04-10' },
];

const featureUsage = [
  { name: 'AI Chat', value: 38, color: '#3b82f6' },
  { name: 'PPT Explain', value: 22, color: '#8b5cf6' },
  { name: 'Quiz Gen', value: 24, color: '#14b8a6' },
  { name: 'Notes', value: 16, color: '#f59e0b' },
];

const dailyAiTraffic = [
  { day: 'Mon', requests: 18230 },
  { day: 'Tue', requests: 19440 },
  { day: 'Wed', requests: 20750 },
  { day: 'Thu', requests: 22310 },
  { day: 'Fri', requests: 21080 },
  { day: 'Sat', requests: 17330 },
  { day: 'Sun', requests: 14980 },
];

const commonQueries = [
  'Explain this PPT slide in simple terms',
  'Create a quiz from chapter 4',
  'Summarize this lesson into notes',
  'Give me a 5-minute quick revision',
];

const activityLogs = [
  { id: 1, action: 'Generated quiz from Biology module', user: 'Sara Khan', time: '2 min ago' },
  { id: 2, action: 'Requested PPT explanation', user: 'Aarav Mehta', time: '8 min ago' },
  { id: 3, action: 'Created AI notes for Physics lesson', user: 'Noah Reed', time: '21 min ago' },
  { id: 4, action: 'Completed 20 AI chat prompts', user: 'Emily Chen', time: '35 min ago' },
];

const systemSettingsSeed = [
  { id: 'chat', label: 'Enable AI Chat', enabled: true },
  { id: 'ppt', label: 'Enable PPT Explanations', enabled: true },
  { id: 'quiz', label: 'Enable Quiz Generation', enabled: true },
  { id: 'notes', label: 'Enable Notes Generation', enabled: true },
  { id: 'safeMode', label: 'Strict Moderation Mode', enabled: false },
];

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
            <option>Teacher</option>
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

export default function AdminDashboardV2() {
  const { pathname } = useLocation();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [settings, setSettings] = useState(systemSettingsSeed);

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

      {(view === 'overview' || view === 'analytics') && (
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
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Recent Activity Logs">
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
                  <p className="text-sm text-slate-200">{log.action}</p>
                  <p className="mt-1 text-xs text-slate-500">{log.user} - {log.time}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Common User Queries">
            <ul className="space-y-2">
              {commonQueries.map((query) => (
                <li key={query} className="flex items-start gap-2 text-sm text-slate-300">
                  <ChevronRight className="mt-0.5 h-4 w-4 text-blue-400" />
                  <span>{query}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      )}

      {view === 'users' && (
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
                        onClick={() => setUsers((prev) => prev.filter((row) => row.id !== u.id))}
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
      )}

      {view === 'ai-activity' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionCard title="AI Request Frequency (Last 7 Days)">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyAiTraffic}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                    <Bar dataKey="requests" radius={[8, 8, 0, 0]} fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>
          <SectionCard title="Most Used Features">
            <div className="space-y-3">
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
      )}

      {view === 'analytics' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SectionCard title="Usage Patterns">
            <p className="mb-3 text-sm text-slate-400">Peak activity observed between 4 PM and 9 PM, primarily from quiz and revision features.</p>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">Daily active ratio: 37.8%</div>
              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">Average AI prompts per active user: 12.4</div>
              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">Retention of power users (30-day): 81.2%</div>
            </div>
          </SectionCard>
          <SectionCard title="System Insights">
            <div className="space-y-2 text-sm text-slate-300">
              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">Most requested topic: "Exam quick revision"</div>
              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">Most common query style: "Explain in simple language"</div>
              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">Fastest-growing feature: AI quiz generation (+22% WoW)</div>
            </div>
          </SectionCard>
        </div>
      )}

      {view === 'settings' && (
        <SectionCard title="System Settings">
          <div className="space-y-3">
            {settings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/40 p-3">
                <span className="text-sm text-slate-200">{setting.label}</span>
                <button
                  onClick={() =>
                    setSettings((prev) =>
                      prev.map((row) => (row.id === setting.id ? { ...row, enabled: !row.enabled } : row)),
                    )
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
      )}

      <AddUserModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(data) =>
          setUsers((prev) => [{ id: Date.now(), ...data, status: 'Active', joined: '2026-04-20' }, ...prev])
        }
      />
    </div>
  );
}
