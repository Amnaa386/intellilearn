import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Lock, Save, ShieldCheck, SlidersHorizontal, UserCircle2 } from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'intellilearn_detailed_settings';

export default function DetailedSettingsPage() {
  const [settings, setSettings] = useState(() => {
    const defaults = {
      fullName: 'IntelliLearn User',
      email: 'user@intellilearn.ai',
      studyReminders: true,
      productUpdates: true,
      darkMode: true,
      strictPrivacy: false,
    };

    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!stored) return defaults;
      return { ...defaults, ...JSON.parse(stored) };
    } catch {
      return defaults;
    }
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('intellilearn-theme-changed'));
  }, [settings]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.darkMode]);

  const saveChanges = () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const theme = settings.darkMode
    ? {
        page: 'bg-[#0a0f2c] text-slate-200',
        panel: 'border-white/10 bg-slate-900/55',
        card: 'border-slate-700 bg-slate-900/55',
        input: 'border-slate-700 bg-slate-800/70 text-slate-100',
        muted: 'text-slate-400',
      }
    : {
        page: 'bg-slate-100 text-slate-800',
        panel: 'border-slate-300 bg-white/95',
        card: 'border-slate-300 bg-white',
        input: 'border-slate-300 bg-slate-50 text-slate-800',
        muted: 'text-slate-600',
      };

  return (
    <div className={`min-h-screen px-4 py-8 md:px-8 ${theme.page}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-5xl space-y-6"
      >
        <div className={`rounded-3xl border p-7 backdrop-blur-md ${theme.panel}`}>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Detailed Settings
          </div>
          <h1 className={`text-3xl font-bold ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>Detailed Settings</h1>
          <p className={`mt-2 text-sm ${theme.muted}`}>Update profile, privacy, notifications, and appearance preferences.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`rounded-2xl border p-5 ${theme.card}`}>
            <div className={`mb-3 flex items-center gap-2 ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>
              <UserCircle2 className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Profile</h2>
            </div>
            <div className="space-y-3">
              <input
                value={settings.fullName}
                onChange={(e) => setSettings((prev) => ({ ...prev, fullName: e.target.value }))}
                className={`h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-blue-500 ${theme.input}`}
                placeholder="Full name"
              />
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings((prev) => ({ ...prev, email: e.target.value }))}
                className={`h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-blue-500 ${theme.input}`}
                placeholder="Email"
              />
            </div>
          </div>

          <div className={`rounded-2xl border p-5 ${theme.card}`}>
            <div className={`mb-3 flex items-center gap-2 ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>
              <Bell className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>
            <div className="space-y-3 text-sm">
              <button onClick={() => toggle('studyReminders')} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 ${theme.input}`}>
                <span>Study reminders</span>
                <span className={settings.studyReminders ? 'text-emerald-400' : 'text-slate-400'}>{settings.studyReminders ? 'On' : 'Off'}</span>
              </button>
              <button onClick={() => toggle('productUpdates')} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 ${theme.input}`}>
                <span>Product updates</span>
                <span className={settings.productUpdates ? 'text-emerald-400' : 'text-slate-400'}>{settings.productUpdates ? 'On' : 'Off'}</span>
              </button>
            </div>
          </div>

          <div className={`rounded-2xl border p-5 ${theme.card}`}>
            <div className={`mb-3 flex items-center gap-2 ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>
              <Lock className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Privacy</h2>
            </div>
            <button onClick={() => toggle('strictPrivacy')} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${theme.input}`}>
              <span>Strict privacy mode</span>
              <span className={settings.strictPrivacy ? 'text-emerald-400' : 'text-slate-400'}>{settings.strictPrivacy ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>

          <div className={`rounded-2xl border p-5 ${theme.card}`}>
            <div className={`mb-3 flex items-center gap-2 ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>
              <SlidersHorizontal className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Appearance</h2>
            </div>
            <button onClick={() => toggle('darkMode')} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${theme.input}`}>
              <span>Dark mode</span>
              <span className={settings.darkMode ? 'text-emerald-400' : 'text-slate-400'}>{settings.darkMode ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={saveChanges} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
          <Link to="/settings" className={`rounded-xl border px-4 py-2 text-sm font-semibold ${settings.darkMode ? 'border-slate-700 bg-slate-800/70 text-slate-300 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}>
            Back to Settings Center
          </Link>
          {saved && <span className="text-sm text-emerald-400">Settings saved successfully.</span>}
        </div>
      </motion.div>
    </div>
  );
}
