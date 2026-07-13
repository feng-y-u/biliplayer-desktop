import { describe, it, expect } from 'vitest';
import { parsePlaylistUrl } from '../bilibiliApi';
import { nextMode, MODE_ORDER } from '../../src/components/floating-player/ModeIcon';
import { isTrackFavorited, isSameTrack } from '../../src/utils/track';
import { extractBvid } from '../../src/utils/bilibili';
import type { Track, FavoriteFolder } from '../../src/types';

/**
 * 特征测试：验证关键业务逻辑
 *
 * 直接 import 生产函数，重构时运行这些测试确保功能没有坏。
 */

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
  it('从纯 BV 号提取', () => {
    expect(extractBvid('BV1GJ411x7h7')).toBe('BV1GJ411x7h7');
  });

  it('从完整 URL 提取', () => {
    const url = 'https://www.bilibili.com/video/BV1GJ411x7h7';
    expect(extractBvid(url)).toBe('BV1GJ411x7h7');
  });

  it('无效输入返回 null', () => {
    expect(extractBvid('没有BV号')).toBeNull();
    expect(extractBvid('BV')).toBeNull();
  });
});

describe('播放模式循环', () => {
  it('完整循环一圈回到起点', () => {
    expect(nextMode('loop')).toBe('single');
    expect(nextMode('single')).toBe('shuffle');
    expect(nextMode('shuffle')).toBe('loop');
  });

  it('MODE_ORDER 包含三种模式', () => {
    expect(MODE_ORDER).toEqual(['loop', 'single', 'shuffle']);
  });
});

describe('收藏夹匹配逻辑', () => {
  const mkTrack = (bvid: string, cid: number): Track => ({ bvid, cid, title: '', author: '', cover: '' });
  const mkFav = (tracks: Track[]): FavoriteFolder => ({ id: '1', name: 'test', icon: '🎵', tracks, updatedAt: 0 });

  it('空收藏夹返回 false', () => {
    expect(isTrackFavorited(mkTrack('BV1', 1), [])).toBe(false);
  });

  it('找到匹配返回 true', () => {
    const favs = [mkFav([mkTrack('BV1', 1)])];
    expect(isTrackFavorited(mkTrack('BV1', 1), favs)).toBe(true);
  });

  it('bvid 相同但 cid 不同返回 false', () => {
    const favs = [mkFav([mkTrack('BV1', 1)])];
    expect(isTrackFavorited(mkTrack('BV1', 999), favs)).toBe(false);
  });

  it('isSameTrack 比较 bvid + cid', () => {
    expect(isSameTrack(mkTrack('BV1', 1), mkTrack('BV1', 1))).toBe(true);
    expect(isSameTrack(mkTrack('BV1', 1), mkTrack('BV1', 2))).toBe(false);
    expect(isSameTrack(mkTrack('BV1', 1), mkTrack('BV2', 1))).toBe(false);
  });
});
