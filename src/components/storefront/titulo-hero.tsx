import { Fragment, type CSSProperties } from "react";

import { type HeroProps } from "~/lib/pagebuilder/widgets";

/**
 * Render del título del hero con `tituloAcento` + `efectoTitulo` (builder-tanda-1 F03/D5/D6). Devuelve
 * el CONTENIDO a colocar dentro de un `<Title>` (spans), NO el `<Title>` en sí ⇒ es testeable con
 * `renderToStaticMarkup` sin provider de Mantine.
 *
 * Reglas duras:
 * - **Jamás HTML del tenant** (I3/ADR-0018): `palabra` es texto plano; el match es por SUBSTRING/palabra
 *   y solo envuelve en `<span>` con estilo por TOKEN (cero hex, I-A). Sin match ⇒ título intacto.
 * - **SSR-visible** (I-D): el reveal por palabra es CSS puro (`.animar-revelar-palabra`, delay inline);
 *   el `opacity:0` vive en el keyframe gateado de globals.css, NUNCA inline ⇒ el HTML SSR sale visible.
 * - **reduced-motion** (I-B): las clases de animación están gateadas por la media query ⇒ estático.
 * - `resaltado` = destacador como background del PROPIO span (lección en memoria: nunca capa aparte).
 */

type EstiloAcento = NonNullable<HeroProps["tituloAcento"]>["estilo"];
type EfectoTitulo = HeroProps["efectoTitulo"];

/** CSS por estilo de acento. Cero hex: tokens de la escala acento con FALLBACK a marca (I-T2). */
function estiloAcentoCss(estilo: EstiloAcento): CSSProperties {
  switch (estilo) {
    case "acento":
      return { color: "var(--mantine-color-acento-filled, var(--mantine-primary-color-filled))" };
    case "marca":
      // Color del PRIMARIO del tenant (F13): la palabra clave en el color de marca (p.ej. marca dorada).
      return { color: "var(--mantine-primary-color-filled)" };
    case "resaltado":
      // Destacador como background-image del PROPIO span (banda inferior). `box-decoration-break: clone`
      // ⇒ el resaltado envuelve bien si la palabra parte en dos líneas. Nunca una capa aparte con z-index.
      return {
        backgroundImage:
          "linear-gradient(180deg, transparent 62%, var(--mantine-color-acento-2, var(--mantine-primary-color-2)) 62%)",
        paddingInline: "0.08em",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
      };
    case "gradiente":
      return {
        backgroundImage:
          "linear-gradient(90deg, var(--mantine-primary-color-filled), var(--mantine-color-acento-filled, var(--mantine-primary-color-6)))",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      };
  }
}

/** CSS del título completo con gradiente ANIMADO (efectoTitulo). El gradiente es VISIBLE con
 *  reduced-motion; solo la animación de posición la agrega la clase `animar-holo` (gateada). */
const GRADIENTE_ANIMADO_CSS: CSSProperties = {
  backgroundImage:
    "linear-gradient(90deg, var(--mantine-primary-color-filled), var(--mantine-color-acento-filled, var(--mantine-primary-color-6)), var(--mantine-primary-color-filled))",
  backgroundSize: "200% auto",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/**
 * Parte `titulo` por la PRIMERA ocurrencia case-insensitive de `palabra`. Devuelve `{antes, match,
 * despues}` (conservando el casing original del título) o `null` si no hay match. PURO.
 */
export function partirTituloAcento(
  titulo: string,
  palabra: string,
): { antes: string; match: string; despues: string } | null {
  if (!palabra) return null;
  const i = titulo.toLowerCase().indexOf(palabra.toLowerCase());
  if (i === -1) return null;
  return {
    antes: titulo.slice(0, i),
    match: titulo.slice(i, i + palabra.length),
    despues: titulo.slice(i + palabra.length),
  };
}

/** Parte el título conservando los espacios (tokens de whitespace intercalados). PURO. */
export function partirEnPalabras(titulo: string): string[] {
  return titulo.split(/(\s+)/).filter((t) => t.length > 0);
}

/** Normaliza una palabra para comparar (lowercase, sin puntuación) — match por palabra en el reveal. */
function normalizar(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

export function TituloHero({
  titulo,
  acento,
  efecto,
}: {
  titulo: string;
  acento?: HeroProps["tituloAcento"];
  efecto: EfectoTitulo;
}) {
  // Gradiente animado: todo el título como gradiente (el acento se subsume en el gradiente).
  if (efecto === "gradiente_animado") {
    return (
      <span className="animar-holo" style={GRADIENTE_ANIMADO_CSS}>
        {titulo}
      </span>
    );
  }

  // Reveal por palabra: cada palabra un span con delay escalonado; la palabra del acento lleva su estilo.
  if (efecto === "revelar_palabras") {
    const objetivo = acento ? normalizar(acento.palabra) : null;
    let iPalabra = 0;
    return (
      <>
        {partirEnPalabras(titulo).map((token, i) => {
          if (/^\s+$/.test(token)) return <Fragment key={i}>{token}</Fragment>;
          const delay = `${Math.min(iPalabra++, 12) * 0.07}s`;
          const esAcento = objetivo !== null && normalizar(token) === objetivo;
          return (
            <span
              key={i}
              className="animar-revelar-palabra"
              style={{ animationDelay: delay, ...(esAcento && acento ? estiloAcentoCss(acento.estilo) : {}) }}
            >
              {token}
            </span>
          );
        })}
      </>
    );
  }

  // Sin efecto: acento por SUBSTRING (primera ocurrencia). Sin match ⇒ título intacto.
  if (acento) {
    const p = partirTituloAcento(titulo, acento.palabra);
    if (p) {
      return (
        <>
          {p.antes}
          <span style={estiloAcentoCss(acento.estilo)}>{p.match}</span>
          {p.despues}
        </>
      );
    }
  }
  return <>{titulo}</>;
}
