const memoryCache = new Map();
const inflightRequests = new Map();

function now() {
  return Date.now();
}

function safeReadSessionStorage(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeWriteSessionStorage(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

export function buildApiCacheKey({ token = '', path = '' }) {
  const tokenSlice = token ? token.slice(-16) : 'anon';
  return `api-cache:${tokenSlice}:${path}`;
}

export function getCachedValue(key) {
  const memoryEntry = memoryCache.get(key);
  if (memoryEntry && memoryEntry.expiresAt > now()) {
    return memoryEntry.value;
  }
  if (memoryEntry) memoryCache.delete(key);

  const diskEntry = safeReadSessionStorage(key);
  if (diskEntry && diskEntry.expiresAt > now()) {
    memoryCache.set(key, diskEntry);
    return diskEntry.value;
  }
  return null;
}

export function setCachedValue(key, value, ttlMs = 20000) {
  const entry = {
    value,
    expiresAt: now() + Math.max(1, ttlMs),
  };
  memoryCache.set(key, entry);
  safeWriteSessionStorage(key, entry);
}

export function invalidateApiCacheByPath(pathPrefix = '') {
  if (!pathPrefix) return;
  const keys = Array.from(memoryCache.keys());
  keys.forEach((key) => {
    if (key.includes(pathPrefix)) {
      memoryCache.delete(key);
      try {
        sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
  });
}

export function getInflightRequest(key) {
  return inflightRequests.get(key) || null;
}

export function setInflightRequest(key, promise) {
  if (!key || !promise) return;
  inflightRequests.set(key, promise);
}

export function clearInflightRequest(key) {
  inflightRequests.delete(key);
}
