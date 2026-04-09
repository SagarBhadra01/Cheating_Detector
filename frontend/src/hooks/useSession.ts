import { useEffect, useState } from 'react';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function useSession(startTime: string): string {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const origin = new Date(startTime).getTime();

    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - origin) / 1000));
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return elapsed;
}
