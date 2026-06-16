import type { PlayMode } from '@/types';

export const MODE_ORDER: PlayMode[] = ['loop', 'single', 'shuffle'];

export function nextMode(current: PlayMode): PlayMode {
  const idx = MODE_ORDER.indexOf(current);
  return MODE_ORDER[(idx + 1) % MODE_ORDER.length] || 'loop';
}

export function modeTitle(mode: PlayMode): string {
  return mode === 'shuffle' ? '随机播放' : mode === 'single' ? '单曲循环' : '列表循环';
}

export function ModeIcon({ mode }: { mode: PlayMode }) {
  if (mode === 'shuffle') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8" />
        <line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" />
        <line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
      </svg>
    );
  }
  if (mode === 'single') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        <text x="12" y="14.5" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">1</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
