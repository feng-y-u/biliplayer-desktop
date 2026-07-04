// src/hooks/useResize.ts
import { useEffect, useRef, useCallback } from 'react';
import type { WindowSize } from '@/types';

const PANEL_MIN_WIDTH = 320;
const PANEL_MIN_HEIGHT = 480;

interface ResizeSession {
  startScreenX: number;
  startScreenY: number;
  startW: number;
  startH: number;
  edge: 'e' | 'se' | 's';
}

export function useResize(
  windowSize: WindowSize,
  onResize: (size: WindowSize) => void,
  onSizeRef?: (size: WindowSize) => void,
) {
  const resizeSession = useRef<ResizeSession | null>(null);

  useEffect(() => {
    function onResizeMove(e: MouseEvent) {
      const resize = resizeSession.current;
      if (!resize) return;
      const dx = e.screenX - resize.startScreenX;
      const dy = e.screenY - resize.startScreenY;
      let newW = resize.startW;
      let newH = resize.startH;
      if (resize.edge === 'e' || resize.edge === 'se') {
        newW = Math.max(PANEL_MIN_WIDTH, resize.startW + dx);
      }
      if (resize.edge === 's' || resize.edge === 'se') {
        newH = Math.max(PANEL_MIN_HEIGHT, resize.startH + dy);
      }
      const newSize = { width: newW, height: newH };
      onSizeRef?.(newSize);
      window.electronAPI.windowResize(newW, newH);
      onResize(newSize);
    }

    function onResizeUp() {
      if (!resizeSession.current) return;
      resizeSession.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeUp);
    return () => {
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('mouseup', onResizeUp);
    };
  }, [onResize, onSizeRef]);

  const handleResizeStart = useCallback((e: React.MouseEvent, edge: 'e' | 'se' | 's') => {
    e.stopPropagation();
    e.preventDefault();
    resizeSession.current = {
      startScreenX: e.screenX,
      startScreenY: e.screenY,
      startW: windowSize.width,
      startH: windowSize.height,
      edge,
    };
    document.body.style.userSelect = 'none';
  }, [windowSize]);

  return { handleResizeStart };
}