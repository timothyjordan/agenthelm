import { describe, it, expect } from 'vitest';
import {
  normalizeUrl, loadBookmarks, saveBookmarks, upsertBookmark, removeBookmark, STORAGE_KEY,
} from '../src/bookmarks.js';

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, v), _map: map };
}

describe('normalizeUrl', () => {
  it('adds https to a bare domain', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com/');
    expect(normalizeUrl('threejs.org/manual')).toBe('https://threejs.org/manual');
  });
  it('keeps a valid http url', () => {
    expect(normalizeUrl('http://localhost:5173/app')).toContain('http://localhost');
  });
  it('rejects garbage and non-http schemes', () => {
    expect(normalizeUrl('htp:/bad')).toBeNull();
    expect(normalizeUrl('not a url')).toBeNull();
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl(null)).toBeNull();
  });
});

describe('bookmark store', () => {
  it('seeds defaults when storage is empty', () => {
    expect(loadBookmarks(fakeStorage()).length).toBeGreaterThan(0);
  });
  it('keeps loading bookmarks stored under the original storage key', () => {
    const seeded = JSON.stringify([{ id: 'old', name: 'Old', url: 'https://example.com/' }]);
    const s = fakeStorage({ 'agent-control.bookmarks.v1': seeded });
    expect(loadBookmarks(s)).toEqual([{ id: 'old', name: 'Old', url: 'https://example.com/' }]);
  });
  it('round trips through storage', () => {
    const s = fakeStorage();
    const list = [{ id: 'x', name: 'X', url: 'https://example.com/' }];
    saveBookmarks(s, list);
    expect(s._map.get(STORAGE_KEY)).toContain('example.com');
    expect(loadBookmarks(s)).toEqual(list);
  });
  it('dedupes by url on upsert and updates the name', () => {
    const list = [{ id: 'x', name: 'Old', url: 'https://example.com/' }];
    const next = upsertBookmark(list, { name: 'New', url: 'example.com' });
    expect(next).toHaveLength(1);
    expect(next[0].name).toBe('New');
  });
  it('adds a new bookmark and removes by id', () => {
    const next = upsertBookmark([], { name: 'Three', url: 'threejs.org' });
    expect(next).toHaveLength(1);
    expect(removeBookmark(next, next[0].id)).toEqual([]);
  });
  it('ignores an invalid url on upsert', () => {
    expect(upsertBookmark([], { name: 'Bad', url: ':::' })).toEqual([]);
  });
});
