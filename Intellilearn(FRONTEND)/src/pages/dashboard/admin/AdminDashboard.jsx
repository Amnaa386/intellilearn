import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserPlus,
  ShieldCheck,
  BarChart3,
  Settings,
  Bell,
  Search,
  Filter,
  MoreVertical,
  Edit3,
  Trash2,
  Plus,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Database,
  Cpu,
  Globe,
  ArrowLeft,
  Mail,
  Smartphone,
  CreditCard,
  LogOut,
  HelpCircle,
  Save,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

// --- MOCK DATA ---
const systemStats = [
  { label: 'Total Students', value: '4,280', trend: '+12%', icon: Users, color: 'from-blue-500 to-indigo-600' },
  { label: 'System Uptime', value: '99.9%', trend: 'Stable', icon: Activity, color: 'from-amber-500 to-orange-600' },
];

const userData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Student', status: 'Active', joined: '2025-09-12' },
  { id: 2, name: 'Michael Brown', email: 'michael.b@example.com', role: 'Student', status: 'Active', joined: '2025-09-20' },
];

const activityData = [
  { time: '00:00', users: 120, load: 24 },
  { time: '04:00', users: 45, load: 12 },
  { time: '08:00', users: 850, load: 45 },
  { time: '12:00', users: 1200, load: 68 },
  { time: '16:00', users: 950, load: 52 },
  { time: '20:00', users: 450, load: 30 },
  { time: '23:59', users: 180, load: 20 },
];

const roleDistribution = [
  { name: 'Students', value: 4280, color: '#3b82f6' },
  { name: 'Admins', value: 5, color: '#10b981' },
];

// --- COMPONENTS ---

const StatCard = ({ item }) => {
  if (!item || !item.icon) return null;
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl p-6 rounded-2xl relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.color} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`} />
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} bg-opacity-10`}>
          <item.icon className="w-6 h-6 text-white" />
        </div>
        <div className={`text-xs font-bold ${item.trend === 'Stable' ? 'text-slate-400' : 'text-emerald-400'}`}>
          {item.trend}
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-slate-400 text-sm font-medium">{item.label}</h3>
        <span className="text-2xl font-bold text-white">{item.value}</span>
      </div>
    </motion.div>
  );
};

const AddUserModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Student' });
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Add New User</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
            <input 
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter name"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
            <input 
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">User Role</label>
            <select 
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option>Student</option>
              <option>Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700">Cancel</button>
            <button 
              onClick={() => { onAdd(formData); onClose(); }}
              className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20"
            >
              Create User
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const UserManagement = ({ onAddUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  const filteredUsers = userData.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });
  
  return (
    <motion.div 
      key="admin-users"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search users by name, email or role..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                showFilter ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Filter className="w-4 h-4" /> {filterRole === 'All' ? 'Filter' : filterRole}
            </button>
            <AnimatePresence>
              {showFilter && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-2"
                >
                  {['All', 'Student', 'Admin'].map(role => (
                    <button
                      key={role}
                      onClick={() => { setFilterRole(role); setShowFilter(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        filterRole === role ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={onAddUser}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl text-sm text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-800 bg-slate-900/40">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                        {user.name.split(' ').filter(Boolean).map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-200">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      user.role === 'Teacher' ? 'bg-emerald-500/10 text-emerald-400' :
                      user.role === 'Parent' ? 'bg-purple-500/10 text-purple-400' :
                      user.role === 'Admin' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                        user.status === 'Pending' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                        'bg-slate-500'
                      }`} />
                      <span className="text-xs text-slate-400">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{user.joined}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400"><Edit3 className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-sm">No users found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

const SystemAnalytics = () => (
  <motion.div 
    key="admin-analytics"
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
  >
    <div className="lg:col-span-2 space-y-8">
      {/* Real-time Load */}
      <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" /> Active Users & Server Load
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              <Area type="monotone" dataKey="load" stroke="#8b5cf6" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'DB Queries', value: '1.2M', icon: Database, color: 'text-blue-400' },
          { label: 'CPU Usage', value: '24%', icon: Cpu, color: 'text-emerald-400' },
          { label: 'Global Reach', value: '42 Countries', icon: Globe, color: 'text-purple-400' },
        ].map((s, i) => (
          <div key={i} className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
            <div className={`p-2 rounded-lg bg-slate-800 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">{s.label}</div>
              <div className="text-lg font-bold text-white">{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-8">
      <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white mb-6">Role Distribution</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={roleDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {roleDistribution.map((r, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="text-xs text-slate-400">{r.name}</span>
              </div>
              <span className="text-xs font-bold text-white">{((r.value / 8326) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

// --- MAIN DASHBOARD ---

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const [adminUser, setAdminUser] = useState({ name: 'Root Administrator', role: 'admin' });
  const [showAddUser, setShowAddUser] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'System Update Available', message: 'IntelliLearn v2.4.0 is ready for deployment.', time: 'Oct 18, 2025', isRead: false },
    { id: 2, title: 'Security Alert', message: 'New admin login from unrecognized IP.', time: 'Oct 17, 2025', isRead: true },
    { id: 3, title: 'Database Backup', message: 'Weekly automated backup successful.', time: 'Oct 16, 2025', isRead: true },
  ]);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('intellilearn_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser) setAdminUser(parsedUser);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  const getViewFromPath = () => {
    if (currentPath.includes('/users')) return 'users';
    if (currentPath.includes('/system')) return 'analytics';
    if (currentPath.includes('/notifications')) return 'notifications';
    if (currentPath.includes('/settings')) return 'settings';
    return 'overview';
  };

  const view = getViewFromPath();

  const renderView = () => {
    switch (view) {
      case 'overview':
        return (
          <motion.div 
            key="admin-overview"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {systemStats.map((stat, i) => <StatCard key={i} item={stat} />)}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">System Activity</h3>
                    <button onClick={() => navigate('/dashboard/admin/system')} className="text-xs text-blue-400 hover:underline">View Analytics</button>
                  </div>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-6">Recent Alerts</h3>
                <div className="space-y-4">
                  {[
                    { type: 'error', msg: 'Database connection spike detected.', time: '2m ago' },
                    { type: 'warning', msg: 'New teacher registration pending approval.', time: '15m ago' },
                    { type: 'success', msg: 'Weekly backup completed successfully.', time: '1h ago' },
                  ].map((alert, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        alert.type === 'error' ? 'bg-rose-500' : 
                        alert.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <div className="space-y-1">
                        <p className="text-xs text-slate-200 leading-tight">{alert.msg}</p>
                        <span className="text-[10px] text-slate-500">{alert.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-2 bg-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-700">Clear Alerts</button>
              </div>
            </div>
          </motion.div>
        );
      case 'users':
        return <UserManagement key="admin-users-view" onAddUser={() => setShowAddUser(true)} />;
      case 'analytics':
        return <SystemAnalytics key="admin-analytics-view" />;
      case 'notifications':
        return (
          <motion.div 
            key="admin-notifications"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="max-w-4xl mx-auto space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">System Notifications</h2>
              <button 
                onClick={() => setNotifications(notifications.map(n => ({...n, isRead: true})))}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Mark all as read
              </button>
            </div>
            <div className="space-y-4">
              {notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-4 bg-slate-900/40 border rounded-xl flex items-center justify-between group cursor-pointer transition-all ${
                    n.isRead ? 'border-slate-800 opacity-60' : 'border-blue-500/30 bg-blue-500/5'
                  }`}
                  onClick={() => setNotifications(notifications.map(notif => notif.id === n.id ? {...notif, isRead: true} : notif))}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${n.isRead ? 'bg-slate-800' : 'bg-blue-500/10'}`}>
                      <Bell className={`w-5 h-5 ${n.isRead ? 'text-slate-500' : 'text-blue-400'}`} />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${n.isRead ? 'text-slate-400' : 'text-slate-200'}`}>{n.title}</h4>
                      <p className="text-xs text-slate-500">{n.message}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] text-slate-600 font-medium">{n.time}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setNotifications(notifications.filter(notif => notif.id !== n.id)); }}
                      className="p-1 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No system notifications</p>
                </div>
              )}
            </div>
          </motion.div>
        );
      case 'settings':
        return (
          <motion.div 
            key="admin-settings"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="max-w-4xl mx-auto space-y-8"
          >
            <h2 className="text-2xl font-bold text-white">Admin Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-400" /> Security Policies</h3>
                <div className="space-y-4">
                  {[
                    { id: 'mfa', label: 'Enforce MFA', desc: 'Require 2FA for all admin accounts.' },
                    { id: 'backups', label: 'Automatic Backups', desc: 'Backup DB every 24 hours.' },
                    { id: 'audit', label: 'Audit Logging', desc: 'Track all administrative actions.' },
                  ].map((s) => (
                    <div key={s.id} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-300">{s.label}</div>
                        <div className="text-[10px] text-slate-500">{s.desc}</div>
                      </div>
                      <button 
                        className={`w-10 h-5 rounded-full relative transition-all ${s.id === 'audit' ? 'bg-slate-700' : 'bg-blue-600'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${s.id === 'audit' ? 'left-1' : 'right-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5 text-emerald-400" /> Platform Defaults</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Default Storage Limit (MB)</label>
                    <input className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white" defaultValue="512" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Maintenance Mode</label>
                    <button 
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`w-full py-2 border rounded-lg text-xs font-bold transition-all ${
                        maintenanceMode 
                          ? 'bg-rose-600 text-white border-rose-500' 
                          : 'bg-rose-600/10 text-rose-400 border-rose-500/20 hover:bg-rose-600/20'
                      }`}
                    >
                      {maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
                    </button>
                    {maintenanceMode && (
                      <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" /> System is currently restricted to admins.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="relative z-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Control Panel</h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" /> {adminUser.name} Access
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white transition-all">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>

        <AddUserModal 
          isOpen={showAddUser} 
          onClose={() => setShowAddUser(false)} 
          onAdd={(newUser) => {
            console.log('Adding user:', newUser);
            // In a real app, you would update the state or call an API here
          }} 
        />
      </div>
    </div>
  );
}
