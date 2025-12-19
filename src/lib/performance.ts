/**
 * Performance utilities for optimizing React app
 */

// Measure FPS
let lastTime = performance.now();
let frames = 0;
let fps = 60;

export function measureFPS() {
  frames++;
  const currentTime = performance.now();
  
  if (currentTime >= lastTime + 1000) {
    fps = Math.round((frames * 1000) / (currentTime - lastTime));
    frames = 0;
    lastTime = currentTime;
  }
  
  requestAnimationFrame(measureFPS);
  return fps;
}

export function getCurrentFPS(): number {
  return fps;
}

// Start measuring on load
if (typeof window !== 'undefined') {
  requestAnimationFrame(measureFPS);
}

/**
 * Optimize images for better performance
 */
export function optimizeImage(url: string, width?: number): string {
  // Add image optimization params if using a CDN
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  params.set('q', '85'); // Quality
  params.set('fm', 'webp'); // Format
  
  return url; // Return as-is for now, can be extended with CDN
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources(urls: string[]) {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Request idle callback wrapper with fallback
 */
export const requestIdleCallback =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback
    : (cb: IdleRequestCallback) => setTimeout(cb, 1);

/**
 * Cancel idle callback wrapper with fallback
 */
export const cancelIdleCallback =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback
    : clearTimeout;

/**
 * Batch DOM updates for better performance
 */
export function batchUpdates<T>(updates: Array<() => void>): void {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Memoization helper for expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}


