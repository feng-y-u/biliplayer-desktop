import { describe, it, expect } from 'vitest';
import { isSameTrack } from '../track';

describe('isSameTrack', () => {
  it('returns true for same bvid and cid', () => {
    expect(isSameTrack({ bvid: 'BV1', cid: 1 }, { bvid: 'BV1', cid: 1 })).toBe(true);
  });

  it('returns false for different bvid', () => {
    expect(isSameTrack({ bvid: 'BV1', cid: 1 }, { bvid: 'BV2', cid: 1 })).toBe(false);
  });

  it('returns false for different cid', () => {
    expect(isSameTrack({ bvid: 'BV1', cid: 1 }, { bvid: 'BV1', cid: 2 })).toBe(false);
  });
});
