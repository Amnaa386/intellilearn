import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Headphones, Layout, PlayCircle, Rocket } from 'lucide-react';

const MODE_META = {
  text: {
    title: 'AI Text Explanation',
    icon: BookOpen,
    description: 'Use guided text explanations and concept breakdowns.',
    studentPath: '/dashboard/student/tutor',
  },
  voice: {
    title: 'Voice Learning',
    icon: Headphones,
    description: 'Start audio-based explanations and voice-friendly lessons.',
    studentPath: '/dashboard/student/voice-lesson',
  },
  ppt: {
    title: 'PPT Generation',
    icon: Layout,
    description: 'Generate structured slide-style learning content.',
    studentPath: '/dashboard/student/modules',
  },
  video: {
    title: 'Video Lectures',
    icon: PlayCircle,
    description: 'Explore visual and lecture-style learning experiences.',
    studentPath: '/dashboard/student/modules',
  },
};

export default function LearningModeContinuePage() {
  const { modeId } = useParams();
  const navigate = useNavigate();
  const mode = MODE_META[modeId];

  if (!mode) return <Navigate to="/" replace />;

  const isLoggedIn = localStorage.getItem('intellilearn_isLoggedIn') === 'true';
  const role = localStorage.getItem('intellilearn_role');

  const handleStart = () => {
    if (!isLoggedIn) {
      localStorage.setItem('intellilearn_selected_mode', modeId);
      navigate('/auth/register');
      return;
    }

    navigate(mode.studentPath);
  };

  return (
    <div className="min-h-screen bg-[#0a0f2c] px-4 py-10 text-slate-200 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-4xl space-y-6"
      >
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 backdrop-blur-md md:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
            <Rocket className="h-3.5 w-3.5" />
            Continue Mode
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-3">
              <mode.icon className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white">{mode.title}</h1>
          </div>

          <p className="max-w-2xl text-sm text-slate-400 md:text-base">{mode.description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Open this mode now
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link to="/" className="rounded-xl border border-slate-700 bg-slate-800/70 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700">
              Go to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
