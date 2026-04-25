import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, CircleCheck, Info } from 'lucide-react';

const ARTICLE_CONTENT = {
  'getting-started-ai-tutor': {
    title: 'Getting Started with AI Tutor',
    subtitle: 'Learn how to begin using IntelliLearn AI Tutor effectively.',
    sections: [
      {
        heading: 'Open AI Tutor',
        points: [
          'From the dashboard sidebar, click AI Tutor.',
          'Choose a subject or topic you want help with.',
          'Start by asking a clear question.',
        ],
      },
      {
        heading: 'Get Better Responses',
        points: [
          'Mention your class level and exam goal.',
          'Request step-by-step explanations when needed.',
          'Ask follow-up questions to deepen understanding.',
        ],
      },
    ],
  },
  'how-to-take-a-quiz': {
    title: 'How to Take a Quiz',
    subtitle: 'Start and complete quizzes with proper review.',
    sections: [
      {
        heading: 'Start a Quiz',
        points: [
          'Open Quizzes from the dashboard.',
          'Select topic and difficulty.',
          'Click Start Quiz and answer each question.',
        ],
      },
      {
        heading: 'Review Results',
        points: [
          'Submit to see score and correct answers.',
          'Read AI explanations for incorrect responses.',
          'Retake quizzes to improve weak topics.',
        ],
      },
    ],
  },
  'understanding-learning-analytics': {
    title: 'Understanding Learning Analytics',
    subtitle: 'Track your progress and identify weak areas.',
    sections: [
      {
        heading: 'What to Monitor',
        points: [
          'Daily activity trend and consistency.',
          'Quiz score movement over time.',
          'Topic-wise strengths and weak areas.',
        ],
      },
      {
        heading: 'How to Use Insights',
        points: [
          'Prioritize low-performing topics first.',
          'Set weekly goals based on analytics data.',
          'Use AI Tutor recommendations for revision.',
        ],
      },
    ],
  },
  'tracking-activities-progress': {
    title: 'Tracking Activities and Progress',
    subtitle: 'Use activities history to stay consistent.',
    sections: [
      {
        heading: 'Activities Timeline',
        points: [
          'View recent actions in the Activities section.',
          'Track notes, quizzes, and tutor sessions.',
          'Identify your most productive study windows.',
        ],
      },
      {
        heading: 'Progress Habits',
        points: [
          'Maintain daily streaks for continuity.',
          'Combine quizzes with short revision notes.',
          'Review weekly summary and adjust strategy.',
        ],
      },
    ],
  },
  'reset-password': {
    title: 'Reset Password',
    subtitle: 'Recover account access securely.',
    sections: [
      {
        heading: 'Password Reset Steps',
        points: [
          'Go to the Forgot Password page.',
          'Enter your registered email.',
          'Use the reset link to create a new password.',
        ],
      },
      {
        heading: 'Security Tips',
        points: [
          'Use a strong and unique password.',
          'Do not share reset links with others.',
          'Update your password periodically.',
        ],
      },
    ],
  },
  'update-profile-settings': {
    title: 'Update Profile Settings',
    subtitle: 'Keep your account details accurate and up to date.',
    sections: [
      {
        heading: 'Profile Updates',
        points: [
          'Open Settings from your dashboard.',
          'Edit name, email, and basic profile information.',
          'Save changes and verify updated values.',
        ],
      },
      {
        heading: 'Best Practice',
        points: [
          'Use a valid recovery email.',
          'Keep profile details consistent.',
          'Review settings monthly.',
        ],
      },
    ],
  },
  'security-best-practices': {
    title: 'Security Best Practices',
    subtitle: 'Protect your IntelliLearn account from unauthorized access.',
    sections: [
      {
        heading: 'Account Protection',
        points: [
          'Use a strong password with mixed characters.',
          'Avoid logging in on untrusted devices.',
          'Always log out from shared systems.',
        ],
      },
      {
        heading: 'Safe Usage',
        points: [
          'Never share credentials or OTP codes.',
          'Check for suspicious login activity regularly.',
          'Report unusual behavior to support immediately.',
        ],
      },
    ],
  },
  'privacy-and-preferences': {
    title: 'Privacy & Preferences',
    subtitle: 'Manage personalization and communication settings.',
    sections: [
      {
        heading: 'Privacy Controls',
        points: [
          'Adjust visibility and profile preferences in Settings.',
          'Review data-sharing options carefully.',
          'Update communication preferences anytime.',
        ],
      },
      {
        heading: 'Recommendation Settings',
        points: [
          'Tune study suggestions to your goals.',
          'Enable only relevant notifications.',
          'Revisit preferences as your needs change.',
        ],
      },
    ],
  },
};

export default function HelpArticlePage() {
  const { articleId } = useParams();
  const article = ARTICLE_CONTENT[articleId];

  if (!article) {
    return (
      <div className="min-h-screen bg-[#0a0f2c] px-4 py-10 text-slate-200 md:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-700 bg-slate-900/60 p-8 text-center">
          <Info className="mx-auto h-10 w-10 text-blue-400" />
          <h1 className="mt-4 text-2xl font-bold text-white">Help article not found</h1>
          <Link to="/help-center" className="mt-4 inline-block text-blue-400 hover:text-blue-300">
            Back to Help Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f2c] px-4 py-10 text-slate-200 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl space-y-6"
      >
        <Link to="/help-center" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Help Center
        </Link>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-7 md:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
            <BookOpen className="h-3.5 w-3.5" />
            Help Article
          </div>
          <h1 className="text-3xl font-bold text-white">{article.title}</h1>
          <p className="mt-2 text-slate-400">{article.subtitle}</p>
        </div>

        {article.sections.map((section) => (
          <div key={section.heading} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold text-white">{section.heading}</h2>
            <ul className="mt-4 space-y-2">
              {section.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-slate-300">
                  <CircleCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
