const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

import { handleUnauthorized } from '@/lib/tutorApi';

function getAccessToken() {
  return localStorage.getItem('intellilearn_access_token') || '';
}

async function quizFetch(path, options = {}) {
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

export async function generateQuizFromChat(sessionId, mode = 'mcq') {
  return quizFetch('/api/quiz/generate/from-chat', {
    method: 'POST',
    body: JSON.stringify({ sessionId, mode }),
  });
}

export async function generateQuizFromTopic({
  topic,
  outline = '',
  questionCount = 6,
  difficulty = 'medium',
  types = ['mcq'],
}) {
  const mergedTopic = outline?.trim()
    ? `${topic}\n\nUse this outline/context:\n${outline.trim()}`
    : topic;

  return quizFetch('/api/quiz/generate', {
    method: 'POST',
    body: JSON.stringify({
      source: 'topic',
      topic: mergedTopic,
      questionCount,
      difficulty,
      types,
    }),
  });
}

export async function getUserQuizzes({ page = 1, limit = 20, completed } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (typeof completed === 'boolean') {
    params.set('completed', String(completed));
  }
  return quizFetch(`/api/quiz/?${params.toString()}`);
}

export async function getQuizById(quizId) {
  return quizFetch(`/api/quiz/${encodeURIComponent(quizId)}`);
}

export async function submitQuizAttempt({ quizId, answers = {}, writtenAnswers = {} }) {
  return quizFetch(`/api/quiz/${encodeURIComponent(quizId)}/submit`, {
    method: 'POST',
    body: JSON.stringify({
      quizId,
      answers,
      writtenAnswers,
    }),
  });
}
