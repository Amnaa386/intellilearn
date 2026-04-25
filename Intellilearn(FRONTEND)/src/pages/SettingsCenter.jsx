import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Lock, ShieldCheck, SlidersHorizontal, UserCircle2 } from 'lucide-react';

export default function SettingsCenter() {
  const role = localStorage.getItem('intellilearn_role') || 'student';
  const dashboardPath = role === 'admin' ? '/dashboard/admin/overview' : '/dashboard/student';

  const settingCards = useMemo(
    () => [
      {
        title: 'Profile Settings',
        description: 'Update your display name, email, and account information.',
        icon: UserCircle2,
      },
      {
        title: 'Security',
        description: 'Manage password, account safety, and access preferences.',
        icon: Lock,
      },
      {
        title: 'Notifications',
        description: 'Control reminders, updates, and communication preferences.',
        icon: Bell,
      },
      {
        title: 'System Preferences',
        description: 'Customize platform behavior and interface preferences.',
        icon: SlidersHorizontal,
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-[#0a0f2c] px-4 py-8 text-slate-200 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-6xl space-y-6"
      >
        <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-8 backdrop-blur-md">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Settings Center
          </div>
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Manage your account preferences from one place. You can access detailed dashboard settings for role-specific controls.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/settings/detailed"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Open Detailed Settings
            </Link>
            <Link
              to={dashboardPath}
              className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {settingCards.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-700 bg-slate-900/55 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                <item.icon className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
