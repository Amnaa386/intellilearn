import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Headphones, Layout, PlayCircle, Sparkles } from 'lucide-react';

const MODE_CONTENT = {
  text: {
    title: 'AI Text Explanation',
    subtitle: 'Get deep, step-by-step concept explanations with clear examples.',
    icon: BookOpen,
    gradient: 'from-blue-500 to-cyan-500',
    highlights: [
      'Topic-wise simplified explanations',
      'Step-by-step reasoning and examples',
      'Quick revision summaries on demand',
    ],
  },
  voice: {
    title: 'Voice Learning',
    subtitle: 'Learn with AI-generated audio lessons for focused listening practice.',
    icon: Headphones,
    gradient: 'from-purple-500 to-blue-500',
    highlights: [
      'Audio lessons for on-the-go learning',
      'Natural voice pacing for better retention',
      'Ideal for auditory learners',
    ],
  },
  ppt: {
    title: 'PPT Generation',
    subtitle: 'Generate presentation-ready slides with structured explanations.',
    icon: Layout,
    gradient: 'from-indigo-500 to-purple-500',
    highlights: [
      'Auto-generated slide structure',
      'Clean bullet points and visuals flow',
      'Great for class and revision presentations',
    ],
  },
  video: {
    title: 'Video Lectures',
    subtitle: 'Watch engaging AI-powered video lessons with visual storytelling.',
    icon: PlayCircle,
    gradient: 'from-blue-600 to-indigo-600',
    highlights: [
      'Animated concept-focused lessons',
      'Friendly AI teacher-style narration',
      'Improves concept recall through visuals',
    ],
  },
};

export default function LearningModePage() {
  const { modeId } = useParams();
  const mode = MODE_CONTENT[modeId];

  if (!mode) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-[#0a0f2c] px-4 py-10 text-slate-200 md:px-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-5xl space-y-6">
        <Link to="/#learning-modes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Modes
        </Link>

        <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-8 backdrop-blur-md md:p-10">
          <div className={`mb-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-bold text-white ${mode.gradient}`}>
            <Sparkles className="h-3.5 w-3.5" />
            Mode Preview
          </div>

          <div className="mb-5 flex items-center gap-3">
            <div className={`rounded-xl bg-gradient-to-br p-3 ${mode.gradient}`}>
              <mode.icon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white md:text-4xl">{mode.title}</h1>
          </div>

          <p className="max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">{mode.subtitle}</p>

          <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
            {mode.highlights.map((point) => (
              <div key={point} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 text-sm text-slate-300">
                {point}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={`/learning-modes/${modeId}/continue`} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Continue with this mode
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/" className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700">
              Go to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
