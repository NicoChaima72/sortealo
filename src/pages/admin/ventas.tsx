import { IconDownload, IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";

import { AdminLayout } from "~/components/admin/admin-layout";
import { EstadoBadge } from "~/components/admin/estado-badge";
import {
  clp,
  type EstadoOrden,
  neto,
  num,
  ORDENES,
} from "~/components/admin/mock-data";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type FiltroEstado = "todos" | EstadoOrden;

export default function VentasPage() {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<FiltroEstado>("todos");

  const filtradas = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ORDENES.filter((o) => {
      const matchTexto =
        term === "" ||
        [o.id, o.correo, o.libro].some((s) => s.toLowerCase().includes(term));
      const matchEstado = estado === "todos" || o.estado === estado;
      return matchTexto && matchEstado;
    });
  }, [q, estado]);

  const totalBruto = filtradas.reduce((acc, o) => acc + o.total, 0);

  return (
    <AdminLayout
      title="Ventas"
      description="Todas las compras de tu tienda, con su estado y lo que te queda."
      actions={
        <Button variant="outline">
          <IconDownload className="size-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por correo, libro u orden…"
            className="pl-9"
          />
        </div>
        <Select value={estado} onValueChange={(v) => setEstado(v as FiltroEstado)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pagado">Pagado</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="fallido">Fallido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden lg:table-cell">Libro</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="hidden text-right md:table-cell">Comisión</TableHead>
                <TableHead className="text-right">Te queda</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    No hay ventas que coincidan con tu búsqueda.
                  </TableCell>
                </TableRow>
              ) : (
                filtradas.map((o) => {
                  const comision = o.total - neto(o.total);
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="pl-6 font-medium tabular-nums">{o.id}</TableCell>
                      <TableCell className="text-muted-foreground">{o.correo}</TableCell>
                      <TableCell className="hidden max-w-[220px] truncate lg:table-cell">
                        {o.libro}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                        {o.fecha}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{clp(o.total)}</TableCell>
                      <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                        −{clp(comision)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {o.estado === "pagado" ? clp(neto(o.total)) : "—"}
                      </TableCell>
                      <TableCell>
                        <EstadoBadge estado={o.estado} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {filtradas.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell className="pl-6 text-muted-foreground" colSpan={4}>
                    {num(filtradas.length)} {filtradas.length === 1 ? "venta" : "ventas"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{clp(totalBruto)}</TableCell>
                  <TableCell className="hidden md:table-cell" />
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
