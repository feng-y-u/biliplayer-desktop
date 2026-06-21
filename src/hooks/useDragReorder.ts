import { useRef, useCallback } from 'react';

interface UseDragReorderOptions<T = void> {
  onReorder: (fromIndex: number, toIndex: number, context: T) => void;
}

export function useDragReorder<T = void>({ onReorder }: UseDragReorderOptions<T>) {
  const dragItem = useRef<{ index: number; context?: T } | null>(null);

  const handleDragStart = useCallback((index: number, context?: T) => {
    dragItem.current = { index, context };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.style.borderTop = index > (dragItem.current?.index ?? -1) ? '2px solid var(--accent)' : '';
    el.style.borderBottom = index <= (dragItem.current?.index ?? -1) ? '2px solid var(--accent)' : '';
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
    const item = dragItem.current;
    dragItem.current = null;
    if (item !== null && item.index !== toIndex) {
      onReorder(item.index, toIndex, item.context as T);
    }
  }, [onReorder]);

  const handleDragEnd = useCallback(() => {
    dragItem.current = null;
  }, []);

  return {
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}
