import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { type ComponentType } from "react";

import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";

type IconCmp = ComponentType<{ className?: string; stroke?: number | string }>;

interface StatCardProps {
  label: string;
  value: string;
  icon: IconCmp;
  delta?: { value: string; dir: "up" | "down" };
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, delta, hint }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <Icon className="size-[18px] text-primary" stroke={1.75} />
        </div>
        <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          {delta && (
            <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
              {delta.dir === "up" ? (
                <IconTrendingUp className="size-3.5" />
              ) : (
                <IconTrendingDown className="size-3.5" />
              )}
              {delta.value}
            </span>
          )}
          {hint && <span className={cn(delta && "before:mr-1 before:content-['·']")}>{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
