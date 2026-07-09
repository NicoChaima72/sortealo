import { useEffect, useState } from "react";

export interface Countdown {
  dias: number;
  horas: number;
  min: number;
  seg: number;
  vencido: boolean;
}

const two = (n: number): string => n.toString().padStart(2, "0");

/**
 * Countdown hidratación-safe: devuelve `null` en el server y en el primer render
 * del cliente (evita mismatch), y empieza a tictaquear tras montar.
 */
export function useCountdown(targetIso: string): Countdown | null {
  const [cd, setCd] = useState<Countdown | null>(null);

  useEffect(() => {
    const target = new Date(targetIso).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCd({ dias: 0, horas: 0, min: 0, seg: 0, vencido: true });
        return;
      }
      const totalSeg = Math.floor(diff / 1000);
      setCd({
        dias: Math.floor(totalSeg / 86400),
        horas: Math.floor((totalSeg % 86400) / 3600),
        min: Math.floor((totalSeg % 3600) / 60),
        seg: totalSeg % 60,
        vencido: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return cd;
}

/** "12d 04h 33m" — compacto, para chips. Muestra "—" mientras no montó. */
export function formatCompact(cd: Countdown | null): string {
  if (!cd) return "—";
  return `${cd.dias}d ${two(cd.horas)}h ${two(cd.min)}m`;
}

export { two };
