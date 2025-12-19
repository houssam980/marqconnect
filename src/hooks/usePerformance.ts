import { useEffect, useRef } from 'react';

/**
 * Performance monitoring hook - tracks component render performance
 */
export function usePerformanceMonitor(componentName: string, enabled = process.env.NODE_ENV === 'development') {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;

    renderCount.current += 1;
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    lastRenderTime.current = currentTime;

    if (timeSinceLastRender > 16.67) { // More than 60fps threshold
      console.warn(
        `[Performance] ${componentName} render took ${timeSinceLastRender.toFixed(2)}ms (${renderCount.current} renders)`
      );
    }
  });
}

/**
 * Debounce hook for expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
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
 * Throttle callback for high-frequency events (scroll, resize, etc.)
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useRef((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      lastRun.current = now;
      callback(...args);
    }
  }).current as T;
}

/**
 * Measure and log component mount/unmount time
 */
export function useComponentLifecycle(componentName: string) {
  useEffect(() => {
    const mountTime = performance.now();
    console.log(`[Lifecycle] ${componentName} mounted at ${mountTime.toFixed(2)}ms`);

    return () => {
      const unmountTime = performance.now();
      const lifetime = unmountTime - mountTime;
      console.log(`[Lifecycle] ${componentName} unmounted after ${lifetime.toFixed(2)}ms`);
    };
  }, [componentName]);
}

// Fix: Import React for useState
import React from 'react';


