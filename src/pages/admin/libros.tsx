import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

import { AdminLayout } from "~/components/admin/admin-layout";
import { clp, type Libro, LIBROS, num } from "~/components/admin/mock-data";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

function iniciales(titulo: string) {
  return titulo
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function BookFormDialog({
  open,
  onOpenChange,
  libro,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  libro: Libro | null;
}) {
  const esEdicion = libro !== null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar libro" : "Agregar libro"}</DialogTitle>
          <DialogDescription>
            {esEdicion
              ? "Modifica los datos del libro y guarda los cambios."
              : "Completa los datos del libro que quieres poner a la venta."}
          </DialogDescription>
        </DialogHeader>

        <div key={libro?.id ?? "nuevo"} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              defaultValue={libro?.titulo}
              placeholder="Ej. Cómo enriquecer a tu idol favorito"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <textarea
              id="descripcion"
              defaultValue={libro?.descripcion}
              placeholder="Un par de líneas que enganchen a tu lectora."
              className="flex min-h-[88px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="precio">Precio (CLP)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="precio"
                  className="pl-7 tabular-nums"
                  defaultValue={libro ? String(libro.precio) : "3000"}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estado">Estado</Label>
              <Select defaultValue={libro && !libro.activo ? "borrador" : "activo"}>
                <SelectTrigger id="estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">A la venta</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Portada</Label>
            <div className="flex h-28 cursor-pointer items-center justify-center rounded-md border border-dashed border-input text-sm text-muted-foreground transition-colors hover:bg-accent">
              Arrastra una imagen o haz clic para subirla
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Archivo del libro (PDF)</Label>
            <div className="flex items-center justify-between rounded-md border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground">
              <span>{esEdicion ? "libro.pdf · 4,2 MB" : "Ningún archivo seleccionado"}</span>
              <Button type="button" variant="outline" size="sm">
                {esEdicion ? "Reemplazar" : "Subir PDF"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={() => onOpenChange(false)}>
            {esEdicion ? "Guardar cambios" : "Agregar libro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LibrosPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Libro | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Libro | null>(null);

  function openNew() {
    setEditTarget(null);
    setFormOpen(true);
  }
  function openEdit(libro: Libro) {
    setEditTarget(libro);
    setFormOpen(true);
  }

  return (
    <AdminLayout
      title="Libros"
      description="Agrega, edita y administra los libros de tu catálogo."
      actions={
        <Button onClick={openNew}>
          <IconPlus className="size-4" />
          <span className="hidden sm:inline">Agregar libro</span>
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Libro</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="hidden md:table-cell">Publicado</TableHead>
                <TableHead className="pr-6 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LIBROS.map((libro) => (
                <TableRow key={libro.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
                        {iniciales(libro.titulo)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{libro.titulo}</div>
                        <div className="max-w-[280px] truncate text-xs text-muted-foreground">
                          {libro.descripcion}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{clp(libro.precio)}</TableCell>
                  <TableCell>
                    {libro.activo ? (
                      <Badge variant="secondary">A la venta</Badge>
                    ) : (
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        Borrador
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{num(libro.ventas)}</TableCell>
                  <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                    {libro.publicado}
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar"
                        onClick={() => openEdit(libro)}
                      >
                        <IconPencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(libro)}
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BookFormDialog open={formOpen} onOpenChange={setFormOpen} libro={editTarget} />

      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar libro</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar <span className="font-medium text-foreground">{deleteTarget?.titulo}</span>?
              Esta acción no se puede deshacer. Las ventas ya realizadas se conservan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => setDeleteTarget(null)}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
