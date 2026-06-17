import { useRef, useCallback } from 'react';

interface UseDragReorderOptions {
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function useDragReorder({ onReorder }: UseDragReorderOptions) {
  const dragIndex = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragIndex.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.style.borderTop = index > (dragIndex.current ?? -1) ? '2px solid var(--accent)' : '';
    el.style.borderBottom = index <= (dragIndex.current ?? -1) ? '2px solid var(--accent)' : '';
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.borderTop = '';
    el.style.borderBottom = '';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.style.borderTop = '';
    el.style.borderBottom = '';
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from !== null && from !== toIndex) {
      onReorder(from, toIndex);
    }
  }, [onReorder]);

  const handleDragEnd = useCallback(() => {
    dragIndex.current = null;
  }, []);

  return {
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}
