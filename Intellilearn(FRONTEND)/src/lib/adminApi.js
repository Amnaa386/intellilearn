import { handleUnauthorized } from '@/lib/tutorApi';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const adminGetCache = new Map();

function getAccessToken() {
  return localStorage.getItem('intellilearn_access_token') || '';
}

async function adminFetch(path, options = {}) {
  const token = getAccessToken();
  const timeoutMs = Number(options.timeoutMs ?? 45000);
  const method = String(options.method || 'GET').toUpperCase();
  const cacheTTL = Number(options.cacheTTL ?? (method === 'GET' ? 20000 : 0));
  const bypassCache = Boolean(options.bypassCache);
  const cacheKey = `${token}:${method}:${path}`;
  const { timeoutMs: _timeoutMs, cacheTTL: _cacheTTL, bypassCache: _bypassCache, ...fetchOptions } = options;

  if (method === 'GET' && cacheTTL > 0 && !bypassCache) {
    const cached = adminGetCache.get(cacheKey);
    if (cached && Date.now() - cached.at < cacheTTL) return cached.value;
  }
  const controller = new AbortController();
  const timeoutId = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(fetchOptions.headers || {}),
    },
  })
    .catch((error) => {
    if (error?.name === 'AbortError') {
      throw new Error('Admin request timed out. Please try again.');
    }
    throw error;
    })
    .finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired. Please login again.');
    }
    if (response.status === 403) {
      throw new Error('Admin access required for this action.');
    }
    throw new Error(payload?.detail || `Request failed (${response.status})`);
  }

  const data = await response.json();
  if (method === 'GET' && cacheTTL > 0) {
    adminGetCache.set(cacheKey, { value: data, at: Date.now() });
  }
  return data;
}

export function getAdminOverview() {
  return adminFetch('/api/admin/overview', { cacheTTL: 15000 });
}

export function getAdminUsers({ page = 1, limit = 50, search = '' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) params.set('search', search.trim());
  return adminFetch(`/api/admin/users?${params.toString()}`, { cacheTTL: 10000 });
}

export function createAdminUser(payload) {
  return adminFetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminUser(userId) {
  return adminFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
}

export function getAdminAiActivity(timeframe = 'weekly') {
  return adminFetch(`/api/admin/ai-activity?timeframe=${encodeURIComponent(timeframe)}`, { cacheTTL: 8000 });
}

export function getAdminAnalytics(timeframe = 'weekly') {
  return adminFetch(`/api/admin/analytics?timeframe=${encodeURIComponent(timeframe)}`, { cacheTTL: 8000 });
}

export function getAdminSettings() {
  return adminFetch('/api/admin/settings', { cacheTTL: 20000 });
}

export function updateAdminSetting(settingId, enabled) {
  return adminFetch(`/api/admin/settings/${settingId}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
}

export function getAdminCommonQueries() {
  return adminFetch('/api/admin/content/common-queries', { cacheTTL: 0, bypassCache: true });
}

export function getAdminActivityLogs({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return adminFetch(`/api/analytics/admin/activity-logs?${params.toString()}`, { cacheTTL: 10000 });
}
