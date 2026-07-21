export interface Track {
  bvid: string;       //BV号
  cid: number;        //分P编号
  title: string;      //标题
  author: string;     //作者
  cover: string;      //封面的url
  duration?: number;  //时长
}

export type PlayMode = 'loop' | 'single' | 'shuffle';     //三种播放模式（列表，单曲，随机）

export type CollapsedState = 'collapsed' | 'expanded';

export interface WindowPosition {
  left: number;
  top: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface PlaylistState {  //播放列表状态
  tracks: Track[];
  currentIndex: number;       // 当前播的是第几首（从0开始）
  playMode: PlayMode;
}

export interface PlayerState {      //播放器实时状态
  isPlaying: boolean;     //是否正在播放
  currentTime: number;    //当前播放时间
  duration: number;     //总时长
  buffered: number;       //已缓冲到的秒数
  volume: number;     //音量0—1
  currentAudio: CurrentAudio | null;      //当前播放的音频信息
}

export interface FavoriteFolder {     //收藏夹
  id: string;
  name: string;
  icon: string;
  tracks: Track[];
  updatedAt: number;
}

export type CurrentAudio = Pick<Track, 'bvid' | 'cid' | 'title' | 'author' | 'cover'>;

export type { VideoInfo, AudioUrl } from './api';
export type { IpcMessage, IpcResponse } from './ipc';
