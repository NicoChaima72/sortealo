import { Anchor, Group } from "@mantine/core";
import { IconLayoutDashboard, IconLogin } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { env } from "~/env";
import { apexDesdeHost, construirUrlApex } from "~/lib/urlApex";

/**
 * Puerta de entrada al LOGIN desde el storefront (F09b, ADR-0019/D6). El login y el panel viven en el
 * APEX (OAuth con `NEXTAUTH_URL` fijo); desde un subdominio de Tienda no había cómo iniciar sesión.
 * Este enlace discreto lo resuelve: chrome NEUTRO de PLATAFORMA (dimmed), en el footer — no compite con
 * la conversión de la tienda ni usa el color del tenant (D13).
 *
 * Monta POST-HIDRATACIÓN (`montado`, mismo patrón que el banner F09): en SSR y pre-hidratación NO
 * renderiza nada ⇒ el HTML anónimo es idéntico con/sin cookie ⇒ CDN-cacheable (I5/R5). Post-hidratación:
 * con sesión ⇒ "Mi panel" (apex `/admin`); sin sesión ⇒ "Iniciar sesión" (apex `/login?callbackUrl=<URL
 * actual>`). El `callbackUrl` lo valida F08 contra `*.<apex>` ⇒ el retorno cross-subdominio es legítimo,
 * y con la cookie wildcard la sesión queda visible en la tienda (⇒ aparece el banner F09).
 *
 * Dev localhost es host-only: la cookie no cruza subdominios (limitación conocida, ver
 * `docs/dev-wildcard-session.md`) — el enlace igual apunta bien; el flujo completo se prueba en lvh.me/prod.
 */
export function AccesoPlataforma({ slug }: { slug: string }) {
  const [montado, setMontado] = useState(false);
  const { status } = useSession();
  useEffect(() => setMontado(true), []);

  if (!montado) return null; // no toca el SSR (I5): aparece post-hidratación

  // Apex de config (env, autoritativo) o derivado del host (localhost sin env). Proto/puerto del actual.
  // `env` con emptyStringAsUndefined ⇒ el apex es un string no-vacío o undefined ⇒ `??` es seguro.
  const apex =
    env.NEXT_PUBLIC_PLATFORM_DOMAIN ??
    apexDesdeHost(window.location.hostname, slug);
  const protocol = window.location.protocol;
  const puerto = window.location.port;

  if (status === "authenticated") {
    const panelUrl = construirUrlApex({ protocol, apex, puerto, path: "/admin" });
    return (
      <Anchor href={panelUrl} c="dimmed" size="sm" underline="never">
        <Group gap={6} wrap="nowrap">
          <IconLayoutDashboard className="size-4" stroke={1.75} />
          Mi panel
        </Group>
      </Anchor>
    );
  }

  const loginUrl = construirUrlApex({
    protocol,
    apex,
    puerto,
    path: "/login",
    callbackUrl: window.location.href,
  });
  return (
    <Anchor href={loginUrl} c="dimmed" size="sm" underline="never">
      <Group gap={6} wrap="nowrap">
        <IconLogin className="size-4" stroke={1.75} />
        Iniciar sesión
      </Group>
    </Anchor>
  );
}
