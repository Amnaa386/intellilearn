import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const HelpArticlePage = lazy(() => import('./pages/HelpArticlePage'));
const SettingsCenter = lazy(() => import('./pages/SettingsCenter'));
const DetailedSettingsPage = lazy(() => import('./pages/DetailedSettingsPage'));
const LearningModePage = lazy(() => import('./pages/LearningModePage'));
const LearningModeContinuePage = lazy(() => import('./pages/LearningModeContinuePage'));
const UnifiedAuthPage = lazy(() => import('./pages/auth/UnifiedAuthPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/forgot-password/page'));
const AuthLayout = lazy(() => import('./pages/auth/layout'));
const StudentDashboardLayout = lazy(() => import('./pages/dashboard/student/layout'));
const QuizPage = lazy(() => import('./pages/dashboard/student/quiz/page'));
const TutorPage = lazy(() => import('./pages/dashboard/student/tutor/page'));
const NotesPage = lazy(() => import('./pages/dashboard/student/Notes'));
const PresentationsPage = lazy(() => import('./pages/dashboard/student/Presentations'));
const VideoLecturesPage = lazy(() => import('./pages/dashboard/student/VideoLectures'));
const VoiceLessonPage = lazy(() => import('./pages/dashboard/student/VoiceLesson'));
const ExploreTopicsPage = lazy(() => import('./pages/dashboard/student/ExploreTopics'));
const AnalyticsPage = lazy(() => import('./pages/dashboard/student/Analytics'));
const SettingsPage = lazy(() => import('./pages/dashboard/student/Settings'));
const ActivitiesPage = lazy(() => import('./pages/dashboard/student/Activities'));
const StudentDashboard = lazy(() => import('./pages/dashboard/student/page'));
const AdminDashboardLayout = lazy(() => import('./pages/dashboard/admin/layout'));
const AdminDashboard = lazy(() => import('./pages/dashboard/admin/AdminDashboardV2'));

const SETTINGS_STORAGE_KEY = 'intellilearn_detailed_settings';

function applyGlobalThemeFromSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const darkEnabled = parsed?.darkMode !== false;
    document.documentElement.classList.toggle('dark', darkEnabled);
  } catch {
    document.documentElement.classList.add('dark');
  }
}

function App() {
  useEffect(() => {
    applyGlobalThemeFromSettings();
    const onThemeChanged = () => applyGlobalThemeFromSettings();
    const onStorage = (event) => {
      if (!event.key || event.key === SETTINGS_STORAGE_KEY) applyGlobalThemeFromSettings();
    };

    window.addEventListener('intellilearn-theme-changed', onThemeChanged);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('intellilearn-theme-changed', onThemeChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#0a0f2c]">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-400" />
            </div>
          }
        >
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/learning-modes/:modeId" element={<LearningModePage />} />
          <Route path="/learning-modes/:modeId/continue" element={<LearningModeContinuePage />} />
          <Route path="/schedule-demo" element={<Navigate to="/" replace />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/detailed"
            element={
              <ProtectedRoute>
                <DetailedSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/select-role" element={<Navigate to="/auth/register" replace />} />
          <Route path="/signup" element={<Navigate to="/auth/register" replace />} />
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route
            path="/help-center"
            element={
              <ProtectedRoute>
                <HelpCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help-center/articles/:articleId"
            element={
              <ProtectedRoute>
                <HelpArticlePage />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard/admin" element={
            <ProtectedRoute role="admin">
              <AdminDashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard/admin/overview" replace />} />
            <Route path="overview" element={<AdminDashboard />} />
            <Route path="users" element={<AdminDashboard />} />
            <Route path="ai-activity" element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminDashboard />} />
            <Route path="settings" element={<AdminDashboard />} />
            <Route path="system" element={<Navigate to="/dashboard/admin/ai-activity" replace />} />
            <Route path="notifications" element={<Navigate to="/dashboard/admin/analytics" replace />} />
          </Route>
          <Route path="/auth" element={<AuthLayout />}>
            <Route index element={<Navigate to="/auth/login" replace />} />
            <Route path="login" element={<UnifiedAuthPage />} />
            <Route path="register" element={<UnifiedAuthPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route path="/dashboard/student" element={
            <ProtectedRoute role="student">
              <StudentDashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<StudentDashboard />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="tutor" element={<TutorPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="presentations" element={<PresentationsPage />} />
            <Route path="video-lectures" element={<VideoLecturesPage />} />
            <Route path="voice-lesson" element={<VoiceLessonPage />} />
            <Route path="modules" element={<ExploreTopicsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="help" element={<HelpCenter />} />
          </Route>
          <Route path="/dashboard/teacher/*" element={<Navigate to="/dashboard/student" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;