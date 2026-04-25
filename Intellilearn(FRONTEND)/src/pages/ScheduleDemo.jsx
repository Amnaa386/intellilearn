import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, Clock3, Mail, Phone, User } from 'lucide-react';

export default function ScheduleDemo() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.preferredDate || !form.preferredTime) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0f2c] px-4 py-10 text-slate-200 md:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-5">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 backdrop-blur-xl lg:col-span-2"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
            <CalendarDays className="h-3.5 w-3.5" />
            Book Your Demo
          </span>

          <h1 className="mt-4 text-3xl font-black leading-tight text-white">Schedule a Live IntelliLearn Demo</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Pick a convenient date and time. Our team will walk you through AI Tutor, quizzes, notes generation, and analytics.
          </p>

          <div className="mt-8 space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 px-3 py-2">
              <Clock3 className="h-4 w-4 text-blue-400" />
              <span>Duration: 20-30 minutes</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 px-3 py-2">
              <Mail className="h-4 w-4 text-blue-400" />
              <span>Confirmation sent by email</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 px-3 py-2">
              <Phone className="h-4 w-4 text-blue-400" />
              <span>Optional reminder by phone</span>
            </div>
          </div>

          <Link
            to="/"
            className="mt-8 inline-flex items-center text-sm font-semibold text-blue-400 hover:text-blue-300"
          >
            ← Back to Home
          </Link>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 backdrop-blur-xl lg:col-span-3"
        >
          {submitted ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-14 w-14 text-emerald-400" />
              <h2 className="mt-4 text-2xl font-bold text-white">Demo Request Submitted</h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Thanks! We have received your request. A confirmation will be sent shortly with meeting details.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Schedule Another
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <h2 className="text-xl font-bold text-white">Demo Details</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Full Name</span>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={onChange}
                      className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/70 pl-10 pr-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                      placeholder="Enter full name"
                    />
                  </div>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Phone (Optional)</span>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preferred Date</span>
                  <input
                    name="preferredDate"
                    type="date"
                    value={form.preferredDate}
                    onChange={onChange}
                    className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                  />
                </label>
                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preferred Time</span>
                  <select
                    name="preferredTime"
                    value={form.preferredTime}
                    onChange={onChange}
                    className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                  >
                    <option value="">Select a time slot</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                  </select>
                </label>
                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</span>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={onChange}
                    rows={4}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                    placeholder="Tell us what you would like to see in the demo..."
                  />
                </label>
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 py-3 text-sm font-bold text-white hover:opacity-95"
              >
                Confirm Demo Request
              </button>
            </form>
          )}
        </motion.section>
      </div>
    </div>
  );
}
