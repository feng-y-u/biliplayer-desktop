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
  backupUrls?: string[];
  expiresAt: number;
}
