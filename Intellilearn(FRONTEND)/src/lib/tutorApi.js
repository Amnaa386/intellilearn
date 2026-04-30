const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const AUTH_ERROR_MESSAGE = 'Session expired. Please login again.';
import { buildApiCacheKey, clearInflightRequest, getCachedValue, getInflightRequest, invalidateApiCacheByPath, setCachedValue, setInflightRequest } from '@/lib/apiCache';

export function handleUnauthorized() {
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
  const method = String(options.method || 'GET').toUpperCase();
  const cacheTTL = Number(options.cacheTTL || 0);
  const bypassCache = Boolean(options.bypassCache);
  const { cacheTTL: _cacheTTL, bypassCache: _bypassCache, ...fetchOptions } = options;
  const cacheKey = buildApiCacheKey({ token, path: `${method}:${path}` });

  if (method === 'GET' && cacheTTL > 0 && !bypassCache) {
    const hit = getCachedValue(cacheKey);
    if (hit) return hit;
    const inflight = getInflightRequest(cacheKey);
    if (inflight) return inflight;
  }

  const run = async () => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(fetchOptions.headers || {}),
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

    const data = await response.json();
    if (method === 'GET' && cacheTTL > 0) {
      setCachedValue(cacheKey, data, cacheTTL);
    }
    return data;
  };

  if (method === 'GET' && cacheTTL > 0 && !bypassCache) {
    const promise = run().finally(() => clearInflightRequest(cacheKey));
    setInflightRequest(cacheKey, promise);
    return promise;
  }
  return run();
}

export async function askTutor(message, sessionId = null, context = null) {
  return apiFetch('/api/chat/ask-ai', {
    method: 'POST',
    body: JSON.stringify({ message, sessionId, context }),
  });
}

export async function getTutorSessions(page = 1, limit = 20) {
  return apiFetch(`/api/chat/sessions?page=${page}&limit=${limit}`, {
    method: 'GET',
    cacheTTL: 15000,
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
    cacheTTL: 10000,
  });
}

export async function deleteTutorSession(sessionId) {
  const data = await apiFetch(`/api/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  invalidateApiCacheByPath('/api/chat/sessions');
  return data;
}

export async function updateTutorSessionTitle(sessionId, title) {
  const data = await apiFetch(`/api/chat/sessions/${sessionId}/title`, {
    method: 'PUT',
    body: JSON.stringify({ title }),
  });
  invalidateApiCacheByPath('/api/chat/sessions');
  return data;
}

export async function autoTitleTutorSession(sessionId, seedText = '') {
  const data = await apiFetch(`/api/chat/sessions/${sessionId}/title/auto`, {
    method: 'POST',
    body: JSON.stringify({ seedText }),
  });
  invalidateApiCacheByPath('/api/chat/sessions');
  return data;
}

