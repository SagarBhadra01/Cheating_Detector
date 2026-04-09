import { useEffect, useState, useRef } from 'react';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * Session timer hook.
 * - Starts counting when `isActive` becomes true
 * - Resets to 00:00:00 when `isActive` becomes false
 * - Returns formatted elapsed time string
 */
export function useSession(isActive: boolean): string {
  const [elapsed, setElapsed] = useState('00:00:00');
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setElapsed('00:00:00');
      startRef.current = null;
      return;
    }

    // Mark start time
    startRef.current = Date.now();

    const tick = () => {
      if (!startRef.current) return;
      const diff = Math.max(0, Math.floor((Date.now() - startRef.current) / 1000));
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isActive]);

  return elapsed;
}
