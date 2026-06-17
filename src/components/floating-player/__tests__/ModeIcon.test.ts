import { describe, it, expect } from 'vitest';
import { nextMode, modeTitle, MODE_ORDER } from '../ModeIcon';

describe('nextMode', () => {
  it('cycles loop → single → shuffle → loop', () => {
    expect(nextMode('loop')).toBe('single');
    expect(nextMode('single')).toBe('shuffle');
    expect(nextMode('shuffle')).toBe('loop');
  });

  it('MODE_ORDER has 3 entries', () => {
    expect(MODE_ORDER).toHaveLength(3);
    expect(MODE_ORDER).toContain('loop');
    expect(MODE_ORDER).toContain('single');
    expect(MODE_ORDER).toContain('shuffle');
  });
});

describe('modeTitle', () => {
  it('returns correct Chinese titles', () => {
    expect(modeTitle('loop')).toBe('列表循环');
    expect(modeTitle('single')).toBe('单曲循环');
    expect(modeTitle('shuffle')).toBe('随机播放');
  });
});
