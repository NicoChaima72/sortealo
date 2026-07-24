import { ActionIcon, Anchor, Box, Container, Group, Text } from "@mantine/core";
import { IconInfoCircle, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { CountdownChip } from "~/components/storefront/countdown-chip";
import { type AvisoBarraProps } from "~/lib/pagebuilder/widgets";
import { cssDeEsquema } from "~/styles/estiloSeccion";

/**
 * `aviso_barra` v2 (builder-tanda-1 F04/D7): cinta de aviso arriba de todo (sobre el nav). Migra el
 * `avisoTexto` del chrome (R1) — el migrate-on-read convierte `texto`→`mensajes:[texto]`.
 *
 * Tres modos: `estatico` (un mensaje fijo = look v1), `rotacion` (cicla los mensajes client-side,
 * SSR muestra el 1º VISIBLE, I-D) y `marquee` (ticker CSS puro: pista DUPLICADA que se desplaza -50%,
 * pausa en hover, reduced-motion ⇒ estático, I-B/I-C). `esquema` sale de `ESQUEMAS_FONDO` (cero hex —
 * `cssDeEsquema`, I-A; `acento*` degrada a marca sin acento, I-T2). `mostrarCountdown` monta el chip
 * del sorteo ACTIVO (auto-oculto sin sorteo). TEXTO PLANO siempre (nunca HTML, I3).
 */
export function AvisoBarra({ props }: { props: AvisoBarraProps }) {
  const [cerrado, setCerrado] = useState(false);
  if (cerrado) return null;

  const cssEsquema = cssDeEsquema(props.esquema);
  const transparente = props.esquema === "tema";

  return (
    <Box
      py="xs"
      style={{
        ...cssEsquema,
        // El borde inferior solo en el esquema transparente (= look v1); un esquema con relleno ya se
        // delimita por su propio color y el borde duplicaría la línea.
        ...(transparente
          ? { borderBottom: "1px solid var(--mantine-color-default-border)" }
          : {}),
      }}
    >
      <Container size="lg" px={{ base: "md", lg: "xl" }}>
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <IconInfoCircle className="size-[18px] shrink-0" />
            <Mensajes props={props} />
          </Group>
          <Group gap="xs" wrap="nowrap" className="shrink-0">
            {props.mostrarCountdown && <CountdownChip />}
            {props.descartable && (
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setCerrado(true)}
                aria-label="Cerrar aviso"
              >
                <IconX className="size-4" />
              </ActionIcon>
            )}
          </Group>
        </Group>
      </Container>
    </Box>
  );
}

/** Un enlace opcional al final del mensaje (texto plano + Anchor; misma forma que v1). */
function EnlaceAviso({ props }: { props: AvisoBarraProps }) {
  if (!props.enlaceUrl) return null;
  return (
    <>
      {" "}
      <Anchor href={props.enlaceUrl} target="_blank" rel="noreferrer" size="sm" c="inherit" fw={600}>
        {props.enlaceTexto ?? "Ver más"}
      </Anchor>
    </>
  );
}

/** El cuerpo de mensajes según el modo. */
function Mensajes({ props }: { props: AvisoBarraProps }) {
  if (props.modo === "marquee") return <Marquee props={props} />;
  if (props.modo === "rotacion") return <Rotacion props={props} />;
  // estatico (= look v1): el 1er mensaje + enlace opcional.
  return (
    <Text size="sm" c="inherit" style={{ whiteSpace: "pre-wrap", minWidth: 0 }}>
      {props.mensajes[0]}
      <EnlaceAviso props={props} />
    </Text>
  );
}

/**
 * Ticker: pista DUPLICADA (los mismos mensajes ×2) que se desplaza -50% en loop ⇒ costura invisible.
 * Solo `transform` (CLS=0, I-C). La clase `.animar-marquee` está gateada por reduced-motion en
 * globals.css ⇒ sin movimiento la pista queda estática y visible (I-B, I-D). Pausa en hover.
 */
function Marquee({ props }: { props: AvisoBarraProps }) {
  const dur = `${Math.max(props.mensajes.length * 7, 18)}s`;
  const pista = [...props.mensajes, ...props.mensajes];
  return (
    <div className="animar-marquee-pausable" style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
      <div
        className="animar-marquee"
        style={{ display: "inline-flex", gap: "3.5rem", whiteSpace: "nowrap", animationDuration: dur }}
      >
        {pista.map((m, i) => (
          <Text key={i} span size="sm" c="inherit" style={{ whiteSpace: "nowrap" }}>
            {m}
          </Text>
        ))}
      </div>
    </div>
  );
}

/**
 * Rotación: cicla los mensajes client-side (SSR muestra el 1º VISIBLE, I-D — sin opacity:0). El swap
 * ocurre solo tras hidratar (setInterval); con un único mensaje no arma intervalo (= estatico).
 */
function Rotacion({ props }: { props: AvisoBarraProps }) {
  const [i, setI] = useState(0);
  const n = props.mensajes.length;
  useEffect(() => {
    if (n < 2) return;
    const id = setInterval(() => setI((prev) => (prev + 1) % n), 4500);
    return () => clearInterval(id);
  }, [n]);
  const mensaje = props.mensajes[Math.min(i, n - 1)] ?? props.mensajes[0];
  return (
    <Text size="sm" c="inherit" style={{ whiteSpace: "pre-wrap", minWidth: 0 }}>
      {mensaje}
      <EnlaceAviso props={props} />
    </Text>
  );
}
