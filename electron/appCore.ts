// electron/appCore.ts
import Store from 'electron-store';
import type { BrowserWindow } from 'electron';

export const appCore = {
  mainWindow: null as BrowserWindow | null,
  store: new Store<{
    volume: number;
    playMode: 'loop' | 'single' | 'shuffle';
    playlistTracks: any[];
    playlistIndex: number;
    favorites: any[];
    recentTracks: any[];
    windowPosition: { left: number; top: number };
    windowSize: { width: number; height: number };
    expandedPanelSize: { width: number; height: number };
  }>(),
};