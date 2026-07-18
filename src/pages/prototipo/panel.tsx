import {
  IconBook,
  IconLayoutDashboard,
  IconLogout2,
  IconSettings,
  IconShoppingCart,
  IconTicket,
} from "@tabler/icons-react";
import { type ComponentType } from "react";

import {
  ProtoShell,
  Wordmark,
  estilos,
  fuentes,
} from "~/components/prototipo/proto";

/**
 * PROTOTIPO — panel del Organizador (dirección "El Talonario"). Mock estático
 * con datos de ejemplo hardcodeados (sin tRPC ni guard): evalúa solo la
 * dirección de arte del shell, KPIs, tabla de ventas y sellos de estado.
 */

type Icono = ComponentType<{ className?: string; stroke?: number | string }>;

const NAV: { label: string; icono: Icono; activo?: boolean }[] = [
  { label: "Resumen", icono: IconLayoutDashboard, activo: true },
  { label: "Productos", icono: IconBook },
  { label: "Ventas", icono: IconShoppingCart },
  { label: "Sorteo", icono: IconTicket },
  { label: "Configuración", icono: IconSettings },
];

const KPIS = [
  { label: "Ventas pagadas", valor: "47", nota: "órdenes confirmadas" },
  { label: "Ingresos", valor: "$184.350", nota: "total cobrado (bruto)" },
  { label: "Números vendidos", valor: "312", nota: "participan del sorteo" },
  { label: "Sorteo cierra en", valor: "3 días", nota: "domingo 20 · 21:00" },
];

const VENTAS: {
  email: string;
  numero: string;
  fecha: string;
  total: string;
  estado: "PAGADO" | "PENDIENTE" | "FALLIDO";
}[] = [
  { email: "ma***@gmail.com", numero: "Nº 312", fecha: "hoy 18:42", total: "$3.990", estado: "PAGADO" },
  { email: "jo***@hotmail.com", numero: "Nº 310–311", fecha: "hoy 17:15", total: "$7.980", estado: "PAGADO" },
  { email: "ca***@gmail.com", numero: "—", fecha: "hoy 16:58", total: "$3.990", estado: "PENDIENTE" },
  { email: "fr***@gmail.com", numero: "Nº 309", fecha: "hoy 15:20", total: "$3.990", estado: "PAGADO" },
  { email: "pa***@gmail.com", numero: "—", fecha: "hoy 14:03", total: "$3.990", estado: "FALLIDO" },
];

const SELLO_ESTADO = {
  PAGADO: { clase: estilos.selloPagado, label: "Pagado" },
  PENDIENTE: { clase: estilos.selloPendiente, label: "Pendiente" },
  FALLIDO: { clase: estilos.selloFallido, label: "Fallido" },
} as const;

export default function PrototipoPanel() {
  return (
    <ProtoShell titulo="Panel">
      <div className="flex min-h-screen">
        {/* sidebar */}
        <aside
          className="hidden w-60 flex-none flex-col lg:flex"
          style={{ borderRight: "2px dashed var(--linea)" }}
        >
          <div style={{ padding: "22px 20px 14px" }}>
            <Wordmark tamano={20} />
            <p className={estilos.etiqueta} style={{ margin: "10px 0 0" }}>
              Tienda de Luna
            </p>
          </div>
          <nav className="flex flex-col gap-1 px-3 pt-2">
            {NAV.map((item) => {
              const Icono = item.icono;
              return (
                <a
                  key={item.label}
                  href="#"
                  className={item.activo ? estilos.panelNavItemActivo : estilos.panelNavItem}
                >
                  <Icono className="size-[18px]" stroke={1.75} />
                  {item.label}
                </a>
              );
            })}
          </nav>
          <div className="mt-auto px-3 pb-5">
            <a href="#" className={estilos.panelNavItem}>
              <IconLogout2 className="size-[18px]" stroke={1.75} />
              Cerrar sesión
            </a>
          </div>
        </aside>

        {/* contenido */}
        <main className="min-w-0 flex-1">
          <header
            className="flex items-center justify-between gap-4 px-5 py-5 lg:px-8"
            style={{ borderBottom: "2px dashed var(--linea)" }}
          >
            <div>
              <h1
                className={fuentes.display.className}
                style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}
              >
                Hola, Luna
              </h1>
              <p style={{ fontSize: 14, color: "var(--tinta-suave)", margin: "2px 0 0" }}>
                Así va tu tienda esta semana.
              </p>
            </div>
            <span className={estilos.sello} style={{ color: "var(--teal)" }}>
              Tienda publicada
            </span>
          </header>

          <div className="mx-auto max-w-5xl px-5 py-7 lg:px-8">
            {/* KPIs */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {KPIS.map((kpi) => (
                <div key={kpi.label} className={estilos.kpi}>
                  <p className={estilos.etiqueta} style={{ margin: 0 }}>
                    {kpi.label}
                  </p>
                  <p className={estilos.kpiValor} style={{ margin: "8px 0 2px" }}>
                    {kpi.valor}
                  </p>
                  <p style={{ fontSize: 12.5, color: "var(--tinta-tenue)", margin: 0 }}>
                    {kpi.nota}
                  </p>
                </div>
              ))}
            </div>

            {/* últimas ventas */}
            <div className={estilos.impreso} style={{ marginTop: 20, overflow: "hidden" }}>
              <div
                className="flex flex-wrap items-baseline justify-between gap-2"
                style={{ padding: "16px 16px 12px", borderBottom: "2px solid var(--tinta)" }}
              >
                <h2 style={{ fontSize: 16.5, fontWeight: 600, margin: 0 }}>Últimas ventas</h2>
                <span className={estilos.etiqueta}>Ver todas →</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className={estilos.tabla}>
                  <thead>
                    <tr>
                      <th>Compra</th>
                      <th>Número</th>
                      <th>Fecha</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {VENTAS.map((venta) => {
                      const sello = SELLO_ESTADO[venta.estado];
                      return (
                        <tr key={venta.email + venta.fecha}>
                          <td style={{ color: "var(--tinta-suave)" }}>{venta.email}</td>
                          <td className={fuentes.mono.className} style={{ fontSize: 13 }}>
                            {venta.numero}
                          </td>
                          <td style={{ color: "var(--tinta-suave)", whiteSpace: "nowrap" }}>
                            {venta.fecha}
                          </td>
                          <td className={estilos.monto}>{venta.total}</td>
                          <td>
                            <span className={sello.clase}>{sello.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtoShell>
  );
}
