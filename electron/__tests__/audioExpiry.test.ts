import { describe, it, expect } from 'vitest';
import { expiryFromAudioUrl } from '../bilibiliApi';

describe('expiryFromAudioUrl', () => {
  it('parses deadline query (unix seconds) to ms', () => {
    const url = 'https://upos.bilivideo.com/x.m4s?deadline=1700000000&foo=1';
    expect(expiryFromAudioUrl(url, 0)).toBe(1700000000 * 1000);
  });

  it('falls back to now + 10min when no deadline', () => {
    const now = 1_000_000;
    expect(expiryFromAudioUrl('https://cdn.example/a.m4s', now)).toBe(now + 10 * 60 * 1000);
  });

  it('falls back on malformed url', () => {
    const now = 5_000;
    expect(expiryFromAudioUrl('not a url', now)).toBe(now + 10 * 60 * 1000);
  });
});
