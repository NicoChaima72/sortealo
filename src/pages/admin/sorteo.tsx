import {
  IconCalendarEvent,
  IconFileText,
  IconPlayerPlay,
  IconTicket,
  IconTrophy,
  IconUsers,
} from "@tabler/icons-react";

import { AdminLayout } from "~/components/admin/admin-layout";
import { num, PARTICIPANTES, SORTEO } from "~/components/admin/mock-data";
import { StatCard } from "~/components/admin/stat-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export default function SorteoPage() {
  const progreso = Math.round((SORTEO.participantes / SORTEO.meta) * 100);

  return (
    <AdminLayout
      title="Sorteo"
      description="Administra el sorteo activo, sus participantes y el ganador."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Participantes" value={num(SORTEO.participantes)} icon={IconUsers} hint="personas inscritas" />
        <StatCard label="Tickets emitidos" value="104" icon={IconTicket} hint="cada compra suma" />
        <StatCard label="Días para el sorteo" value="104" icon={IconCalendarEvent} hint={SORTEO.fechaSorteo} />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>{SORTEO.nombre}</CardTitle>
              <CardDescription>{SORTEO.premio}</CardDescription>
            </div>
            <Badge variant="secondary">Activo</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Avance hacia la meta</span>
              <span className="font-semibold tabular-nums">
                {num(SORTEO.participantes)} / {num(SORTEO.meta)} ({progreso}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progreso}%` }} />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button disabled>
              <IconPlayerPlay className="size-4" />
              Ejecutar sorteo
            </Button>
            <Button variant="outline">
              <IconFileText className="size-4" />
              Ver bases del sorteo
            </Button>
            <p className="text-xs text-muted-foreground sm:ml-1">
              El sorteo se podrá ejecutar el día de cierre ({SORTEO.fechaSorteo}).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Participantes</CardTitle>
            <CardDescription>Quienes ya están dentro del sorteo</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Cliente</TableHead>
                  <TableHead>Se inscribió</TableHead>
                  <TableHead className="pr-6 text-right">Tickets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PARTICIPANTES.map((p) => (
                  <TableRow key={p.correo}>
                    <TableCell className="pl-6 text-muted-foreground">{p.correo}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{p.inscripcion}</TableCell>
                    <TableCell className="pr-6 text-right tabular-nums font-medium">{p.tickets}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t px-6 py-3 text-center text-xs text-muted-foreground">
              Mostrando 7 de {num(SORTEO.participantes)} participantes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ganador</CardTitle>
            <CardDescription>Aparecerá cuando ejecutes el sorteo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
              <IconTrophy className="size-8 text-muted-foreground/50" stroke={1.5} />
              <p className="mt-3 max-w-[200px] text-sm text-muted-foreground">
                Todavía no se ha realizado el sorteo. El ganador quedará registrado aquí, con fecha y hora.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
