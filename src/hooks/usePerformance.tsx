// Performance utilities for React components
import { useRef, useEffect, DependencyList } from 'react';

/**
 * Debounce hook - delays execution until after user stops typing/acting
 * Useful for search inputs, resize handlers, etc.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook - limits how often a function can run
 * Useful for scroll handlers, mousemove, etc.
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now());

  return useRef(((...args) => {
    if (Date.now() - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = Date.now();
    }
  }) as T).current;
}

/**
 * Prevents unnecessary re-renders by deep comparing dependencies
 */
export function useDeepEffect(effect: () => void | (() => void), deps: DependencyList) {
  const ref = useRef<DependencyList>(deps);
  const signalRef = useRef(0);

  if (!arraysEqual(deps, ref.current)) {
    ref.current = deps;
    signalRef.current += 1;
  }

  useEffect(effect, [signalRef.current]);
}

function arraysEqual(a: DependencyList, b: DependencyList): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}

/**
 * Lazy load images to improve initial page load
 */
export function useLazyImage(src: string): string | undefined {
  const [imageSrc, setImageSrc] = useState<string>();

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setImageSrc(src);
  }, [src]);

  return imageSrc;
}

/**
 * Track component re-renders (dev only)
 */
export function useRenderCount(componentName: string) {
  const renders = useRef(0);
  
  useEffect(() => {
    renders.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renders.current} times`);
    }
  });
}

/**
 * Batch state updates to reduce re-renders
 */
export function useBatchedState<T>(initialState: T): [T, (updater: (prev: T) => T) => void] {
  const [state, setState] = useState(initialState);
  const pendingUpdates = useRef<Array<(prev: T) => T>>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchedSetState = useCallback((updater: (prev: T) => T) => {
    pendingUpdates.current.push(updater);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prev => {
        let newState = prev;
        pendingUpdates.current.forEach(update => {
          newState = update(newState);
        });
        pendingUpdates.current = [];
        return newState;
      });
    }, 16); // Batch updates in next frame (16ms = ~60fps)
  }, []);

  return [state, batchedSetState];
}

import { useState, useCallback } from 'react';
