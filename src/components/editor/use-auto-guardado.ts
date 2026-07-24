import { useEffect, useRef } from "react";

/**
 * Auto-guardado con debounce (builder-tanda-1 F10/D14). Reemplaza los botones "Guardar": cuando `valor`
 * cambia (tras el montaje), agenda `aplicar(valor)` con `delay` (~500ms). El valor INICIAL no se emite
 * (es lo que ya está en el borrador). El indicador Guardando…/Guardado lo da la mutación global del
 * editor; el lock optimista (`expectedVersion`, I10) sigue siendo la defensa ante conflictos.
 *
 * `serialize` decide cuándo "cambió" (por defecto `JSON.stringify`): así un cambio profundo del form
 * (props/estilo/tema anidados) dispara el guardado, y re-renders con el mismo contenido NO.
 */
export function useAutoGuardado<T>(
  valor: T,
  aplicar: (valor: T) => void,
  opts?: { delay?: number; serialize?: (valor: T) => string },
): void {
  const delay = opts?.delay ?? 500;
  const serial = (opts?.serialize ?? ((v: T) => JSON.stringify(v)))(valor);

  const montado = useRef(false);
  const valorRef = useRef(valor);
  valorRef.current = valor;
  const aplicarRef = useRef(aplicar);
  aplicarRef.current = aplicar;

  useEffect(() => {
    // No emitir el valor inicial (= lo que ya está en DB): solo los cambios posteriores.
    if (!montado.current) {
      montado.current = true;
      return;
    }
    const id = setTimeout(() => aplicarRef.current(valorRef.current), delay);
    return () => clearTimeout(id); // cambios seguidos reinician el debounce (solo el último persiste)
    // Depende del CONTENIDO serializado (no de la referencia) y del delay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serial, delay]);
}
