import { Group, Text } from "@mantine/core";
import { Sparkline } from "@mantine/charts";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { type ComponentType } from "react";

import { PanelCard } from "~/components/admin/panel-card";
import { cn } from "~/lib/utils";

type IconCmp = ComponentType<{
  className?: string;
  stroke?: number | string;
  color?: string;
}>;

interface StatCardProps {
  label: string;
  value: string;
  icon: IconCmp;
  delta?: { value: string; dir: "up" | "down" };
  hint?: string;
  /** Serie para el sparkline (solo KPIs con serie real, D8). Vacío/ausente ⇒ no se dibuja. */
  sparkline?: number[];
}

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
  sparkline,
}: StatCardProps) {
  return (
    <PanelCard padding="lg">
      <Group justify="space-between" wrap="nowrap">
        <Text size="xs" fw={500} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.03em" }}>
          {label}
        </Text>
        {/* Acento primario del panel (cobalto de plataforma). Hereda la paleta del theme por token. */}
        <Icon
          className="size-[18px]"
          stroke={1.75}
          color="var(--mantine-primary-color-filled)"
        />
      </Group>
      {/* Número de marca: IBM Plex Mono + tabular-nums (D9, design.md §3/§8 — firma del talonario). */}
      <Text mt="sm" fw={600} fz="1.7rem" lh={1.15} ff="monospace" className="tabular-nums">
        {value}
      </Text>
      <Group mt={6} gap={6} align="center">
        {delta && (
          <Text span size="xs" fw={500} className="inline-flex items-center gap-0.5">
            {delta.dir === "up" ? (
              <IconTrendingUp className="size-3.5" />
            ) : (
              <IconTrendingDown className="size-3.5" />
            )}
            {delta.value}
          </Text>
        )}
        {hint && (
          <Text span size="xs" c="dimmed" className={cn(delta && "before:mr-1 before:content-['·']")}>
            {hint}
          </Text>
        )}
      </Group>
      {sparkline && sparkline.length > 1 && (
        <Sparkline
          mt="md"
          h={36}
          data={sparkline}
          curveType="linear"
          color="sorteatelo.6"
          fillOpacity={0.12}
          strokeWidth={1.5}
        />
      )}
    </PanelCard>
  );
}
