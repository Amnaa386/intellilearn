const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const AUTH_ERROR_MESSAGE = 'Session expired. Please login again.';
import { buildApiCacheKey, clearInflightRequest, getCachedValue, getInflightRequest, invalidateApiCacheByPath, setCachedValue, setInflightRequest } from '@/lib/apiCache';

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

export async function getNotes(page = 1, limit = 100) {
  return apiFetch(`/api/notes/?page=${page}&limit=${limit}`, { method: 'GET', cacheTTL: 45000 });
}

export async function createNote(notePayload) {
  const data = await apiFetch('/api/notes', {
    method: 'POST',
    body: JSON.stringify(notePayload),
  });
  invalidateApiCacheByPath('/api/notes');
  return data;
}

export async function deleteNote(noteId) {
  const data = await apiFetch(`/api/notes/${noteId}`, {
    method: 'DELETE',
  });
  invalidateApiCacheByPath('/api/notes');
  return data;
}
