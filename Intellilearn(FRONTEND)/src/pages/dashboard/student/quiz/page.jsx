'use client';

import React from 'react';
import { motion } from 'framer-motion';
import QuizFromChatFlow from '@/components/quiz/QuizFromChatFlow';
import { containerVariants } from '@/lib/animations';

export default function QuizPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6 pb-8"
    >
      <QuizFromChatFlow />
    </motion.div>
  );
}
