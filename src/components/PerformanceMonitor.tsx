import { useEffect, useState } from 'react';
import { getCurrentFPS } from '@/lib/performance';

/**
 * FPS Monitor Component - Shows current FPS in development
 * Only visible in dev mode for performance monitoring
 */
export function PerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const interval = setInterval(() => {
      setFps(getCurrentFPS());
    }, 1000);

    // Toggle with Ctrl+Shift+P
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setShow(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (!show || process.env.NODE_ENV !== 'development') return null;

  const fpsColor = fps >= 60 ? 'bg-green-500' : fps >= 30 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="fixed bottom-4 right-4 z-[99999] pointer-events-none">
      <div className={`${fpsColor} text-white px-3 py-2 rounded-lg shadow-lg font-mono text-sm backdrop-blur-sm bg-opacity-90`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="font-bold">{fps} FPS</span>
        </div>
        <div className="text-xs opacity-75 mt-1">
          Target: 60+ FPS
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-2 text-center opacity-50">
        Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}


