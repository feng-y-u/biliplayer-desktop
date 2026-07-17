import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AudioCache } from '../audioCache';

describe('AudioCache', () => {
  let cache: AudioCache;

  beforeEach(() => {
    cache = new AudioCache();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('isValid when same track and far from expiry', () => {
    cache.save('https://cdn/a.m4s', Date.now() + 600_000, 'BV1', 1);
    expect(cache.isValid('BV1', 1)).toBe(true);
  });

  it('isValid false within 60s of expiry', () => {
    cache.save('https://cdn/a.m4s', Date.now() + 30_000, 'BV1', 1);
    expect(cache.isValid('BV1', 1)).toBe(false);
    expect(cache.isExpiring()).toBe(true);
  });

  it('isValid false for different track', () => {
    cache.save('https://cdn/a.m4s', Date.now() + 600_000, 'BV1', 1);
    expect(cache.isValid('BV2', 1)).toBe(false);
    expect(cache.isValid('BV1', 2)).toBe(false);
  });

  it('invalidate clears so dead urls are not reused', () => {
    cache.save('https://cdn/dead.m4s', Date.now() + 600_000, 'BV1', 1);
    cache.invalidate();
    expect(cache.isValid('BV1', 1)).toBe(false);
    expect(cache.state.url).toBe('');
  });
});
