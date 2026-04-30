const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

import { handleUnauthorized } from '@/lib/tutorApi';
import { buildApiCacheKey, clearInflightRequest, getCachedValue, getInflightRequest, setCachedValue, setInflightRequest } from '@/lib/apiCache';

function getAccessToken() {
  return localStorage.getItem('intellilearn_access_token') || '';
}

async function analyticsFetch(path, options = {}) {
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

export async function getUserAnalyticsOverview() {
  return analyticsFetch('/api/analytics/user/overview', { method: 'GET', cacheTTL: 20000 });
}

export async function getUserActivityLogs({ page = 1, limit = 200, action } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (action) params.set('action', action);
  return analyticsFetch(`/api/analytics/user/activity-logs?${params.toString()}`, { method: 'GET', cacheTTL: 15000 });
}

export async function getChatStats() {
  return analyticsFetch('/api/chat/stats', { method: 'GET', cacheTTL: 20000 });
}

export async function getQuizStats() {
  return analyticsFetch('/api/quiz/stats/overview', { method: 'GET', cacheTTL: 20000 });
}

export async function getNotesStats() {
  return analyticsFetch('/api/notes/stats/overview', { method: 'GET', cacheTTL: 20000 });
}
