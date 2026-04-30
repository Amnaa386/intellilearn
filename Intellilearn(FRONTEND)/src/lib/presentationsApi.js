const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
import { buildApiCacheKey, clearInflightRequest, getCachedValue, getInflightRequest, invalidateApiCacheByPath, setCachedValue, setInflightRequest } from '@/lib/apiCache';

function handleUnauthorized() {
  try {
    localStorage.removeItem('intellilearn_access_token');
    localStorage.removeItem('intellilearn_refresh_token');
    localStorage.removeItem('intellilearn_user');
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') window.location.href = '/auth/login';
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('intellilearn_access_token') || '';
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
        throw new Error('Session expired. Please login again.');
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

export function getPresentations(page = 1, limit = 100) {
  return apiFetch(`/api/presentations/?page=${page}&limit=${limit}`, { method: 'GET', cacheTTL: 45000 });
}

export function createPresentation(payload) {
  return apiFetch('/api/presentations', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((data) => {
    invalidateApiCacheByPath('/api/presentations');
    return data;
  });
}

export function deletePresentation(presentationId) {
  return apiFetch(`/api/presentations/${presentationId}`, {
    method: 'DELETE',
  }).then((data) => {
    invalidateApiCacheByPath('/api/presentations');
    return data;
  });
}
