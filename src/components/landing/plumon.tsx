import { type ReactNode } from "react";

import { cn } from "~/lib/utils";

import s from "./landing.module.css";

/**
 * Plumón — pincelazo de destacador detrás de una palabra (firma de «El Talonario»).
 *
 * Técnica BULLETPROOF (2026-07-18, tras 3 reincidencias del "trazo sobre el texto"): el trazo es
 * el `background-image` del PROPIO span de texto (`/plumon.svg`). En el modelo de caja de CSS, el
 * contenido de un elemento SIEMPRE se pinta encima de su propio background — no hay z-index,
 * stacking context ni CSS a medio recargar (HMR) que pueda invertir eso. Es imposible que el trazo
 * tape el texto. (Reemplaza al enfoque de capa absoluta + z-index, que sí podía romperse.)
 *
 * Trade-off aceptado: como background el color va horneado en el SVG (`#FFC530`) → misma excepción
 * de "hex en asset de marca" ya vigente para `favicon.svg`/`og.svg`. Sobre banda amarilla el trazo
 * pasa a blanco (`/plumon-blanco.svg`) vía `.bandaAmarilla .plumon` en el CSS module.
 */
export function Plumon({
  children,
  variante = "a",
}: {
  children: ReactNode;
  variante?: "a" | "b";
}) {
  return (
    <span className={cn(s.plumon, variante === "b" && s.plumonB)}>
      {children}
    </span>
  );
}
