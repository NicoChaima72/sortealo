import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "~/components/ui/skeleton";
import { clp, VENTAS_MES } from "~/components/admin/mock-data";

// Colores explícitos del gráfico = excepción de data-viz de las convenciones
// (frontend-conventions.md). Monocromo para mantener el panel sobrio.
const STROKE = "hsl(262 58% 52%)";
const GRID = "hsl(240 5% 90%)";
const AXIS = "hsl(240 4% 46%)";

interface TooltipPayload {
  active?: boolean;
  payload?: { value: number; payload: { mes: string; ventas: number } }[];
}

function ChartTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  if (!p) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <div className="font-medium">{p.payload.mes}</div>
      <div className="mt-1 tabular-nums text-muted-foreground">
        {clp(p.value)} · {p.payload.ventas} ventas
      </div>
    </div>
  );
}

export function SalesChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <Skeleton className="h-[260px] w-full" />;

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={VENTAS_MES} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="fillIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={STROKE} stopOpacity={0.18} />
              <stop offset="100%" stopColor={STROKE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
          <XAxis
            dataKey="mes"
            tickLine={false}
            axisLine={false}
            tick={{ fill: AXIS, fontSize: 12 }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fill: AXIS, fontSize: 11 }}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID }} />
          <Area
            type="monotone"
            dataKey="ingresos"
            stroke={STROKE}
            strokeWidth={2}
            fill="url(#fillIngresos)"
            dot={{ r: 2.5, fill: STROKE, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
