import {
  IconArrowRight,
  IconBook2,
  IconCoin,
  IconShoppingCart,
  IconTicket,
} from "@tabler/icons-react";
import Link from "next/link";

import { AdminLayout } from "~/components/admin/admin-layout";
import { EstadoBadge } from "~/components/admin/estado-badge";
import { clp, LIBROS, num, ORDENES, SORTEO } from "~/components/admin/mock-data";
import { SalesChart } from "~/components/admin/sales-chart";
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

export default function AdminDashboard() {
  const ultimas = ORDENES.slice(0, 5);
  const librosActivos = LIBROS.filter((l) => l.activo).length;
  const progresoSorteo = Math.round((SORTEO.participantes / SORTEO.meta) * 100);

  return (
    <AdminLayout
      title="Resumen"
      description="Una mirada rápida a cómo va tu tienda este mes."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ventas del mes"
          value="13"
          icon={IconShoppingCart}
          delta={{ value: "+8%", dir: "up" }}
          hint="vs. mes anterior"
        />
        <StatCard
          label="Ingresos netos"
          value={clp(37657)}
          icon={IconCoin}
          delta={{ value: "+8%", dir: "up" }}
          hint="ya con comisión de Flow"
        />
        <StatCard
          label="Participantes"
          value={num(SORTEO.participantes)}
          icon={IconTicket}
          delta={{ value: "+12", dir: "up" }}
          hint="en el sorteo activo"
        />
        <StatCard
          label="Libros activos"
          value={String(librosActivos)}
          icon={IconBook2}
          hint={`${LIBROS.length} en total`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos por mes</CardTitle>
            <CardDescription>Últimos 8 meses (bruto, antes de comisión)</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sorteo activo</CardTitle>
            <CardDescription>{SORTEO.premio}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Participantes</span>
                <span className="font-semibold tabular-nums">
                  {num(SORTEO.participantes)} / {num(SORTEO.meta)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progresoSorteo}%` }}
                />
              </div>
            </div>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Fecha del sorteo</dt>
                <dd className="font-medium">{SORTEO.fechaSorteo}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Estado</dt>
                <dd>
                  <Badge variant="secondary">Activo</Badge>
                </dd>
              </div>
            </dl>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/sorteo">
                Ver sorteo
                <IconArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Últimas ventas</CardTitle>
            <CardDescription>Las compras más recientes</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/ventas">
              Ver todas
              <IconArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Libro</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ultimas.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium tabular-nums">{o.id}</TableCell>
                  <TableCell className="text-muted-foreground">{o.correo}</TableCell>
                  <TableCell className="hidden max-w-[240px] truncate md:table-cell">
                    {o.libro}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                    {o.fecha}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{clp(o.total)}</TableCell>
                  <TableCell>
                    <EstadoBadge estado={o.estado} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
