const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const AUTH_ERROR_MESSAGE = 'Session expired. Please login again.';

function handleUnauthorized() {
  try {
    localStorage.removeItem('intellilearn_access_token');
    localStorage.removeItem('intellilearn_refresh_token');
    localStorage.removeItem('intellilearn_user');
    localStorage.removeItem('intellilearn_admin_user');
    sessionStorage.removeItem('intellilearn_active_chat_session_id');
  } catch {
    // Ignore storage failures and still redirect.
  }

  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
}

function getAccessToken() {
  return localStorage.getItem('intellilearn_access_token') || '';
}

async function apiFetch(path, options = {}) {
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
      throw new Error(AUTH_ERROR_MESSAGE);
    }
    throw new Error(payload?.detail || `Request failed (${response.status})`);
  }

  return response.json();
}

export async function askTutor(message, sessionId = null) {
  return apiFetch('/api/chat/ask-ai', {
    method: 'POST',
    body: JSON.stringify({ message, sessionId }),
  });
}

export async function getTutorSessions(page = 1, limit = 20) {
  return apiFetch(`/api/chat/sessions?page=${page}&limit=${limit}`, {
    method: 'GET',
  });
}

export async function createTutorSession(title = '') {
  return apiFetch('/api/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function getTutorSession(sessionId) {
  return apiFetch(`/api/chat/sessions/${sessionId}`, {
    method: 'GET',
  });
}

export async function deleteTutorSession(sessionId) {
  return apiFetch(`/api/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

export async function updateTutorSessionTitle(sessionId, title) {
  return apiFetch(`/api/chat/sessions/${sessionId}/title`, {
    method: 'PUT',
    body: JSON.stringify({ title }),
  });
}

export async function autoTitleTutorSession(sessionId, seedText = '') {
  return apiFetch(`/api/chat/sessions/${sessionId}/title/auto`, {
    method: 'POST',
    body: JSON.stringify({ seedText }),
  });
}

