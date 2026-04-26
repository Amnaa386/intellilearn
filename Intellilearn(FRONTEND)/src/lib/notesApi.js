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

export async function getNotes(page = 1, limit = 100) {
  return apiFetch(`/api/notes?page=${page}&limit=${limit}`, { method: 'GET' });
}

export async function createNote(notePayload) {
  return apiFetch('/api/notes', {
    method: 'POST',
    body: JSON.stringify(notePayload),
  });
}

export async function deleteNote(noteId) {
  return apiFetch(`/api/notes/${noteId}`, {
    method: 'DELETE',
  });
}
