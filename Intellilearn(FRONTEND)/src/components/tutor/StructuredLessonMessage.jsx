'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BookMarked,
  Layers,
  HelpCircle,
  ListChecks,
  PenSquare,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sectionEase = [0.22, 1, 0.36, 1];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: sectionEase },
  },
};

function SectionCard({ icon: Icon, title, accent, children, className }) {
  return (
    <motion.section
      variants={item}
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-600/60 bg-slate-900/40 shadow-lg shadow-black/20',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 border-b border-slate-600/50 px-4 py-3',
          accent === 'blue' && 'bg-gradient-to-r from-blue-600/20 to-transparent',
          accent === 'violet' && 'bg-gradient-to-r from-violet-600/20 to-transparent',
          accent === 'emerald' && 'bg-gradient-to-r from-emerald-600/15 to-transparent',
          accent === 'amber' && 'bg-gradient-to-r from-amber-500/15 to-transparent',
          accent === 'rose' && 'bg-gradient-to-r from-rose-600/15 to-transparent',
        )}
      >
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-slate-200" aria-hidden /> : null}
        <h3 className="text-sm font-semibold tracking-tight text-slate-100">{title}</h3>
      </div>
      <div className="px-4 py-4 text-sm leading-relaxed text-slate-300">{children}</div>
    </motion.section>
  );
}

export default function StructuredLessonMessage({ pack }) {
  if (!pack) return null;

  const { topic, intentSummary, shortNotes, detailedNotes, shortQuestions, mcqs, longQuestions } = pack;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <motion.div
        variants={item}
        className="rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-600/10 via-slate-900/30 to-purple-600/10 px-4 py-3"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-blue-300" aria-hidden />
          <span>
            Module for <span className="font-medium text-slate-200">{topic}</span>
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="text-slate-500">
            Depth: {intentSummary.noteDepth}
            {intentSummary.mcqCount ? ` · ${intentSummary.mcqCount} MCQ` : ''}
            {intentSummary.shortQCount ? ` · ${intentSummary.shortQCount} short Q` : ''}
            {intentSummary.longQCount ? ` · ${intentSummary.longQCount} long Q` : ''}
          </span>
        </div>
      </motion.div>

      {shortNotes?.length ? (
        <SectionCard icon={BookMarked} title="Short notes" accent="blue">
          <ul className="list-disc space-y-2 pl-4 marker:text-blue-400">
            {shortNotes.map((line, i) => (
              <li key={`sn-${i}`}>{line}</li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      {detailedNotes?.length ? (
        <SectionCard icon={Layers} title="Detailed notes" accent="violet">
          <div className="space-y-5">
            {detailedNotes.map((block) => (
              <div key={block.heading} className="rounded-xl border border-white/5 bg-slate-950/40 p-3">
                <h4 className="text-sm font-semibold text-white">{block.heading}</h4>
                <p className="mt-2 text-slate-300">{block.body}</p>
                {block.examples?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-400">
                    {block.examples.map((ex) => (
                      <li key={ex}>{ex}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {shortQuestions?.length ? (
        <SectionCard icon={HelpCircle} title="Short questions (exam-style)" accent="emerald">
          <ol className="list-decimal space-y-3 pl-4 marker:font-semibold marker:text-emerald-400">
            {shortQuestions.map((q, i) => (
              <li key={`sq-${i}`}>{q}</li>
            ))}
          </ol>
        </SectionCard>
      ) : null}

      {mcqs?.length ? (
        <SectionCard icon={ListChecks} title="Multiple choice" accent="amber">
          <div className="space-y-5">
            {mcqs.map((mcq, idx) => (
              <motion.div
                key={mcq.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * idx, duration: 0.35, ease: sectionEase }}
                className="rounded-xl border border-white/8 bg-slate-950/50 p-3"
              >
                <p className="font-medium text-slate-100">
                  {idx + 1}. {mcq.question}
                </p>
                <ul className="mt-3 space-y-2">
                  {mcq.options.map((opt, oi) => {
                    const isCorrect = oi === mcq.correctIndex;
                    return (
                      <li
                        key={opt}
                        className={cn(
                          'flex items-start gap-2 rounded-lg border px-3 py-2 text-slate-300 transition-colors',
                          isCorrect
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-50'
                            : 'border-white/6 bg-slate-900/40',
                        )}
                      >
                        <span className="mt-0.5 font-mono text-xs font-bold text-slate-500">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isCorrect ? (
                          <span className="shrink-0 rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Correct
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {longQuestions?.length ? (
        <SectionCard icon={PenSquare} title="Long questions" accent="rose">
          <div className="space-y-5">
            {longQuestions.map((lq, i) => (
              <div key={`lq-${i}`} className="rounded-xl border border-white/6 bg-slate-950/40 p-3">
                <p className="font-medium text-white">
                  {i + 1}. {lq.question}
                </p>
                {lq.guidance ? <p className="mt-2 text-xs text-slate-500">{lq.guidance}</p> : null}
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </motion.div>
  );
}
