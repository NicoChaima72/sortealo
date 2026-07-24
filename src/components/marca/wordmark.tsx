import { Text } from "@mantine/core";
import { type CSSProperties } from "react";

import { Plumon } from "~/components/landing/plumon";
import { APP_CONFIG } from "~/config/app";

/**
 * Wordmark de plataforma (identidad «El Talonario»). Firma SOLO tipográfica: el nombre en
 * Bricolage Grotesque (`var(--font-display)`, peso 800) con el **«éa» resaltado en plumón**
 * (componente `Plumon`: trazo como `background-image` del propio texto → texto SIEMPRE encima por
 * modelo de caja, imposible de romper por CSS stale — patrón bulletproof 2026-07-18).
 *
 * `invertido` (para fondos azul/oscuros): el nombre COMPLETO va sobre un pincelazo BLANCO en
 * diagonal, también como `background-image` del propio Text (misma técnica bulletproof, no una
 * capa aparte) — el "lockup negativo" de la marca. Decisión del usuario 2026-07-18.
 *
 * El nombre SIEMPRE sale de `APP_CONFIG.name` (I8) — nunca literal; el resaltado parte el
 * nombre por «éa» y degrada limpio si ese trozo no está.
 */
interface WordmarkProps {
  /** Tamaño de fuente del nombre en px. */
  size?: number;
  /** Fondo azul/oscuro: pincelazo blanco diagonal detrás del nombre completo, texto en tinta. */
  invertido?: boolean;
  /**
   * Muestra el isotipo = EL MISMO `/favicon.svg` (S blanca sobre cobalto + subrayado amarillo),
   * decisión del usuario 2026-07-18 — un solo asset para pestaña y UI, sincronizados por
   * construcción. Off por defecto; el navbar de la landing lo activa.
   */
  withIcon?: boolean;
  /** Color del texto (token del theme). Ignorado en `invertido`. */
  c?: string;
}

/** Parte el nombre por «éa» para resaltar ese trozo con plumón; si no está, deja el nombre plano. */
function nombreConPlumon() {
  const partes = APP_CONFIG.name.split("éa");
  if (partes.length !== 2) return APP_CONFIG.name;
  return (
    <>
      {partes[0]}
      <Plumon>éa</Plumon>
      {partes[1]}
    </>
  );
}

/** Pincelazo blanco diagonal como background del PROPIO texto (bulletproof, no capa aparte).
 * `inline-block` + `width: fit-content` + `alignSelf: flex-start`: si no, un contenedor flex
 * padre (p. ej. el login) estira el elemento a todo el ancho y el trazo se estira con él. */
const BRUSH_INVERTIDO: CSSProperties = {
  display: "inline-block",
  width: "fit-content",
  alignSelf: "flex-start",
  backgroundImage: "url('/plumon-blanco.svg')",
  backgroundSize: "100% 1.5em",
  backgroundPosition: "center 54%",
  backgroundRepeat: "no-repeat",
  padding: "0.05em 0.55em",
};

export function Wordmark({
  size = 20,
  invertido = false,
  withIcon = false,
  c,
}: WordmarkProps) {
  const marca = (
    <Text
      component="span"
      fw={800}
      c={invertido ? "black" : c}
      style={{
        fontFamily: "var(--font-display)",
        fontSize: size,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...(invertido ? BRUSH_INVERTIDO : {}),
      }}
    >
      {nombreConPlumon()}
    </Text>
  );

  if (!withIcon) return marca;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(size * 0.42),
        width: "fit-content",
      }}
    >
      <img
        src="/favicon.svg"
        alt=""
        aria-hidden
        width={Math.round(size * 1.55)}
        height={Math.round(size * 1.55)}
        style={{ display: "block", flex: "none" }}
      />
      {marca}
    </span>
  );
}
