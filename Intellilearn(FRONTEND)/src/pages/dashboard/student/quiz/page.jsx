'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import QuizFromChatFlow from '@/components/quiz/QuizFromChatFlow';
import { containerVariants } from '@/lib/animations';

export default function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.successMessage;

  React.useEffect(() => {
    if (!successMessage) return;
    navigate(location.pathname, { replace: true, state: { ...location.state, successMessage: undefined } });
  }, [location.pathname, location.state, navigate, successMessage]);

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6 pb-8"
    >
      {successMessage ? (
        <p className="text-sm text-emerald-400">{successMessage}</p>
      ) : null}
      <QuizFromChatFlow />
    </motion.div>
  );
}
