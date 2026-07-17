import { useEffect, useState } from "react";

/**
 * Cuenta regresiva al cierre del sorteo (plantilla-rica F04/D9). El chip del header y la vitrina
 * del sorteo muestran cuánto falta para `Raffle.fechaFin`. El núcleo (`tiempoRestante`) es PURO y
 * testeable (sin React ni timers); el hook (`useCountdown`) lo envuelve con un tick por segundo.
 */

export interface TiempoRestante {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  /** `true` cuando la fecha ya pasó (o falta ≤ 0): el countdown se apaga. */
  terminado: boolean;
}

const MS_SEGUNDO = 1000;
const MS_MINUTO = 60 * MS_SEGUNDO;
const MS_HORA = 60 * MS_MINUTO;
const MS_DIA = 24 * MS_HORA;

/**
 * Descompone el tiempo entre `ahora` y `fechaFin` en días/horas/minutos/segundos. Fecha pasada (o
 * `fechaFin` inválida) ⇒ todo 0 + `terminado: true`. Puro y determinista (ambos argumentos
 * inyectados): el test lo ejerce sin timers.
 */
export function tiempoRestante(fechaFin: Date, ahora: Date): TiempoRestante {
  const restanteMs = fechaFin.getTime() - ahora.getTime();
  if (!Number.isFinite(restanteMs) || restanteMs <= 0) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, terminado: true };
  }
  return {
    dias: Math.floor(restanteMs / MS_DIA),
    horas: Math.floor((restanteMs % MS_DIA) / MS_HORA),
    minutos: Math.floor((restanteMs % MS_HORA) / MS_MINUTO),
    segundos: Math.floor((restanteMs % MS_MINUTO) / MS_SEGUNDO),
    terminado: false,
  };
}

/** Formato compacto del countdown para el chip del header (ej. "3d 04h", "12h 30m", "45m 10s"). */
export function formatoCompacto(t: TiempoRestante): string {
  if (t.terminado) return "Cerrado";
  const dos = (n: number) => n.toString().padStart(2, "0");
  if (t.dias > 0) return `${t.dias}d ${dos(t.horas)}h`;
  if (t.horas > 0) return `${t.horas}h ${dos(t.minutos)}m`;
  return `${t.minutos}m ${dos(t.segundos)}s`;
}

/**
 * Hook: recalcula el tiempo restante a `fechaFin` cada segundo. Arranca desde `new Date()` en el
 * cliente; en SSR/primer render usa la misma base para no divergir (el valor exacto se corrige al
 * montar). `fechaFin` llega vía superjson como `Date`.
 */
export function useCountdown(fechaFin: Date): TiempoRestante {
  const [ahora, setAhora] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), MS_SEGUNDO);
    return () => clearInterval(id);
  }, []);

  return tiempoRestante(fechaFin, ahora);
}
