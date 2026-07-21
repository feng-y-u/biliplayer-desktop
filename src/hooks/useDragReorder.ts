import { useRef, useCallback, useState } from 'react';

interface UseDragReorderOptions<T = void> {
  onReorder: (fromIndex: number, toIndex: number, context: T) => void;
}

export function useDragReorder<T = void>({ onReorder }: UseDragReorderOptions<T>) {
  const dragItem = useRef<{ index: number; context?: T } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number, context?: T) => {
    dragItem.current = { index, context };
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const item = dragItem.current;
    dragItem.current = null;
    setDragIndex(null);
    setOverIndex(null);
    if (item !== null && item.index !== toIndex) {
      onReorder(item.index, toIndex, item.context as T);
    }
  }, [onReorder]);

  const handleDragEnd = useCallback(() => {
    dragItem.current = null;
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  return {
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    dragIndex,
    overIndex,
  };
}
