const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

import { handleUnauthorized } from '@/lib/tutorApi';

function getAccessToken() {
  return localStorage.getItem('intellilearn_access_token') || '';
}

async function analyticsFetch(path, options = {}) {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired. Please login again.');
    }
    throw new Error(payload?.detail || `Request failed (${response.status})`);
  }

  return response.json();
}

export async function getUserAnalyticsOverview() {
  return analyticsFetch('/api/analytics/user/overview', { method: 'GET' });
}

export async function getUserActivityLogs({ page = 1, limit = 200, action } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (action) params.set('action', action);
  return analyticsFetch(`/api/analytics/user/activity-logs?${params.toString()}`, { method: 'GET' });
}

export async function getChatStats() {
  return analyticsFetch('/api/chat/stats', { method: 'GET' });
}

export async function getQuizStats() {
  return analyticsFetch('/api/quiz/stats/overview', { method: 'GET' });
}

export async function getNotesStats() {
  return analyticsFetch('/api/notes/stats/overview', { method: 'GET' });
}
