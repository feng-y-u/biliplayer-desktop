import { create } from 'zustand';
import type { WindowPosition, WindowSize } from '@/types';

const BATCH_FLUSH_DELAY_MS = 100;
const DEFAULT_WINDOW_SIZE: WindowSize = { width: 320, height: 480 };
const DEFAULT_EXPANDED_SIZE: WindowSize = { width: 330, height: 700 };

interface WindowState {
  windowPosition: WindowPosition;
  windowSize: WindowSize;
  expandedPanelSize: WindowSize | null;
  volume: number;
  theme: 'light' | 'dark';
}

interface WindowActions {
  setWindowPosition: (pos: WindowPosition) => void;
  setWindowSize: (size: WindowSize) => void;
  setExpandedPanelSize: (size: WindowSize) => void;
  setVolume: (volume: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  loadFromStore: () => Promise<void>;
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;
const pendingWrites: Record<string, unknown> = {};

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    for (const [key, value] of Object.entries(pendingWrites)) {
      window.electronAPI?.storeSet(key, value);
    }
    Object.keys(pendingWrites).forEach(k => delete pendingWrites[k]);
  }, BATCH_FLUSH_DELAY_MS);
}

function batchPersist(key: string, value: unknown) {
  pendingWrites[key] = value;
  scheduleFlush();
}

export const useWindowStore = create<WindowState & WindowActions>((set) => ({
  windowPosition: { left: 0, top: 0 },
  windowSize: DEFAULT_WINDOW_SIZE,
  expandedPanelSize: null,
  volume: 0.7,
  theme: 'light',

  setWindowPosition: (windowPosition) => {
    set({ windowPosition });
    batchPersist('windowPosition', windowPosition);
  },

  setWindowSize: (windowSize) => {
    set({ windowSize });
    batchPersist('windowSize', windowSize);
  },

  setExpandedPanelSize: (expandedPanelSize) => {
    set({ expandedPanelSize });
    batchPersist('expandedPanelSize', expandedPanelSize);
  },

  setVolume: (volume) => {
    set({ volume });
    batchPersist('volume', volume);
  },

  setTheme: (theme) => {
    set({ theme });
    batchPersist('theme', theme);
  },

  loadFromStore: async () => {
    const api = window.electronAPI;
    if (!api) return;
    const [pos, size, expandedSize, vol, theme] = await Promise.all([
      api.storeGet('windowPosition'),
      api.storeGet('windowSize'),
      api.storeGet('expandedPanelSize'),
      api.storeGet('volume'),
      api.storeGet('theme'),
    ]);
    if (pos) set({ windowPosition: pos });
    if (size) set({ windowSize: size });
    if (expandedSize) {
      set({ expandedPanelSize: expandedSize });
    } else {
      set({ expandedPanelSize: DEFAULT_EXPANDED_SIZE });
    }
    if (vol !== undefined) set({ volume: vol });
    if (theme) set({ theme });
  },
}));