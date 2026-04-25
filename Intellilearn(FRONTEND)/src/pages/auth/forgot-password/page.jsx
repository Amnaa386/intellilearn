'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      {/* Card */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
        {isSent ? (
          <>
            {/* Success State */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="flex justify-center mb-4"
              >
                <CheckCircle className="w-16 h-16 text-green-500" />
              </motion.div>
              <h1 className="text-2xl font-bold text-slate-100 mb-2">Check Your Email</h1>
              <p className="text-slate-400 text-sm mb-6">
                We&apos;ve sent a password reset link to {email}
              </p>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 mb-6">
                <p className="text-sm text-slate-300">
                  Click the link in your email to reset your password. The link will expire in 24 hours.
                </p>
              </div>
              <Link to="/auth/login" className="w-full block">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Back to Login
                </Button>
              </Link>
              <p className="text-slate-400 text-sm mt-4">
                Didn&apos;t receive the email?{' '}
                <button
                  onClick={() => {
                    setIsSent(false);
                    setEmail('');
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Try again
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Reset Form */}
            <Link
              to="/auth/login"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>

            <h1 className="text-2xl font-bold text-slate-100 mb-2">Reset Your Password</h1>
            <p className="text-slate-400 text-sm mb-6">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSendReset} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Email Address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800/50 border-slate-700/50 text-slate-100 placeholder:text-slate-500"
                  required
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-10"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            {/* Additional Help */}
            <div className="mt-6 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <p className="text-xs text-slate-400">
                <strong className="text-slate-300">Tip:</strong> Check your spam folder if you don&apos;t see the email within a few minutes.
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
