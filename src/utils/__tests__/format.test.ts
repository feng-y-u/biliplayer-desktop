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

  // ⚠️ 已知 bug：0 被当作 falsy 返回 '--:--'
  // 期望：formatDuration(0) === '0:00'
  // 实际：formatDuration(0) === '--:--'
  it('[BUG] zero returns --:-- instead of 0:00', () => {
    expect(formatDuration(0)).toBe('--:--');
  });

  // ⚠️ 已知 bug：负数没有过滤
  it('[BUG] negative values produce invalid output', () => {
    expect(formatDuration(-1)).toBe('-1:-1');
  });
});
