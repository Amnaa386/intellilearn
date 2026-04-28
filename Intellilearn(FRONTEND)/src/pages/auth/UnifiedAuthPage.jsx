'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getRedirectResult, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  BrainCircuit,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGoogleAuth } from '@/lib/firebase';

const AUTH_API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const formVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 28 : -28,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 28 : -28,
    opacity: 0,
  }),
};

function validateEmail(value) {
  if (!value.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
  return '';
}

function PasswordStrength({ password }) {
  const rules = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
    }),
    [password],
  );
  const passed = Object.values(rules).filter(Boolean).length;
  const pct = Math.round((passed / 3) * 100);
  const meta =
    pct < 34
      ? { label: 'Weak', color: 'text-rose-400', bar: 'bg-rose-500' }
      : pct < 67
        ? { label: 'Moderate', color: 'text-amber-400', bar: 'bg-amber-500' }
        : { label: 'Strong', color: 'text-emerald-400', bar: 'bg-emerald-500' };

  if (!password) return null;

  return (
    <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/40 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
          Password strength
        </div>
        <span className={cn('text-[10px] font-bold uppercase tracking-wider', meta.color)}>{meta.label}</span>
      </div>
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className={cn('h-full rounded-full', meta.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {[
          { ok: rules.length, text: '8+ characters' },
          { ok: rules.uppercase, text: 'Uppercase letter' },
          { ok: rules.number, text: 'Number' },
        ].map((row) => (
          <div key={row.text} className="flex items-center gap-1.5 text-[11px]">
            <div
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                row.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500',
              )}
            >
              <Check className="h-2.5 w-2.5" />
            </div>
            <span className={row.ok ? 'text-emerald-300/90' : 'text-slate-500'}>{row.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UnifiedAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignup = location.pathname.includes('/register');

  const [direction, setDirection] = useState(0);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});

  const [signup, setSignup] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [authError, setAuthError] = useState('');

  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const switchMode = (toSignup) => {
    if (toSignup === isSignup) return;
    setDirection(toSignup ? 1 : -1);
    navigate(toSignup ? '/auth/register' : '/auth/login', { replace: true });
  };

  const passwordRulesOk = useMemo(() => {
    const p = signup.password;
    return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p);
  }, [signup.password]);

  const runLoginValidation = () => {
    const e = {};
    const em = validateEmail(loginEmail);
    if (em) e.email = em;
    if (!loginPassword) e.password = 'Password is required';
    else if (loginPassword.length < 6) e.password = 'Use at least 6 characters';
    setLoginErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (ev) => {
    ev.preventDefault();
    setAuthError('');
    if (!runLoginValidation()) return;
    setLoadingLogin(true);
    try {
      const response = await fetch(`${AUTH_API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.detail || 'Login failed');
      }

      persistSessionFromBackend(payload);
      const userRole = payload?.user?.role || 'student';
      navigate(userRole === 'admin' ? '/dashboard/admin' : '/dashboard/student', { replace: true });
    } catch (err) {
      setAuthError(err?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleSignup = async (ev) => {
    ev.preventDefault();
    setAuthError('');
    setSignupError('');
    if (!signup.name.trim()) {
      setSignupError('Please enter your full name');
      return;
    }
    const em = validateEmail(signup.email);
    if (em) {
      setSignupError(em);
      return;
    }
    if (!passwordRulesOk) {
      setSignupError('Password does not meet the requirements');
      return;
    }
    if (signup.password !== signup.confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }
    if (!signup.agreeTerms) {
      setSignupError('Please accept the Terms and Privacy Policy');
      return;
    }
    setLoadingSignup(true);
    try {
      const response = await fetch(`${AUTH_API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signup.name.trim(),
          email: signup.email.trim(),
          password: signup.password,
          role: 'student',
          status: 'active',
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.detail || 'Registration failed');
      }

      persistSessionFromBackend(payload);
      navigate('/dashboard/student', { replace: true });
    } catch (err) {
      setSignupError(err?.message || 'Unable to create account right now.');
    } finally {
      setLoadingSignup(false);
    }
  };

  const sanitizeAvatar = (avatar) => {
    if (typeof avatar !== 'string') return '';
    const trimmed = avatar.trim();
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return '';
    if (!trimmed.startsWith('http') && !trimmed.startsWith('data:image/')) return '';
    return trimmed;
  };

  const persistSessionFromBackend = (payload, fallbackAvatar = '') => {
    const user = payload?.user;
    if (!user) throw new Error('Invalid auth response');
    const userRole = user.role || 'student';
    const avatarFromBackend = sanitizeAvatar(user?.profile?.avatar);
    const avatarFromFirebase = sanitizeAvatar(fallbackAvatar);
    const resolvedAvatar = avatarFromBackend || avatarFromFirebase;

    localStorage.setItem('intellilearn_isLoggedIn', 'true');
    localStorage.setItem('intellilearn_role', userRole);
    localStorage.setItem('intellilearn_admin_backend_verified', userRole === 'admin' ? 'true' : 'false');
    localStorage.setItem(
      'intellilearn_user',
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole,
        profile: {
          ...(user.profile || {}),
          avatar: resolvedAvatar,
        },
      }),
    );
    localStorage.setItem('intellilearn_access_token', payload.access_token || '');
    localStorage.setItem('intellilearn_refresh_token', payload.refresh_token || '');
    window.dispatchEvent(new Event('intellilearn-user-updated'));
  };

  const completeGoogleAuth = async (cred) => {
    const idToken = await cred.user.getIdToken();
    const response = await fetch(`${AUTH_API_BASE}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Google login failed');
    }

    const payload = await response.json();
    persistSessionFromBackend(payload, cred?.user?.photoURL || '');
    navigate('/dashboard/student', { replace: true });
  };

  useEffect(() => {
    const processRedirectAuth = async () => {
      try {
        const { auth } = getGoogleAuth();
        const redirectResult = await getRedirectResult(auth);
        if (!redirectResult?.user) return;
        setLoadingGoogle(true);
        await completeGoogleAuth(redirectResult);
      } catch (error) {
        setAuthError(error?.message || 'Google sign-in failed. Please try again.');
      } finally {
        setLoadingGoogle(false);
      }
    };

    processRedirectAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleAuth = async () => {
    const { auth, googleProvider } = getGoogleAuth();
    try {
      setSignupError('');
      setAuthError('');
      setLoadingGoogle(true);
      const cred = await signInWithPopup(auth, googleProvider);
      await completeGoogleAuth(cred);
    } catch (error) {
      if (error?.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          setAuthError(redirectErr?.message || 'Google sign-in blocked by browser.');
        }
      } else {
        setAuthError(error?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const inputClass =
    'h-11 rounded-xl border border-white/10 bg-slate-950/40 text-slate-100 shadow-inner transition-all duration-200 placeholder:text-slate-500 focus-visible:border-blue-500/60 focus-visible:ring-2 focus-visible:ring-blue-500/20';

  return (
    <div className="relative w-full max-w-5xl">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-stretch lg:gap-10">
        {/* Brand panel — hidden on small screens for focus on form */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative hidden overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-[#0d1333]/95 to-slate-950/90 p-8 shadow-2xl shadow-blue-950/40 lg:flex lg:flex-col lg:justify-between"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              IntelliLearn
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Learn smarter with AI that adapts to you.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              Join a modern learning platform built for focus, clarity, and measurable progress.
            </p>
          </div>
          <ul className="relative mt-8 space-y-4 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                <BrainCircuit className="h-4 w-4 text-purple-400" />
              </span>
              <span>AI tutor, quizzes, and notes tailored to your pace.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                <GraduationCap className="h-4 w-4 text-blue-400" />
              </span>
              <span>Built for students and educators who expect enterprise-grade UX.</span>
            </li>
          </ul>
        </motion.div>

        {/* Form card */}
        <motion.div
          layout
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

          <div className="p-6 sm:p-8 md:p-10">
            {/* Mode toggle */}
            <div className="relative mb-8 flex rounded-2xl border border-white/10 bg-slate-900/60 p-1.5">
              <motion.div
                className="absolute inset-y-1.5 rounded-xl bg-gradient-to-r from-blue-600/90 to-purple-600/90 shadow-lg"
                layout
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                style={{
                  width: 'calc(50% - 6px)',
                  left: isSignup ? 'calc(50% + 3px)' : '6px',
                }}
              />
              <button
                type="button"
                onClick={() => switchMode(false)}
                className={cn(
                  'relative z-10 flex-1 rounded-xl py-2.5 text-center text-sm font-semibold transition-colors duration-200',
                  !isSignup ? 'text-white' : 'text-slate-500 hover:text-slate-300',
                )}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode(true)}
                className={cn(
                  'relative z-10 flex-1 rounded-xl py-2.5 text-center text-sm font-semibold transition-colors duration-200',
                  isSignup ? 'text-white' : 'text-slate-500 hover:text-slate-300',
                )}
              >
                Create account
              </button>
            </div>

            <div className="overflow-x-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              {!isSignup ? (
                <motion.form
                  key="login"
                  custom={direction}
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
                  <div>
                    <h1 className="text-xl font-bold text-white sm:text-2xl">Welcome back</h1>
                    <p className="mt-1 text-sm text-slate-500">Sign in to continue your learning journey.</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="login-email" className="text-xs font-medium text-slate-400">
                      Email
                    </label>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        if (loginErrors.email) setLoginErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      className={cn(inputClass, loginErrors.email && 'border-rose-500/50 focus-visible:ring-rose-500/20')}
                      placeholder="you@university.edu"
                    />
                    {loginErrors.email && (
                      <p className="text-xs font-medium text-rose-400">{loginErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="login-password" className="text-xs font-medium text-slate-400">
                        Password
                      </label>
                      <Link
                        to="/auth/forgot-password"
                        className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (loginErrors.password) setLoginErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        className={cn(inputClass, 'pr-11', loginErrors.password && 'border-rose-500/50')}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
                        onClick={() => setShowLoginPassword((v) => !v)}
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <p className="text-xs font-medium text-rose-400">{loginErrors.password}</p>
                    )}
                  </div>

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      type="submit"
                      disabled={loadingLogin}
                      className="group h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-base font-semibold shadow-lg shadow-blue-900/30 transition-all hover:from-blue-500 hover:to-purple-500 disabled:opacity-70"
                    >
                      {loadingLogin ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Signing in…
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Sign in
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      )}
                    </Button>
                  </motion.div>

                  {authError && (
                    <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-xs font-medium text-rose-300">
                      {authError}
                    </p>
                  )}

                  <Button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loadingGoogle}
                    variant="outline"
                    className="h-11 w-full rounded-xl border-white/15 bg-slate-900/50 text-slate-200 hover:bg-slate-800/60"
                  >
                    <span className="inline-flex items-center gap-2">
                      <img src="/google.png" alt="Google" className="h-4 w-4 object-contain" />
                      {loadingGoogle ? 'Connecting Google...' : 'Continue with Google'}
                    </span>
                  </Button>

                  <p className="text-center text-[11px] text-slate-600">
                    By signing in, you agree to our Terms and Privacy Policy.
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  custom={direction}
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  onSubmit={handleSignup}
                  className="space-y-4"
                >
                  <div>
                    <h1 className="text-xl font-bold text-white sm:text-2xl">Create your account</h1>
                    <p className="mt-1 text-sm text-slate-500">Start learning with IntelliLearn in minutes.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="su-name" className="text-xs font-medium text-slate-400">
                        Full name
                      </label>
                      <Input
                        id="su-name"
                        name="name"
                        autoComplete="name"
                        value={signup.name}
                        onChange={(e) => setSignup((p) => ({ ...p, name: e.target.value }))}
                        className={inputClass}
                        placeholder="Alex Johnson"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="su-email" className="text-xs font-medium text-slate-400">
                        Email
                      </label>
                      <Input
                        id="su-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={signup.email}
                        onChange={(e) => setSignup((p) => ({ ...p, email: e.target.value }))}
                        className={inputClass}
                        placeholder="you@university.edu"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="su-password" className="text-xs font-medium text-slate-400">
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          id="su-password"
                          name="password"
                          type={showSignupPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={signup.password}
                          onChange={(e) => setSignup((p) => ({ ...p, password: e.target.value }))}
                          className={cn(inputClass, 'pr-11')}
                          placeholder="Create a strong password"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
                          onClick={() => setShowSignupPassword((v) => !v)}
                          aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                        >
                          {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <PasswordStrength password={signup.password} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="su-confirm" className="text-xs font-medium text-slate-400">
                        Confirm password
                      </label>
                      <div className="relative">
                        <Input
                          id="su-confirm"
                          name="confirmPassword"
                          type={showSignupConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={signup.confirmPassword}
                          onChange={(e) => setSignup((p) => ({ ...p, confirmPassword: e.target.value }))}
                          className={cn(inputClass, 'pr-11')}
                          placeholder="Repeat password"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
                          onClick={() => setShowSignupConfirmPassword((v) => !v)}
                          aria-label={showSignupConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showSignupConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {signupError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-xs font-medium text-rose-300"
                    >
                      {signupError}
                    </motion.p>
                  )}

                  {authError && (
                    <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-xs font-medium text-rose-300">
                      {authError}
                    </p>
                  )}

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/5 bg-slate-900/40 p-3">
                    <input
                      type="checkbox"
                      checked={signup.agreeTerms}
                      onChange={(e) => setSignup((p) => ({ ...p, agreeTerms: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500/40"
                    />
                    <span className="text-[11px] leading-relaxed text-slate-500">
                      I agree to the{' '}
                      <a href="#" className="text-blue-400 hover:underline">
                        Terms
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-blue-400 hover:underline">
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      type="submit"
                      disabled={loadingSignup}
                      className="group h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-base font-semibold shadow-lg shadow-blue-900/30 transition-all hover:from-blue-500 hover:to-purple-500 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {loadingSignup ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Creating account…
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Create account
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      )}
                    </Button>
                  </motion.div>

                  <Button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loadingGoogle}
                    variant="outline"
                    className="h-11 w-full rounded-xl border-white/15 bg-slate-900/50 text-slate-200 hover:bg-slate-800/60"
                  >
                    <span className="inline-flex items-center gap-2">
                      <img src="/google.png" alt="Google" className="h-4 w-4 object-contain" />
                      {loadingGoogle ? 'Connecting Google...' : 'Continue with Google'}
                    </span>
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
            </div>

            {/* Mobile brand snippet */}
            <div className="mt-8 border-t border-white/5 pt-6 lg:hidden">
              <p className="text-center text-[11px] text-slate-600">
                Secure, student-focused access to your IntelliLearn workspace.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
