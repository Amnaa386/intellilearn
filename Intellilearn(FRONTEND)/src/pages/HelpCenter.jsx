import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaBook,
  FaCheckCircle,
  FaChevronDown,
  FaChevronRight,
  FaEnvelope,
  FaLock,
  FaQuestionCircle,
  FaSearch,
  FaShieldAlt,
  FaTools,
  FaUserGraduate,
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const helpCategories = [
  {
    id: 'students',
    title: 'For Students',
    description: 'Learn how to use AI Tutor, quizzes, notes, and analytics effectively.',
    icon: <FaUserGraduate className="text-blue-400" />,
    articles: [
      { title: 'Getting Started with AI Tutor', href: '/help-center/articles/getting-started-ai-tutor' },
      { title: 'How to Take a Quiz', href: '/help-center/articles/how-to-take-a-quiz' },
      { title: 'Understanding Learning Analytics', href: '/help-center/articles/understanding-learning-analytics' },
      { title: 'Tracking Activities and Progress', href: '/help-center/articles/tracking-activities-progress' },
    ],
  },
  {
    id: 'account',
    title: 'Account & Security',
    description: 'Manage profile settings, password recovery, and account protection.',
    icon: <FaShieldAlt className="text-emerald-400" />,
    articles: [
      { title: 'Reset Password', href: '/help-center/articles/reset-password' },
      { title: 'Update Profile Settings', href: '/help-center/articles/update-profile-settings' },
      { title: 'Security Best Practices', href: '/help-center/articles/security-best-practices' },
      { title: 'Privacy & Preferences', href: '/help-center/articles/privacy-and-preferences' },
    ],
  },
];

const faqs = [
  {
    id: 1,
    q: 'How do I access the AI Tutor?',
    a: "Open the sidebar and click 'AI Tutor'. You can then ask questions by chapter, topic, or exam type.",
  },
  {
    id: 2,
    q: 'Where can I see quiz history and scores?',
    a: "Go to 'Quizzes' and open your recent attempts. Detailed feedback and scores are shown per attempt.",
  },
  {
    id: 3,
    q: 'How can I change my profile settings?',
    a: "Use the 'Settings' page from the sidebar or profile menu to update your account information.",
  },
  {
    id: 4,
    q: 'Can I use IntelliLearn on mobile?',
    a: 'Yes. The frontend is responsive and works on mobile browsers with the same account.',
  },
];

export default function HelpCenter() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [sent, setSent] = useState(false);
  const [contactForm, setContactForm] = useState({ subject: '', message: '' });

  const visibleFaqs = useMemo(() => {
    if (!query.trim()) return faqs;
    const q = query.toLowerCase();
    return faqs.filter((item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q));
  }, [query]);

  const category = helpCategories.find((c) => c.id === activeCategory);
  const onSendMessage = (e) => {
    e.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim()) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setShowContactModal(false);
      setContactForm({ subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0f2c] px-4 py-8 text-slate-200 md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <AnimatePresence mode="wait">
          {!activeCategory ? (
            <motion.div
              key="help-home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-md md:p-10">
                <div className="mx-auto max-w-3xl text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15">
                    <FaQuestionCircle className="text-2xl text-blue-400" />
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                    Help Center
                  </h1>
                  <p className="mt-2 text-sm text-slate-400 md:text-base">
                    Find guides, FAQs, and support resources for using IntelliLearn smoothly.
                  </p>

                  <div className="relative mx-auto mt-6 max-w-2xl">
                    <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search help topics..."
                      className="h-12 rounded-xl border-slate-700 bg-slate-800/70 pl-11 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {helpCategories.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    onClick={() => setActiveCategory(item.id)}
                  >
                    <Card className="h-full cursor-pointer rounded-2xl border border-slate-700/80 bg-slate-900/55 p-6 transition-all hover:border-blue-500/50 hover:bg-slate-900/75">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800">
                        {item.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-400">
                        Explore guides <FaChevronRight className="text-[10px]" />
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="rounded-2xl border border-slate-700/80 bg-slate-900/55 p-6 lg:col-span-2">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-blue-500/15 p-2">
                      <FaBook className="text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
                  </div>
                  <div className="space-y-3">
                    {visibleFaqs.map((faq) => (
                      <div
                        key={faq.id}
                        className={`rounded-xl border p-4 transition-all ${
                          expandedFaq === faq.id
                            ? 'border-blue-500/50 bg-blue-500/5'
                            : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                          className="flex w-full items-center justify-between gap-3 text-left"
                        >
                          <span className="text-sm font-semibold text-slate-100 md:text-base">{faq.q}</span>
                          {expandedFaq === faq.id ? (
                            <FaChevronDown className="text-xs text-blue-400" />
                          ) : (
                            <FaChevronRight className="text-xs text-slate-400" />
                          )}
                        </button>
                        <AnimatePresence>
                          {expandedFaq === faq.id && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden pt-3 text-sm text-slate-400"
                            >
                              {faq.a}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                    {visibleFaqs.length === 0 && (
                      <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-400">
                        No matching help topics found. Try a different keyword.
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15">
                    <FaEnvelope className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Still Need Help?</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Reach out to support for account, technical, or feature questions.
                  </p>
                  <div className="mt-5 space-y-2 text-xs text-slate-400">
                    <div className="rounded-lg bg-slate-900/45 px-3 py-2">Response time: less than 2 hours</div>
                    <div className="rounded-lg bg-slate-900/45 px-3 py-2">Support available: 24/7</div>
                  </div>
                  <Button
                    onClick={() => setShowContactModal(true)}
                    className="mt-5 w-full bg-blue-600 font-semibold text-white hover:bg-blue-700"
                  >
                    Contact Support
                  </Button>
                </Card>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="help-category"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="space-y-6"
            >
              <button
                onClick={() => setActiveCategory(null)}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
              >
                <FaArrowLeft className="text-xs" /> Back to Help Center
              </button>

              <Card className="rounded-2xl border border-slate-700/80 bg-slate-900/55 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-white">{category?.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{category?.description}</p>

                <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {category?.articles.map((article) => (
                    <button
                      key={article.title}
                      onClick={() => article.href && navigate(article.href)}
                      className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/45 px-4 py-3 text-left transition-all hover:border-blue-500/40 hover:bg-slate-800"
                    >
                      <span className="text-sm font-medium text-slate-200">{article.title}</span>
                      <FaChevronRight className="text-xs text-slate-400" />
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
          <DialogContent className="rounded-2xl border-slate-700 bg-slate-900 text-slate-100 sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FaEnvelope className="text-blue-400" /> Contact Support
              </DialogTitle>
            </DialogHeader>
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="sent-state"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="py-8 text-center"
                >
                  <FaCheckCircle className="mx-auto mb-3 text-4xl text-emerald-400" />
                  <h4 className="text-lg font-bold text-white">Message Sent</h4>
                  <p className="mt-1 text-sm text-slate-400">Our team will get back to you shortly.</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={onSendMessage}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subject</label>
                    <Input
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="What do you need help with?"
                      className="border-slate-700 bg-slate-800/80 text-slate-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Message</label>
                    <Textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Describe your issue..."
                      className="min-h-[130px] border-slate-700 bg-slate-800/80 text-slate-100"
                    />
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" className="border-slate-700 bg-slate-800 text-slate-300" onClick={() => setShowContactModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Send Message
                    </Button>
                  </DialogFooter>
                </motion.form>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
