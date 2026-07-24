import { Card, type CardProps } from "@mantine/core";
import { type ReactNode } from "react";

/**
 * Token ÚNICO de elevación del panel «Oscuro + calmo» (design.md §4, D5/I4). Las superficies del
 * panel (cards, KPIs, tabla, gráfico) NO llevan borde: se elevan por esta sombra difusa. Un solo
 * lugar para ajustar la elevación de TODO el panel — cero sombra hex dispersa (§9). Los canales
 * rgba salen de la tinta de marca `#191b22` = `rgb(25, 27, 34)` con alpha (no es un color de la
 * paleta: es una sombra, la única familia con valores rgba fuera del theme, análoga a los assets
 * SVG de §9). NO se overridea el `Card` global del theme porque afectaría storefront/landing, que
 * tienen su propia gramática suave.
 */
export const SOMBRA_PANEL =
  "0 1px 2px rgba(25, 27, 34, 0.04), 0 6px 20px rgba(25, 27, 34, 0.06)";

interface PanelCardProps extends CardProps {
  children: ReactNode;
}

/**
 * Superficie base del panel del Organizador (D4, design.md §4). `Card` de Mantine SIN borde, con
 * `radius="lg"` y la sombra del token `SOMBRA_PANEL`. Reemplaza a `Card withBorder` en el panel.
 * Reenvía todas las props de `Card` (`padding`, `component`, `mt`, etc.); `radius`/`padding` traen
 * el default de la gramática nueva pero se pueden override-ar.
 */
export function PanelCard({
  children,
  style,
  radius = "lg",
  padding = "lg",
  ...rest
}: PanelCardProps) {
  return (
    <Card
      withBorder={false}
      radius={radius}
      padding={padding}
      style={{ boxShadow: SOMBRA_PANEL, ...style }}
      {...rest}
    >
      {children}
    </Card>
  );
}
