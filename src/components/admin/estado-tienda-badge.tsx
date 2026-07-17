import { Badge } from "@mantine/core";

/**
 * Estado del ciclo de vida de una Tienda (enum `TenantStatus` de Prisma), declarado local (string
 * union) para no importar el enum de `@prisma/client` en el bundle del cliente — mismo criterio
 * que `EstadoBadge`.
 */
export type EstadoTienda = "ALTA" | "CONFIGURACION" | "PUBLICADA" | "SUSPENDIDA";

// Color del estado vía inline style = la MISMA excepción documentada de `estado-badge.tsx`
// (design.md §2/§9: la semántica de color de comercio está PENDIENTE — se mantiene el patrón
// provisorio badge neutro outline + punto de color inline hasta cerrar la paleta de marca).
const META: Record<EstadoTienda, { label: string; color: string }> = {
  ALTA: { label: "Alta", color: "#64748b" },
  CONFIGURACION: { label: "En configuración", color: "#d97706" },
  PUBLICADA: { label: "Publicada", color: "#16a34a" },
  SUSPENDIDA: { label: "Suspendida", color: "#dc2626" },
};

export function EstadoTiendaBadge({ estado }: { estado: EstadoTienda }) {
  const meta = META[estado];
  return (
    <Badge
      variant="outline"
      color="gray"
      radius="sm"
      leftSection={
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: meta.color,
          }}
        />
      }
      styles={{ label: { fontWeight: 400, textTransform: "none" } }}
    >
      {meta.label}
    </Badge>
  );
}
