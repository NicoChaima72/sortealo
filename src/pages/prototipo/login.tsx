import Link from "next/link";

import {
  IconoGoogle,
  ProtoShell,
  Wordmark,
  estilos,
  fuentes,
} from "~/components/prototipo/proto";

/**
 * PROTOTIPO — login del panel (dirección "El Talonario"): la card es una
 * entrada de talonario, con talón perforado y número de serie. Estático: el
 * botón no dispara OAuth real.
 */
export default function PrototipoLogin() {
  return (
    <ProtoShell titulo="Entrar">
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className={estilos.impreso} style={{ width: "100%", maxWidth: 400, overflow: "hidden" }}>
          {/* cabecera de la entrada */}
          <div
            style={{
              padding: "12px 24px",
              borderBottom: "2px solid var(--tinta)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 12,
            }}
          >
            <span className={estilos.etiqueta}>Entrada</span>
            <span className={estilos.etiqueta} style={{ color: "var(--tinta)" }}>
              Panel del organizador
            </span>
          </div>

          <div style={{ padding: "34px 28px 28px", textAlign: "center" }}>
            <Wordmark tamano={28} />
            <h1
              className={fuentes.display.className}
              style={{ fontSize: 21, fontWeight: 800, margin: "22px 0 6px", letterSpacing: "-0.01em" }}
            >
              Hola de nuevo
            </h1>
            <p style={{ fontSize: 15, color: "var(--tinta-suave)", margin: "0 0 26px", lineHeight: 1.55 }}>
              Entra a tu tienda y mira cómo va tu sorteo.
            </p>

            <button
              type="button"
              className={estilos.btn}
              style={{ width: "100%" }}
              onClick={() => alert("Prototipo: acá dispara el OAuth de Google")}
            >
              <IconoGoogle tamano={20} />
              Continuar con Google
            </button>

            {/* estado de error (visible para evaluar la variante) */}
            <p
              role="alert"
              className={fuentes.mono.className}
              style={{
                marginTop: 18,
                marginBottom: 0,
                fontSize: 12.5,
                lineHeight: 1.5,
                color: "var(--rojo-sello)",
                background: "var(--rojo-fondo)",
                border: "1.5px solid var(--rojo-sello)",
                borderRadius: 6,
                padding: "8px 12px",
              }}
            >
              No pudimos iniciar tu sesión. Intenta de nuevo.
            </p>
          </div>

          {/* talón perforado */}
          <div
            style={{
              borderTop: "2px dashed var(--linea)",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span className={estilos.etiqueta}>Serie A</span>
            <span className={estilos.etiqueta} style={{ color: "var(--tinta)" }}>
              Nº 000312
            </span>
          </div>
        </div>

        <p className={estilos.etiqueta} style={{ marginTop: 26, textTransform: "none", letterSpacing: "0.02em" }}>
          ¿Todavía no tienes tienda?{" "}
          <Link href="/prototipo" style={{ color: "var(--tinta)", fontWeight: 600 }}>
            Crea la tuya gratis
          </Link>
        </p>
      </main>
    </ProtoShell>
  );
}
