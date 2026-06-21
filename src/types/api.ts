export interface VideoInfo {
  bvid: string;
  cid: number;
  title: string;
  author: string;
  cover: string;
  duration: number;
}

export interface AudioUrl {
  url: string;
  expiresAt: number;
}

export interface PlaylistData {
  tracks: VideoInfo[];
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
