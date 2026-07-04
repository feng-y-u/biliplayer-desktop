// src/hooks/useLerpAnimation.ts
import { useState, useRef, useCallback, useEffect } from 'react';

type AnimationState = 'expand' | 'collapse' | null;

interface Size {
  width: number;
  height: number;
}

const SPRING_DURATION = 200;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface UseLerpAnimationOptions {
  onFrame: (w: number, h: number) => void;
  onCollapseEnd?: () => void;
  duration?: number;
}

export function useLerpAnimation(options: UseLerpAnimationOptions) {
  const { onFrame, onCollapseEnd, duration = SPRING_DURATION } = options;
  const [animating, setAnimating] = useState<AnimationState>(null);
  const animStartRef = useRef({ w: 0, h: 0 });
  const animTargetRef = useRef({ w: 0, h: 0 });
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);

  // 清理 RAF
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const startAnimation = useCallback((type: 'expand' | 'collapse', from: Size, to: Size) => {
    cancelAnimationFrame(rafRef.current);
    animStartRef.current = { w: from.width, h: from.height };
    animTargetRef.current = { w: to.width, h: to.height };
    setAnimating(type);
    startTimeRef.current = performance.now();

    const tick = (timestamp: number) => {
      const elapsed = timestamp - startTimeRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = type === 'collapse' ? 1 - Math.pow(1 - t, 3) : t;
      const w = Math.round(lerp(animStartRef.current.w, animTargetRef.current.w, eased));
      const h = Math.round(lerp(animStartRef.current.h, animTargetRef.current.h, eased));
      onFrame(w, h);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        if (type === 'collapse') onCollapseEnd?.();
        setAnimating(null);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [onFrame, onCollapseEnd, duration]);

  const stopAnimation = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setAnimating(null);
  }, []);

  return { animating, startAnimation, stopAnimation };
}