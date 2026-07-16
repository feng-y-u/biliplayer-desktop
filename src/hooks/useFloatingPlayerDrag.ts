// src/hooks/useFloatingPlayerDrag.ts
import { useCallback } from 'react';
import { useDrag } from './useDrag';

export function useFloatingPlayerDrag(
  isExpanded: boolean,
  onPositionChange: (pos: { left: number; top: number }) => void,
) {
  const enabled = useCallback((target: HTMLElement) => {
    if (isExpanded) {
      if (!target.closest('.ep-top-bar')) return false;
      if (target.closest('[data-no-drag]')) return false;
    }
    return true;
  }, [isExpanded]);

  const { handleMouseDown, didDrag } = useDrag(onPositionChange, enabled);

  return { handleMouseDown, wasDragging: didDrag };
}
