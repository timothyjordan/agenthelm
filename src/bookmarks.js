export const STORAGE_KEY = 'agent-control.bookmarks.v1';

export const DEFAULT_BOOKMARKS = [
  { id: 'bm-example', name: 'Example Domain', url: 'https://example.com' },
  { id: 'bm-three', name: 'Three.js', url: 'https://threejs.org' },
  { id: 'bm-mdn-webxr', name: 'MDN WebXR', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API' },
];

export function normalizeUrl(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (parsed.hostname !== 'localhost' && !parsed.hostname.includes('.')) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function loadBookmarks(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_BOOKMARKS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_BOOKMARKS];
    return parsed
      .filter((b) => b && typeof b.name === 'string' && normalizeUrl(b.url))
      .map((b) => ({ id: String(b.id || `bm-${b.url}`), name: b.name, url: normalizeUrl(b.url) }));
  } catch {
    return [...DEFAULT_BOOKMARKS];
  }
}

export function saveBookmarks(storage, list) {
  storage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

export function upsertBookmark(list, { name, url }) {
  const normalized = normalizeUrl(url);
  if (!normalized) return list;
  const existing = list.find((b) => b.url === normalized);
  if (existing) {
    return list.map((b) => (b.id === existing.id ? { ...b, name: name?.trim() || b.name } : b));
  }
  const id = `bm-${Date.now().toString(36)}`;
  return [...list, { id, name: name?.trim() || normalized, url: normalized }];
}

export function removeBookmark(list, id) {
  return list.filter((b) => b.id !== id);
}
