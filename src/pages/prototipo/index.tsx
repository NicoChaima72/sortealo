import {
  IconBuildingBank,
  IconFileCertificate,
  IconLockSquareRounded,
} from "@tabler/icons-react";
import Link from "next/link";

import {
  IconoGoogle,
  ProtoShell,
  TalonarioVivo,
  Wordmark,
  estilos,
  fuentes,
} from "~/components/prototipo/proto";

/**
 * PROTOTIPO — landing de la plataforma (dirección "El Talonario").
 * Página estática sin datos: solo dirección de arte + copy. Ver docblock en
 * `~/components/prototipo/proto.tsx`.
 */

const PASOS = [
  {
    numero: "01",
    titulo: "Sube tus PDFs",
    texto: "Tu novela, tu fanzine, tus guías. Les pones precio y quedan a la venta.",
  },
  {
    numero: "02",
    titulo: "Conecta tu Flow",
    texto: "Cobras con tu propia cuenta. Cada peso llega directo a ti.",
  },
  {
    numero: "03",
    titulo: "Comparte tu tienda",
    texto: "Tu propio enlace, listo para la bio y para mostrarlo en el live.",
  },
  {
    numero: "04",
    titulo: "Sortea en vivo",
    texto: "Cada compra da un número. El ganador sale frente a todos.",
  },
];

const CONFIANZA = [
  {
    icono: IconBuildingBank,
    titulo: "Tu plata nunca pasa por nosotros",
    texto:
      "Cobras con tu propia cuenta de Flow (Webpay, tarjetas). Sortéatelo no toca ni retiene tu plata.",
  },
  {
    icono: IconFileCertificate,
    titulo: "Cada número queda registrado al tiro",
    texto:
      "Apenas se confirma el pago, quien compró ve su número en pantalla y en su correo. Nada de «después te lo mando».",
  },
  {
    icono: IconLockSquareRounded,
    titulo: "Tus PDFs, solo para quien compró",
    texto:
      "Cada compra genera un enlace privado que expira. Tu trabajo no termina circulando gratis por ahí.",
  },
];

const FAQ = [
  {
    pregunta: "¿Necesito iniciar actividades en el SII o dar boleta?",
    respuesta:
      "Vender por internet en Chile tiene obligaciones tributarias que dependen de tu situación (inicio de actividades, boleta, IVA). Eso corre por tu cuenta como organizador — te dejamos una guía para partir, pero para tu caso puntual conviene asesorarse.",
  },
  {
    pregunta: "¿Cómo se elige al ganador del sorteo?",
    respuesta:
      "Cada compra pagada recibe números correlativos. Cuando cierras el sorteo, la plataforma sortea entre esos números y te muestra el resultado para que lo anuncies en tu live, frente a tu comunidad.",
  },
  {
    pregunta: "¿Qué pasa si un pago falla o queda a medias?",
    respuesta:
      "Solo las compras confirmadas por Flow participan del sorteo y pueden descargar el PDF. Si un pago queda pendiente o falla, queda marcado tal cual en tu panel — sin números fantasma.",
  },
  {
    pregunta: "¿Cuánto cuesta?",
    respuesta:
      "Crear tu tienda es gratis. El detalle de precios está en definición para el lanzamiento — sin comisiones escondidas sobre tus ventas: tú cobras con tu Flow y sabes exactamente qué paga cada compra.",
  },
];

export default function PrototipoLanding() {
  return (
    <ProtoShell titulo="Landing">
      {/* header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 lg:px-8">
        <Wordmark tamano={24} />
        <Link href="/prototipo/login" className={estilos.btn} style={{ padding: "9px 18px", fontSize: 15 }}>
          Crea tu tienda gratis
        </Link>
      </header>

      <hr className={estilos.perforacion} />

      {/* hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 lg:grid-cols-[7fr_5fr] lg:gap-16 lg:px-8 lg:py-20">
        <div>
          <p className={estilos.etiqueta}>Para creadores que hacen lives · Chile</p>
          <h1
            className={fuentes.display.className}
            style={{
              fontSize: "clamp(38px, 5.5vw, 60px)",
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
              margin: "18px 0 20px",
              textWrap: "balance",
            }}
          >
            Vende lo que hiciste.{" "}
            <span className={estilos.marcador}>Sortea</span> entre quienes te
            compraron.
          </h1>
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.55,
              color: "var(--tinta-suave)",
              maxWidth: "30em",
              margin: 0,
            }}
          >
            Sortéatelo es tu tienda para vender tus PDFs y hacer sorteos en
            vivo — sin saber de páginas web, cobrando con tu propia cuenta de
            Flow.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/prototipo/login" className={estilos.btn}>
              Crea tu tienda gratis
            </Link>
            <Link href="/prototipo/login" className={estilos.btnSecundario}>
              <IconoGoogle />
              Continuar con Google
            </Link>
          </div>
          <p className={estilos.etiqueta} style={{ marginTop: 18 }}>
            Gratis para partir · Sin tarjeta
          </p>
        </div>

        <TalonarioVivo />
      </section>

      <hr className={estilos.perforacion} />

      {/* cómo funciona — secuencia real, números estampados */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <p className={estilos.etiqueta}>Cómo funciona</p>
        <h2
          className={fuentes.display.className}
          style={{
            fontSize: "clamp(28px, 3.4vw, 40px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: "12px 0 36px",
            maxWidth: "22em",
            textWrap: "balance",
          }}
        >
          De cero a tu primer sorteo, sin planillas ni cuadernos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((paso) => (
            <div key={paso.numero} className={estilos.impresoSuave} style={{ padding: "22px 20px" }}>
              <span
                className={fuentes.mono.className}
                style={{
                  fontSize: 30,
                  fontWeight: 600,
                  color: "var(--tinta-tenue)",
                  letterSpacing: "-0.02em",
                }}
              >
                {paso.numero}
              </span>
              <h3 style={{ fontSize: 17.5, fontWeight: 600, margin: "12px 0 6px" }}>
                {paso.titulo}
              </h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--tinta-suave)", margin: 0 }}>
                {paso.texto}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className={estilos.perforacion} />

      {/* confianza — el diferenciador anti-«rifa trucha» */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <p className={estilos.etiqueta}>Sin letra chica</p>
        <h2
          className={fuentes.display.className}
          style={{
            fontSize: "clamp(28px, 3.4vw, 40px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: "12px 0 10px",
            maxWidth: "22em",
            textWrap: "balance",
          }}
        >
          Tu comunidad confía en ti. Acá se nota.
        </h2>
        <p style={{ fontSize: 17, color: "var(--tinta-suave)", maxWidth: "38em", margin: "0 0 36px", lineHeight: 1.6 }}>
          Las rifas truchas se delatan solas: números que nunca llegan, plata a
          cuentas personales, sorteos a puertas cerradas. Sortéatelo hace
          visible lo contrario.
        </p>
        <div className="grid gap-4 lg:grid-cols-3">
          {CONFIANZA.map((item) => {
            const Icono = item.icono;
            return (
              <div key={item.titulo} className={estilos.impreso} style={{ padding: "26px 24px" }}>
                <Icono className="size-8" stroke={1.5} color="var(--teal)" />
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: "14px 0 8px", lineHeight: 1.3 }}>
                  {item.titulo}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--tinta-suave)", margin: 0 }}>
                  {item.texto}
                </p>
              </div>
            );
          })}
        </div>

        {/* testimonio piloto — honesto: pendiente de autorización */}
        <figure
          className={estilos.impresoSuave}
          style={{ marginTop: 20, padding: "22px 26px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "baseline" }}
        >
          <blockquote style={{ margin: 0, fontSize: 16.5, fontWeight: 500, lineHeight: 1.55, flex: "1 1 24em" }}>
            «Antes anotaba los números en un cuaderno y rezaba para no
            equivocarme. Ahora cada compra queda con su número al tiro, y mi
            comunidad lo ve.»
          </blockquote>
          <figcaption className={estilos.etiqueta}>
            Organizadora del piloto · nombre y foto pendientes de autorización
          </figcaption>
        </figure>
      </section>

      <hr className={estilos.perforacion} />

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <p className={estilos.etiqueta}>Preguntas frecuentes</p>
        <h2
          className={fuentes.display.className}
          style={{
            fontSize: "clamp(28px, 3.4vw, 40px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: "12px 0 30px",
          }}
        >
          Lo que preguntaría tu yo de hace cinco minutos
        </h2>
        <div className="grid max-w-3xl gap-3">
          {FAQ.map((item) => (
            <details key={item.pregunta} className={estilos.faqItem}>
              <summary>{item.pregunta}</summary>
              <p>{item.respuesta}</p>
            </details>
          ))}
        </div>
      </section>

      <hr className={estilos.perforacion} />

      {/* CTA final: el boleto con talón desprendible */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <div className={estilos.boleto}>
          <div style={{ padding: "34px 34px 30px" }}>
            <p className={estilos.etiqueta}>Admite a 1 (una) tienda nueva</p>
            <h2
              className={fuentes.display.className}
              style={{
                fontSize: "clamp(26px, 3.2vw, 38px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                margin: "10px 0 8px",
                textWrap: "balance",
              }}
            >
              Tu próximo sorteo puede ser el más ordenado de tu vida
            </h2>
            <p style={{ fontSize: 16.5, color: "var(--tinta-suave)", margin: 0, maxWidth: "34em", lineHeight: 1.6 }}>
              Crea tu tienda hoy, sube tu primer PDF y deja que los números se
              repartan solos.
            </p>
          </div>
          <div className={estilos.boletoTalon}>
            <span className={fuentes.mono.className} style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em" }}>
              Nº 000001
            </span>
            <Link
              href="/prototipo/login"
              className={estilos.btn}
              style={{ background: "var(--papel-card)", boxShadow: "3px 3px 0 var(--tinta)" }}
            >
              Crea tu tienda gratis
            </Link>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer style={{ borderTop: "2px dashed var(--linea)" }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 lg:px-8">
          <Wordmark tamano={17} />
          <p className={estilos.etiqueta} style={{ margin: 0, textTransform: "none", letterSpacing: "0.02em" }}>
            © 2026 · sorteatelo.cl · Cada tienda es operada de forma
            independiente por su organizador.
          </p>
        </div>
      </footer>
    </ProtoShell>
  );
}
