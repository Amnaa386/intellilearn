/**
 * AI Tutor chat sessions for quiz generation (chat-based only — no subject taxonomy).
 */

export const CHAT_SESSIONS_STORAGE_KEY = 'intellilearn_chat_sessions';

/** Seed sessions so the quiz page always has realistic examples before first tutor use */
const DEFAULT_SESSIONS = [
  {
    id: 'chat-demo-001',
    preview:
      'Can you walk me through how gradient descent behaves when the learning rate is too high? I keep seeing oscillations…',
    messageCount: 12,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'chat-demo-002',
    preview:
      'I need help connecting Ohm’s law to how we measure voltage drops across series resistors in my lab write-up.',
    messageCount: 8,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'chat-demo-003',
    preview:
      'Explain the difference between correlation and causation using an example from public health data.',
    messageCount: 15,
    updatedAt: Date.now() - 3600000 * 5,
  },
];

export function loadChatSessions() {
  try {
    const raw = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
    const userSessions = raw ? JSON.parse(raw) : [];
    const byId = new Map();
    DEFAULT_SESSIONS.forEach((s) => byId.set(s.id, { ...s }));
    if (Array.isArray(userSessions)) {
      userSessions.forEach((s) => {
        if (s?.id) byId.set(s.id, { ...byId.get(s.id), ...s });
      });
    }
    return Array.from(byId.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch {
    return [...DEFAULT_SESSIONS];
  }
}

export function upsertChatSession(entry) {
  let userSessions = [];
  try {
    const raw = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
    userSessions = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(userSessions)) userSessions = [];
  } catch {
    userSessions = [];
  }
  const row = { ...entry, updatedAt: entry.updatedAt ?? Date.now() };
  const idx = userSessions.findIndex((s) => s.id === entry.id);
  if (idx >= 0) userSessions[idx] = row;
  else userSessions.unshift(row);
  localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(userSessions.slice(0, 30)));
}
