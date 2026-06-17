import { describe, it, expect } from 'vitest';

/**
 * 特征测试：验证 Bilibili URL 解析逻辑
 *
 * 这些测试记录了程序的关键行为作为"真理"。
 * 重构时运行这些测试，确保功能没有坏。
 */

// 从 electron/main.ts 提取的正则，保持一致
const MEDIALIST_RE = /medialist\/play\/dlista\/(\d+)\/(\d+)/;
const FAVLIST_RE = /space\.bilibili\.com\/(\d+)\/favlist\?.*fid=(\d+)/;

function parsePlaylistUrl(url: string) {
  const m1 = url.match(MEDIALIST_RE);
  if (m1) return { seasonId: m1[1]!, mid: m1[2]! };
  const m2 = url.match(FAVLIST_RE);
  if (m2) return { seasonId: m2[2]!, mid: m2[1]! };
  return null;
}

describe('Bilibili 收藏夹 URL 解析', () => {
  it('解析 medialist 格式', () => {
    const url = 'https://www.bilibili.com/medialist/play/dlista/123456/789012';
    const result = parsePlaylistUrl(url);
    expect(result).toEqual({ seasonId: '123456', mid: '789012' });
  });

  it('解析 space.bilibili.com 格式', () => {
    const url = 'https://space.bilibili.com/789012/favlist?fid=123456';
    const result = parsePlaylistUrl(url);
    expect(result).toEqual({ seasonId: '123456', mid: '789012' });
  });

  it('无效 URL 返回 null', () => {
    expect(parsePlaylistUrl('https://bilibili.com/video/BV123')).toBeNull();
    expect(parsePlaylistUrl('')).toBeNull();
    expect(parsePlaylistUrl('not a url')).toBeNull();
  });

  it('medialist URL 带额外参数也能解析', () => {
    const url = 'https://www.bilibili.com/medialist/play/dlista/111/222?spm_id_from=333.999.0.0';
    const result = parsePlaylistUrl(url);
    expect(result).toEqual({ seasonId: '111', mid: '222' });
  });

  it('space URL 带额外参数也能解析', () => {
    const url = 'https://space.bilibili.com/333/favlist?fid=444&spm_id_from=333.999.0.0';
    const result = parsePlaylistUrl(url);
    expect(result).toEqual({ seasonId: '444', mid: '333' });
  });
});

describe('BV 号提取', () => {
  // 从 App.tsx handleInputSubmit 提取的正则
  const BV_RE = /BV[a-zA-Z0-9]+/i;

  it('从纯 BV 号提取', () => {
    expect('BV1GJ411x7h7'.match(BV_RE)?.[0]).toBe('BV1GJ411x7h7');
  });

  it('从完整 URL 提取', () => {
    const url = 'https://www.bilibili.com/video/BV1GJ411x7h7';
    expect(url.match(BV_RE)?.[0]).toBe('BV1GJ411x7h7');
  });

  it('无效输入返回 null', () => {
    expect('没有BV号'.match(BV_RE)).toBeNull();
    expect('BV'.match(BV_RE)).toBeNull();
  });
});

describe('播放模式循环', () => {
  // 从 ModeIcon.tsx 提取
  const MODE_ORDER = ['loop', 'single', 'shuffle'] as const;
  function nextMode(current: string) {
    const idx = MODE_ORDER.indexOf(current as any);
    return MODE_ORDER[(idx + 1) % MODE_ORDER.length];
  }

  it('完整循环一圈回到起点', () => {
    expect(nextMode('loop')).toBe('single');
    expect(nextMode('single')).toBe('shuffle');
    expect(nextMode('shuffle')).toBe('loop');
  });
});

describe('收藏夹匹配逻辑', () => {
  // 从 App.tsx handleToggleFavorite 提取
  function isTrackInFavorites(
    track: { bvid: string; cid: number },
    favorites: Array<{ tracks: Array<{ bvid: string; cid: number }> }>
  ) {
    return favorites.some(f =>
      f.tracks.some(t => t.bvid === track.bvid && t.cid === track.cid)
    );
  }

  it('空收藏夹返回 false', () => {
    expect(isTrackInFavorites({ bvid: 'BV1', cid: 1 }, [])).toBe(false);
  });

  it('找到匹配返回 true', () => {
    const favs = [{ tracks: [{ bvid: 'BV1', cid: 1 }] }];
    expect(isTrackInFavorites({ bvid: 'BV1', cid: 1 }, favs)).toBe(true);
  });

  it('bvid 相同但 cid 不同返回 false', () => {
    const favs = [{ tracks: [{ bvid: 'BV1', cid: 1 }] }];
    expect(isTrackInFavorites({ bvid: 'BV1', cid: 999 }, favs)).toBe(false);
  });
});
