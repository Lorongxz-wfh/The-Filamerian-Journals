import { useEffect, useRef } from 'react';

/**
 * Custom hook for smart interval polling with Tab Visibility guard and optional Modal active guard.
 * @param callback Function to execute on poll
 * @param intervalMs Polling interval in milliseconds
 * @param isPaused Optional boolean to temporarily pause polling (e.g., when modal form is open)
 */
export function useSmartPolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  isPaused: boolean = false
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (isPaused || intervalMs <= 0) return;

    const tick = () => {
      // Only execute if browser tab is active
      if (!document.hidden && savedCallback.current) {
        savedCallback.current();
      }
    };

    const id = setInterval(tick, intervalMs);

    // Also trigger immediately when user switches back to active tab
    const handleVisibilityChange = () => {
      if (!document.hidden && !isPaused && savedCallback.current) {
        savedCallback.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, isPaused]);
}
