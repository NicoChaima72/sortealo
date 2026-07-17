import { Badge } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";

import {
  formatoCompacto,
  useCountdown,
} from "~/components/storefront/use-countdown";
import { useSorteoActivo } from "~/components/storefront/use-sorteo-activo";

/**
 * Chip de cuenta regresiva al cierre del sorteo en el header (plantilla-rica F04/D9). Aparece SOLO
 * si hay un sorteo ACTIVO y su `fechaFin` es futura (degradación elegante §5.2: sin sorteo ⇒ sin
 * chip). Consume la misma query pública que la vitrina (react-query dedupe). El tick client-side
 * vive en el componente interno para no llamar `useCountdown` sin fecha (regla de hooks).
 */
export function CountdownChip() {
  const sorteo = useSorteoActivo();
  if (!sorteo.data) return null;
  return <ChipConCuenta fechaFin={sorteo.data.fechaFin} />;
}

function ChipConCuenta({ fechaFin }: { fechaFin: Date }) {
  const t = useCountdown(fechaFin);
  if (t.terminado) return null; // sorteo vencido ⇒ sin chip

  return (
    <Badge
      variant="light"
      size="lg"
      radius="sm"
      leftSection={<IconClock className="size-3.5" stroke={2} />}
      classNames={{ label: "tabular-nums" }}
      styles={{ label: { textTransform: "none" } }}
      aria-label={`El sorteo cierra en ${formatoCompacto(t)}`}
    >
      {formatoCompacto(t)}
    </Badge>
  );
}
