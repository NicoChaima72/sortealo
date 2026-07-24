import { Badge, Button, Card, Group, Progress, Table, Text } from "@mantine/core";
import { IconArrowRight, IconTicket } from "@tabler/icons-react";
import {
  Bricolage_Grotesque,
  Fraunces,
  Gabarito,
  Hanken_Grotesk,
  Space_Grotesk,
} from "next/font/google";
import Head from "next/head";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";

/**
 * PROTOTIPO (skill prototype/UI.md) — comparador de FUENTE DE TÍTULOS/HEADINGS para el dashboard
 * del admin. Mock estático del Resumen; el switcher flotante (← →) cambia SOLO la familia de los
 * títulos (h1 + títulos de card), dejando el cuerpo en Instrument y los números en IBM Plex Mono.
 * Ninguna candidata es de Grillos (Recoleta/Refinder son licencias pagas). Throwaway.
 */

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], display: "swap" });
const gabarito = Gabarito({ subsets: ["latin"], display: "swap" });

const FUENTES: { clave: string; nombre: string; familia: string; nota: string }[] = [
  { clave: "bricolage", nombre: "Bricolage Grotesque", familia: bricolage.style.fontFamily, nota: "actual · impreso popular" },
  { clave: "fraunces", nombre: "Fraunces", familia: fraunces.style.fontFamily, nota: "serif cálida · editorial" },
  { clave: "space", nombre: "Space Grotesk", familia: spaceGrotesk.style.fontFamily, nota: "geométrica · moderna" },
  { clave: "hanken", nombre: "Hanken Grotesk", familia: hanken.style.fontFamily, nota: "humanista · amable-pro" },
  { clave: "gabarito", nombre: "Gabarito", familia: gabarito.style.fontFamily, nota: "redondeada · cercana" },
];

const SOMBRA = "0 1px 2px rgba(25,27,34,0.04), 0 6px 20px rgba(25,27,34,0.06)";

function Panel({ children }: { children: ReactNode }) {
  return (
    <Card radius="lg" padding="lg" style={{ boxShadow: SOMBRA, background: "var(--mantine-color-body)" }}>
      {children}
    </Card>
  );
}

/** Título de sección en la fuente candidata (hereda `--font-titulo` del wrapper). */
function Titulo({ children, size = 17 }: { children: ReactNode; size?: number }) {
  return (
    <Text fw={700} style={{ fontFamily: "var(--font-titulo)", fontSize: size, lineHeight: 1.2 }}>
      {children}
    </Text>
  );
}

const KPIS = [
  { label: "Ventas pagadas", value: "47", hint: "últimos 14 días" },
  { label: "Ingresos", value: "$184.350", hint: "total cobrado (bruto)" },
  { label: "Números vendidos", value: "312", hint: "del talonario" },
  { label: "Pendientes", value: "3", hint: "pagos sin confirmar" },
];

const VENTAS = [
  { email: "ma***@gmail.com", numero: "Nº 312", total: "$3.990", estado: "Pagado", color: "exito" },
  { email: "jo***@hotmail.com", numero: "Nº 310–311", total: "$7.980", estado: "Pagado", color: "exito" },
  { email: "ca***@gmail.com", numero: "—", total: "$3.990", estado: "Pendiente", color: "pendiente" },
  { email: "pa***@gmail.com", numero: "—", total: "$3.990", estado: "Fallido", color: "red" },
];

const DIAS = [1, 2, 1, 3, 2, 4, 3, 2, 4, 3, 5, 4, 6, 7];

function Switcher({ i, onPrev, onNext }: { i: number; onPrev: () => void; onNext: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext]);

  if (process.env.NODE_ENV === "production") return null;
  const f = FUENTES[i]!;
  const flecha: CSSProperties = {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: 16,
    padding: "6px 10px",
    cursor: "pointer",
    borderRadius: 999,
  };
  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "#111318",
        color: "#fff",
        borderRadius: 999,
        padding: "4px 8px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        fontFamily: "ui-monospace, monospace",
        fontSize: 12.5,
      }}
    >
      <button type="button" style={flecha} aria-label="Fuente anterior" onClick={onPrev}>
        ←
      </button>
      <span style={{ padding: "0 8px", whiteSpace: "nowrap", textAlign: "center", minWidth: 220 }}>
        <b>{f.nombre}</b>
        <span style={{ opacity: 0.55 }}> · {f.nota}</span>
      </span>
      <button type="button" style={flecha} aria-label="Fuente siguiente" onClick={onNext}>
        →
      </button>
    </div>
  );
}

export default function PrototipoHeadings() {
  const [i, setI] = useState(0);
  const fuente = FUENTES[i]!;
  const prev = () => setI((v) => (v - 1 + FUENTES.length) % FUENTES.length);
  const next = () => setI((v) => (v + 1) % FUENTES.length);
  const max = Math.max(...DIAS);

  return (
    <>
      <Head>
        <title>Prototipo · Fuente de títulos · Sortéatelo</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div
        style={
          {
            "--font-titulo": fuente.familia,
            minHeight: "100vh",
            background: "var(--mantine-color-gray-0)",
            paddingBottom: 72,
          } as CSSProperties
        }
      >
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          {/* Saludo (h1 en la fuente candidata) */}
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md" mb="lg">
            <div>
              <Text
                component="h1"
                fw={800}
                style={{ fontFamily: "var(--font-titulo)", fontSize: "1.9rem", lineHeight: 1.15, margin: 0 }}
              >
                Hola, Nicolás
              </Text>
              <Text size="sm" c="dimmed" mt={4}>
                Una mirada rápida a cómo va tu tienda.
              </Text>
            </div>
            <Badge variant="dot" color="exito" size="lg" radius="sm" tt="none" fw={500}>
              Tienda publicada
            </Badge>
          </Group>

          {/* KPI strip (labels overline, números mono, sin tocar) */}
          <Panel>
            <div
              className="grid grid-cols-1 overflow-hidden rounded-md sm:grid-cols-2 xl:grid-cols-4"
              style={{ gap: 1, background: "var(--mantine-color-default-border)" }}
            >
              {KPIS.map((k) => (
                <div key={k.label} className="px-5 py-4" style={{ background: "var(--mantine-color-body)" }}>
                  <Text fz={11} fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.06em" }}>
                    {k.label}
                  </Text>
                  <Text fw={700} fz="1.55rem" mt={8} ff="monospace" className="tabular-nums" lh={1.15}>
                    {k.value}
                  </Text>
                  <Text size="xs" c="dimmed" mt={6}>
                    {k.hint}
                  </Text>
                </div>
              ))}
            </div>
          </Panel>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-4">
              {/* Chart card (título en fuente candidata) */}
              <Panel>
                <Titulo>Ventas de los últimos 14 días</Titulo>
                <Text size="sm" c="dimmed" mt={4} mb="lg">
                  Órdenes pagadas por día
                </Text>
                <div className="flex items-end gap-2" style={{ height: 130 }}>
                  {DIAS.map((v, idx) => (
                    <div key={idx} className="flex flex-1 flex-col items-center justify-end gap-1">
                      <div
                        className="w-full max-w-[26px] rounded-t-[4px]"
                        style={{
                          height: `${(v / max) * 110}px`,
                          background:
                            idx === DIAS.length - 1
                              ? "var(--mantine-color-amarillo-6)"
                              : "var(--mantine-color-sorteatelo-6)",
                          opacity: idx === DIAS.length - 1 ? 1 : 0.82,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Tabla (título en fuente candidata) */}
              <Panel>
                <Group justify="space-between" align="flex-start" mb="md">
                  <Titulo>Últimas ventas</Titulo>
                  <Button variant="subtle" size="xs" rightSection={<IconArrowRight className="size-4" />}>
                    Ver todas
                  </Button>
                </Group>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Cliente</Table.Th>
                      <Table.Th>Número</Table.Th>
                      <Table.Th className="text-right">Total</Table.Th>
                      <Table.Th className="text-right">Estado</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {VENTAS.map((v) => (
                      <Table.Tr key={v.email}>
                        <Table.Td c="dimmed">{v.email}</Table.Td>
                        <Table.Td ff="monospace" fz="sm" className="tabular-nums">
                          {v.numero}
                        </Table.Td>
                        <Table.Td ff="monospace" className="text-right tabular-nums">
                          {v.total}
                        </Table.Td>
                        <Table.Td className="text-right">
                          <Badge variant="light" color={v.color} radius="sm" size="sm" tt="none" fw={500}>
                            {v.estado}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Panel>
            </div>

            {/* Sorteo (título en fuente candidata) */}
            <Panel>
              <Group justify="space-between" align="center" mb="md">
                <Titulo>Tu sorteo</Titulo>
                <IconTicket className="size-5" stroke={1.75} color="var(--mantine-color-amarillo-6)" />
              </Group>
              <Titulo size={20}>iPad + set de láminas firmadas</Titulo>
              <Group align="baseline" gap={8} mt="md">
                <Text fw={700} fz="2rem" ff="monospace" className="tabular-nums" lh={1}>
                  3 días
                </Text>
              </Group>
              <Text size="sm" c="dimmed" ff="monospace">
                domingo 20 · 21:00
              </Text>
              <Group justify="space-between" mt="lg" mb={6}>
                <Text size="sm" c="dimmed">
                  Números vendidos
                </Text>
                <Text size="sm" fw={600} ff="monospace" className="tabular-nums">
                  312 / 500
                </Text>
              </Group>
              <Progress value={62.4} size="sm" radius="xl" />
            </Panel>
          </div>
        </div>

        <Switcher i={i} onPrev={prev} onNext={next} />
      </div>
    </>
  );
}
