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

export type CurrentAudio = Pick<Track, 'bvid' | 'cid' | 'title' | 'author' | 'cover'>;
