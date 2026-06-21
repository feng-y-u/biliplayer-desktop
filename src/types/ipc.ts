import type { VideoInfo, AudioUrl, PlaylistData } from './api';

export type IpcMessage =
  | { type: 'GET_VIDEO_INFO'; bvid: string }
  | { type: 'GET_PLAYLIST'; url: string }
  | { type: 'GET_AUDIO_URL'; bvid: string; cid: number };

export type IpcResponseMap = {
  GET_VIDEO_INFO: VideoInfo;
  GET_PLAYLIST: PlaylistData;
  GET_AUDIO_URL: AudioUrl;
};

export type IpcResponse<T extends IpcMessage['type']> =
  | { success: true; data: IpcResponseMap[T] }
  | { success: false; error: string };
