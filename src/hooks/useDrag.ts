// src/hooks/useDrag.ts
import { useEffect, useRef, useCallback } from 'react';

const DRAG_THRESHOLD = 5;

interface DragSession {
  startScreenX: number;
  startScreenY: number;
  startWinX: number;
  startWinY: number;
  dragging: boolean;
}

export function useDrag(
  onPositionChange: (pos: { left: number; top: number }) => void,
  enabled: (target: HTMLElement) => boolean = () => true,
) {
  const dragSession = useRef<DragSession | null>(null);
  const didDrag = useRef(false);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const drag = dragSession.current;
      if (!drag) return;
      const dx = e.screenX - drag.startScreenX;
      const dy = e.screenY - drag.startScreenY;
      if (!drag.dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
        drag.dragging = true;
        didDrag.current = true;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }
      window.electronAPI.windowMove(drag.startWinX + dx, drag.startWinY + dy);
    }

    function onMouseUp() {
      const drag = dragSession.current;
      if (!drag) return;
      dragSession.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (drag.dragging) {
        (async () => {
          const pos = await window.electronAPI.windowGetPosition();
          onPositionChange({ left: pos.x, top: pos.y });
        })();
      }
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onPositionChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled(e.target as HTMLElement)) return;
    dragSession.current = {
      startScreenX: e.screenX,
      startScreenY: e.screenY,
      startWinX: window.screenX,
      startWinY: window.screenY,
      dragging: false,
    };
    didDrag.current = false;
  }, [enabled]);

  return { handleMouseDown, didDrag };
}