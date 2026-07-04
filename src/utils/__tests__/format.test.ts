import { describe, it, expect } from 'vitest';
import { formatDuration } from '../format';

describe('formatDuration', () => {
  it('formats seconds to m:ss', () => {
    expect(formatDuration(30)).toBe('0:30');
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(3661)).toBe('61:01');
  });

  it('pads single digits', () => {
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(65)).toBe('1:05');
  });

  it('handles undefined/null', () => {
    expect(formatDuration(undefined)).toBe('--:--');
    expect(formatDuration(null as any)).toBe('--:--');
  });

  it('handles Infinity', () => {
    expect(formatDuration(Infinity)).toBe('--:--');
  });

  it('formats zero as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('handles negative values', () => {
    expect(formatDuration(-1)).toBe('--:--');
    expect(formatDuration(-60)).toBe('--:--');
  });
});

import { calcProgress } from '../format';

describe('calcProgress', () => {
  it('正常值', () => {
    expect(calcProgress(30, 100)).toBe(30);
  });
  it('零总值返回 0', () => {
    expect(calcProgress(30, 0)).toBe(0);
  });
  it('当前值等于总值', () => {
    expect(calcProgress(100, 100)).toBe(100);
  });
  it('当前值大于总值', () => {
    expect(calcProgress(150, 100)).toBe(150);
  });
});
