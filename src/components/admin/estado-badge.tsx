import { Badge } from "~/components/ui/badge";
import { type EstadoOrden } from "~/components/admin/mock-data";

// Color del estado vía inline style = excepción de data-viz de las convenciones.
// El badge en sí es neutro (outline); solo el punto lleva color.
const META: Record<EstadoOrden, { label: string; color: string }> = {
  pagado: { label: "Pagado", color: "#16a34a" },
  pendiente: { label: "Pendiente", color: "#d97706" },
  fallido: { label: "Fallido", color: "#dc2626" },
};

export function EstadoBadge({ estado }: { estado: EstadoOrden }) {
  const meta = META[estado];
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className="size-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </Badge>
  );
}
