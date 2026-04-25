import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import HelpCenter from './pages/HelpCenter';
import HelpArticlePage from './pages/HelpArticlePage';
import SettingsCenter from './pages/SettingsCenter';
import DetailedSettingsPage from './pages/DetailedSettingsPage';
import LearningModePage from './pages/LearningModePage';
import LearningModeContinuePage from './pages/LearningModeContinuePage';
import ProtectedRoute from './components/ProtectedRoute';
import UnifiedAuthPage from './pages/auth/UnifiedAuthPage';
import ForgotPasswordPage from './pages/auth/forgot-password/page';
import AuthLayout from './pages/auth/layout';
import StudentDashboardLayout from './pages/dashboard/student/layout';
import QuizPage from './pages/dashboard/student/quiz/page';
import TutorPage from './pages/dashboard/student/tutor/page';
import NotesPage from './pages/dashboard/student/Notes';
import VoiceLessonPage from './pages/dashboard/student/VoiceLesson';
import ExploreTopicsPage from './pages/dashboard/student/ExploreTopics';
import AnalyticsPage from './pages/dashboard/student/Analytics';
import SettingsPage from './pages/dashboard/student/Settings';
import ActivitiesPage from './pages/dashboard/student/Activities';
import StudentDashboard from './pages/dashboard/student/page';
import AdminDashboardLayout from './pages/dashboard/admin/layout';
import AdminDashboard from './pages/dashboard/admin/AdminDashboardV2';

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
      </Router>
    </ErrorBoundary>
  );
}

export default App;