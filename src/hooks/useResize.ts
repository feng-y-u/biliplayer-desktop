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
  initialSize: WindowSize,
  onResizeEnd: (size: WindowSize) => void,
) {
  const resizeSession = useRef<ResizeSession | null>(null);
  const currentSizeRef = useRef(initialSize);
  const onResizeEndRef = useRef(onResizeEnd);
  onResizeEndRef.current = onResizeEnd;

  useEffect(() => {
    function onResizeMove(e: MouseEvent) {
      const session = resizeSession.current;
      if (!session) return;

      const dx = e.screenX - session.startScreenX;
      const dy = e.screenY - session.startScreenY;

      let newW = session.startW;
      let newH = session.startH;

      if (session.edge === 'e' || session.edge === 'se') {
        newW = Math.max(PANEL_MIN_WIDTH, session.startW + dx);
      }
      if (session.edge === 's' || session.edge === 'se') {
        newH = Math.max(PANEL_MIN_HEIGHT, session.startH + dy);
      }

      const newSize = { width: newW, height: newH };
      currentSizeRef.current = newSize;
      window.electronAPI.windowResize(newW, newH);
    }

    function onResizeUp() {
      if (!resizeSession.current) return;
      resizeSession.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      onResizeEndRef.current(currentSizeRef.current);
    }

    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeUp);
    return () => {
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('mouseup', onResizeUp);
    };
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent, edge: 'e' | 'se' | 's') => {
    e.stopPropagation();
    e.preventDefault();
    resizeSession.current = {
      startScreenX: e.screenX,
      startScreenY: e.screenY,
      startW: currentSizeRef.current.width,
      startH: currentSizeRef.current.height,
      edge,
    };
    document.body.style.userSelect = 'none';
  }, []);

  return { handleResizeStart };
}