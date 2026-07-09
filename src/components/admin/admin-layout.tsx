import {
  IconBook,
  IconBooks,
  IconExternalLink,
  IconLayoutDashboard,
  IconLogout2,
  IconMenu2,
  IconSettings,
  IconShoppingCart,
  IconTicket,
  IconX,
} from "@tabler/icons-react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ComponentType, type ReactNode, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

type IconCmp = ComponentType<{ className?: string; stroke?: number | string }>;

interface NavItem {
  label: string;
  href: string;
  icon: IconCmp;
}

const NAV: NavItem[] = [
  { label: "Resumen", href: "/admin", icon: IconLayoutDashboard },
  { label: "Libros", href: "/admin/libros", icon: IconBook },
  { label: "Ventas", href: "/admin/ventas", icon: IconShoppingCart },
  { label: "Sorteo", href: "/admin/sorteo", icon: IconTicket },
  { label: "Configuración", href: "/admin/configuracion", icon: IconSettings },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function Sidebar({
  pathname,
  open,
  onClose,
}: {
  pathname: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-3 border-b px-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <IconBooks className="size-5" stroke={1.75} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">Panel de la tienda</div>
          <div className="truncate text-xs text-muted-foreground">Administración</div>
        </div>
        <button
          onClick={onClose}
          className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-accent lg:hidden"
          aria-label="Cerrar menú"
        >
          <IconX className="size-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-[18px]" stroke={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
            A
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">La autora</div>
            <div className="truncate text-xs text-muted-foreground">Administradora</div>
          </div>
          <IconLogout2 className="size-4 text-muted-foreground" />
        </div>
        <Link
          href="/"
          className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <IconExternalLink className="size-4" />
          Ver la tienda
        </Link>
      </div>
    </aside>
  );
}

interface AdminLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminLayout({ title, description, actions, children }: AdminLayoutProps) {
  const { pathname } = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Head>
        <title>{`${title} · Panel de la tienda`}</title>
        <meta name="description" content="Panel de administración (vista de demostración)" />
      </Head>

      {/* App shell: alto fijo de viewport; el scroll vive solo en <main>. */}
      <div className="admin flex h-screen overflow-hidden bg-muted/30 text-foreground">
        <Sidebar pathname={pathname} open={open} onClose={() => setOpen(false)} />

        {open && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background px-4 lg:px-8">
            <button
              onClick={() => setOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
              aria-label="Abrir menú"
            >
              <IconMenu2 className="size-5" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold leading-tight tracking-tight">{title}</h1>
              {description && (
                <p className="truncate text-sm text-muted-foreground">{description}</p>
              )}
            </div>

            <div className="ml-auto flex items-center gap-3">
              <Badge
                variant="outline"
                className="hidden gap-1.5 font-normal text-muted-foreground sm:inline-flex"
              >
                <span className="size-1.5 rounded-full bg-primary" />
                Vista de demostración
              </Badge>
              {actions}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
