import { useReducedMotion } from "@mantine/hooks";
import {
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  Instrument_Sans,
} from "next/font/google";
import Head from "next/head";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import estilos from "./proto.module.css";

/**
 * PROTOTIPO de identidad de plataforma — dirección "El Talonario" (sesión
 * frontend-design 2026-07-17). Sandbox visual bajo /prototipo: acá se usa HTML
 * plano + CSS module A PROPÓSITO (excepción a "siempre Mantine") para iterar la
 * dirección de arte sin pelear con el theme base ni tocarlo. Si la dirección se
 * aprueba, la paleta/tipografía se vuelca a `src/styles/theme.ts` + design.md y
 * las pantallas reales se reconstruyen con Mantine sobre ese theme.
 */

const display = Bricolage_Grotesque({ subsets: ["latin"] });
const texto = Instrument_Sans({ subsets: ["latin"] });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const fuentes = { display, texto, mono };

/** Envoltorio de página del prototipo: papel, tinta y las tres fuentes. */
export function ProtoShell({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <>
      <Head>
        <title>{`${titulo} · Prototipo Sortéatelo`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div
        className={`${estilos.root} ${texto.className}`}
        style={
          {
            "--fuente-display": display.style.fontFamily,
            "--fuente-texto": texto.style.fontFamily,
            "--fuente-mono": mono.style.fontFamily,
            fontFamily: texto.style.fontFamily,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </>
  );
}

/** Wordmark de la plataforma: tipografía display + "éa" resaltado con marcador. */
export function Wordmark({ tamano = 22 }: { tamano?: number }) {
  return (
    <span
      className={display.className}
      style={{
        fontSize: tamano,
        fontWeight: 800,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      Sort<span className={estilos.marcador}>éa</span>telo
    </span>
  );
}

/** Ícono de Google para el botón de OAuth (colores oficiales, sin librería extra). */
export function IconoGoogle({ tamano = 18 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

interface Celda {
  numero: string;
  iniciales?: string;
}

/** 24 números del talonario de ejemplo: vendidos con iniciales, libres sin nada. */
const CELDAS: Celda[] = [
  { numero: "301", iniciales: "M.P." },
  { numero: "302", iniciales: "CATA" },
  { numero: "303" },
  { numero: "304", iniciales: "J.R." },
  { numero: "305", iniciales: "FRAN" },
  { numero: "306" },
  { numero: "307", iniciales: "V.S." },
  { numero: "308", iniciales: "NIKO" },
  { numero: "309", iniciales: "PAU" },
  { numero: "310" },
  { numero: "311", iniciales: "R.M." },
  { numero: "312" }, // ← TÚ
  { numero: "313", iniciales: "DANI" },
  { numero: "314" },
  { numero: "315", iniciales: "T.A." },
  { numero: "316", iniciales: "SOFI" },
  { numero: "317" },
  { numero: "318", iniciales: "L.C." },
  { numero: "319", iniciales: "MAXI" },
  { numero: "320" },
];

const INDICE_TUYO = 11;
const INDICES_VENDIDOS = CELDAS.map((c, i) => (c.iniciales ? i : -1)).filter(
  (i) => i >= 0,
);

/**
 * El talonario vivo — firma del hero. Cada ~3s "sale" un número vendido con un
 * sello ¡SALE! (se apaga con prefers-reduced-motion: queda uno fijo).
 */
export function TalonarioVivo() {
  const sinMovimiento = useReducedMotion();
  const [ganador, setGanador] = useState(INDICES_VENDIDOS[4] ?? 0);

  useEffect(() => {
    if (sinMovimiento) return;
    const id = setInterval(() => {
      setGanador((prev) => {
        const pos = INDICES_VENDIDOS.indexOf(prev);
        return INDICES_VENDIDOS[(pos + 1) % INDICES_VENDIDOS.length] ?? prev;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [sinMovimiento]);

  return (
    <div className={estilos.talonario} aria-label="Ejemplo de talonario de sorteo">
      <div className={estilos.talonarioCabecera}>
        <span className={estilos.etiqueta}>Sorteo · Tienda de Luna</span>
        <span className={estilos.etiqueta} style={{ color: "var(--tinta)" }}>
          Serie A
        </span>
      </div>
      <div className={estilos.talonarioGrilla}>
        {CELDAS.map((celda, i) => {
          if (i === INDICE_TUYO) {
            return (
              <div key={celda.numero} className={estilos.numeroTuyo}>
                <span>Nº {celda.numero}</span>
                <small>TÚ</small>
              </div>
            );
          }
          if (celda.iniciales) {
            return (
              <div
                key={celda.numero}
                className={`${estilos.numeroVendido} ${i === ganador ? estilos.numeroGanador : ""}`}
              >
                <span>Nº {celda.numero}</span>
                <small>{celda.iniciales}</small>
              </div>
            );
          }
          return (
            <div key={celda.numero} className={estilos.numeroLibre}>
              <span>Nº {celda.numero}</span>
            </div>
          );
        })}
      </div>
      <div className={estilos.talonarioPie}>
        <span className={estilos.etiqueta}>312 números vendidos</span>
        <span className={estilos.etiqueta} style={{ color: "var(--tinta)" }}>
          Cierra en 3 días
        </span>
      </div>
    </div>
  );
}

export { estilos };
