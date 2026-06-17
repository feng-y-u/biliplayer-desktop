export interface Track {
  bvid: string;
  cid: number;
  title: string;
  author: string;
  cover: string;
  duration?: number;
}

export type PlayMode = 'loop' | 'single' | 'shuffle';

export type CollapsedState = 'collapsed' | 'expanded';

export interface WindowPosition {
  left: number;
  top: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface PlaylistState {
  tracks: Track[];
  currentIndex: number;
  playMode: PlayMode;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  currentAudio: CurrentAudio | null;
}

export interface FavoriteFolder {
  id: string;
  name: string;
  icon: string;
  tracks: Track[];
  updatedAt: number;
}

export type ApiMessage =
  | { type: 'GET_VIDEO_INFO'; bvid: string }
  | { type: 'GET_PLAYLIST'; url: string }
  | { type: 'GET_AUDIO_URL'; bvid: string; cid: number };

export type ApiResponse =
  | { success: true; data: any }
  | { success: false; error: string };

export type CurrentAudio = Pick<Track, 'bvid' | 'cid' | 'title' | 'author' | 'cover'>;
