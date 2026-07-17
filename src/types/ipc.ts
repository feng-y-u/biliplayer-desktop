import type { VideoInfo, AudioUrl } from './api';

export type IpcMessage =
  | { type: 'GET_VIDEO_INFO'; bvid: string }
  | { type: 'GET_PLAYLIST'; url: string }
  | { type: 'GET_FAV_LIST'; mediaId: string }
  | { type: 'GET_SERIES_LIST'; mid: string; sid: string }
  | { type: 'GET_COLLE_LIST'; mid: string; sid: string }
  | { type: 'GET_AUDIO_URL'; bvid: string; cid: number };

export type IpcResponseMap = {
  GET_VIDEO_INFO: VideoInfo;
  GET_PLAYLIST: VideoInfo[];
  GET_FAV_LIST: VideoInfo[];
  GET_SERIES_LIST: VideoInfo[];
  GET_COLLE_LIST: VideoInfo[];
  GET_AUDIO_URL: AudioUrl;
};

export type IpcResponse<T extends IpcMessage['type']> =
  | { success: true; data: IpcResponseMap[T] }
  | { success: false; error: string };
