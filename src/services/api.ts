/**
 * 渲染进程的 B 站 API 调用层。
 *
 * 职责：
 * - 封装所有 IPC 调用，渲染进程不直接 fetch
 * - 音频播放逻辑已迁移至 audioEngine.ts（状态机管理）
 */

const api = window.electronAPI?.api;

export async function getVideoInfo(bvid: string) {
  return api({ type: 'GET_VIDEO_INFO', bvid });
}

export async function getPlaylist(url: string) {
  return api({ type: 'GET_PLAYLIST', url });
}

export async function getFavList(mediaId: string) {
  return api({ type: 'GET_FAV_LIST', mediaId });
}

export async function getSeriesList(mid: string, sid: string) {
  return api({ type: 'GET_SERIES_LIST', mid, sid });
}

export async function getColleList(mid: string, sid: string) {
  return api({ type: 'GET_COLLE_LIST', mid, sid });
}

export async function getAudioUrl(bvid: string, cid: number) {
  return api({ type: 'GET_AUDIO_URL', bvid, cid });
}
