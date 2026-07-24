import {
  ActionIcon,
  AppShell,
  Avatar,
  Badge,
  Button,
  ColorSwatch,
  Divider,
  Group,
  Kbd,
  Menu,
  NavLink,
  Paper,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure, useLocalStorage, useMediaQuery } from "@mantine/hooks";
import {
  Spotlight,
  spotlight,
  type SpotlightActionData,
} from "@mantine/spotlight";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBook,
  IconBuildingStore,
  IconChevronDown,
  IconExternalLink,
  IconLayoutDashboard,
  IconLogout2,
  IconMenu2,
  IconSearch,
  IconSettings,
  IconShieldLock,
  IconShoppingCart,
  IconTicket,
} from "@tabler/icons-react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { type ComponentType, type CSSProperties, type ReactNode } from "react";

import { CrearTienda } from "~/components/admin/crear-tienda";
import { PageHeader } from "~/components/admin/page-header";
import { abrirTienda } from "~/components/admin/url-tienda";
import { Wordmark } from "~/components/marca/wordmark";
import { APP_CONFIG } from "~/config/app";
import { api } from "~/utils/api";

type IconCmp = ComponentType<{ className?: string; stroke?: number | string }>;

interface NavItem {
  label: string;
  href: string;
  icon: IconCmp;
}

interface TiendaAcceso {
  nombre: string;
  slug: string;
  colorPrimario: string | null;
}

const NAV: NavItem[] = [
  { label: "Resumen", href: "/admin", icon: IconLayoutDashboard },
  { label: "Productos", href: "/admin/productos", icon: IconBook },
  { label: "Ventas", href: "/admin/ventas", icon: IconShoppingCart },
  { label: "Sorteo", href: "/admin/sorteo", icon: IconTicket },
  { label: "Configuración", href: "/admin/configuracion", icon: IconSettings },
];

/** Navegación operativa (arriba en el rail) vs. utilidades ancladas al pie (ajustes). */
const NAV_PRINCIPAL = NAV.filter((i) => i.href !== "/admin/configuracion");
const NAV_CONFIG = NAV.filter((i) => i.href === "/admin/configuracion");

/** Breakpoint `lg` (75em) del theme, para saber si el rail está en modo desktop (no drawer). */
const LG_QUERY = "(min-width: 75em)";
/** Persistencia del rail colapsado/expandido entre navegaciones (D3). */
const RAIL_KEY = "sorteatelo:rail-colapsado";

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/** Iniciales para el fallback del Avatar (sin imagen de la sesión). */
function iniciales(nombre?: string | null, email?: string | null): string {
  const base = (nombre ?? "").trim() || (email ?? "").trim();
  if (!base) return "?";
  const partes = base.split(/\s+/);
  if (partes.length >= 2 && partes[0] && partes[1]) {
    return (partes[0][0]! + partes[1][0]!).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

/**
 * Item de navegación del rail tinta (D6). Sobre fondo oscuro el NavLink se re-estila por CSS vars:
 * activo = pill cobalto `filled` con texto blanco; inactivo = texto `gray-4` + hover `dark-6`.
 * Colapsado (icon-only, solo desktop): oculta el body/label y CENTRA el ícono (el body en `display:none`
 * deja al `section` solo, y `justify-content:center` lo centra de verdad), con Tooltip del nombre.
 */
function RailNavLink({
  item,
  active,
  iconOnly,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  iconOnly: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  // Item esbelto estilo Grillos v2 (analizado del código real): NO pill sólido. Activo = tinte
  // SUAVE del cobalto (`sorteatelo-light`, dark-scheme-aware) + **barra de acento de 3px** al
  // borde del rail; inactivo = texto gris tenue; icono fino 17/1.7; texto 13px. `variant="subtle"`
  // (no `filled`) para que Mantine dé el hover suave sin el bloque pesado.
  const nav = (
    <div className="relative mb-0.5">
      {active && (
        <span
          aria-hidden
          className="absolute left-[-8px] top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r"
          style={{ background: "var(--mantine-color-sorteatelo-4)" }}
        />
      )}
      <NavLink
        component={Link}
        href={item.href}
        label={iconOnly ? undefined : item.label}
        aria-label={iconOnly ? item.label : undefined}
        leftSection={<Icon className="size-[17px]" stroke={1.7} />}
        active={active}
        onClick={onNavigate}
        variant="subtle"
        color="sorteatelo"
        styles={{
          root: {
            borderRadius: 8,
            padding: iconOnly ? "8px 0" : "7px 10px",
            justifyContent: iconOnly ? "center" : undefined,
            background: active
              ? "var(--mantine-color-sorteatelo-light)"
              : undefined,
            color: active
              ? "var(--mantine-color-white)"
              : "var(--mantine-color-gray-4)",
          },
          // Colapsado: sin body ⇒ el section (ícono) queda solo y se centra con el justify del root.
          body: iconOnly ? { display: "none" } : undefined,
          section: iconOnly ? { marginInlineEnd: 0 } : undefined,
          label: { fontSize: 13, fontWeight: active ? 600 : 400 },
        }}
      />
    </div>
  );
  return iconOnly ? (
    <Tooltip label={item.label} position="right" withArrow offset={8}>
      {nav}
    </Tooltip>
  ) : (
    nav
  );
}

/**
 * Chrome «Oscuro + calmo» del rail (D6, design.md §4). Con `layout="alt"` el rail ocupa TODA la
 * altura (llega hasta arriba) y el header queda solo sobre el contenido. El rail corona con el
 * wordmark de PLATAFORMA (invertido). El chip de tienda y el toggle colapsar viven en el header.
 * Colapsable: al colapsar, wordmark → isotipo y NavLinks → icon-only centrados con Tooltip.
 */
function NavbarContent({
  pathname,
  onNavigate,
  esOperador,
  iconOnly,
}: {
  pathname: string;
  onNavigate: () => void;
  esOperador: boolean;
  iconOnly: boolean;
}) {
  return (
    <div
      className="flex h-full flex-col"
      data-mantine-color-scheme="dark"
      style={
        {
          color: "var(--mantine-color-gray-4)",
          "--nl-bg": "var(--mantine-color-sorteatelo-filled)",
          "--nl-color": "var(--mantine-color-white)",
          "--nl-hover": "var(--mantine-color-sorteatelo-7)",
        } as CSSProperties
      }
    >
      <div
        className={
          iconOnly
            ? "flex flex-col items-center px-2 pb-3 pt-4"
            : "px-4 pb-3 pt-4"
        }
      >
        {iconOnly ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/favicon.svg"
            alt=""
            aria-hidden
            width={28}
            height={28}
            style={{ display: "block" }}
          />
        ) : (
          // Isologo limpio sobre la tinta: isotipo (que ya carga el color de marca) + nombre en
          // BLANCO PLANO en la display. Sin el resaltado «éa» (pensado para fondos claros, se
          // invisibiliza sobre tinta) ni el pincelazo-sticker. Nombre desde APP_CONFIG (I8).
          <Group gap={10} wrap="nowrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/favicon.svg"
              alt=""
              aria-hidden
              width={26}
              height={26}
              style={{ display: "block", flexShrink: 0 }}
            />
            <Text
              component="span"
              fw={800}
              c="white"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {APP_CONFIG.name}
            </Text>
          </Group>
        )}
      </div>

      <Divider color="dark.5" />

      {/* Navegación principal (operativa): arriba, ocupa el alto disponible. */}
      <div className="flex-1 overflow-y-auto p-2">
        {NAV_PRINCIPAL.map((item) => (
          <RailNavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            iconOnly={iconOnly}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {/* Utilidades ancladas abajo (ajustes / rol), separadas por un divisor — jerarquía tipo
          Grillos (Canales/Equipo/Ajustes al pie). */}
      <div className="p-2">
        <Divider color="dark.5" mb={6} />
        {NAV_CONFIG.map((item) => (
          <RailNavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            iconOnly={iconOnly}
            onNavigate={onNavigate}
          />
        ))}
        {/* Sección del Operador de plataforma: solo visible con el rol (F08/F04). */}
        {esOperador && (
          <RailNavLink
            item={{
              label: "Operador",
              href: "/admin/operador",
              icon: IconShieldLock,
            }}
            active={isActive(pathname, "/admin/operador")}
            iconOnly={iconOnly}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Selector de tienda en el HEADER (D6 revisado): muestra la tienda activa con su swatch de
 * `colorPrimario` (único color-desde-dato del admin, I4). Con UNA sola tienda es un chip estático;
 * con más de una es un `Menu` para cambiar. (El cambio efectivo de tienda —resolver otro tenantId
 * server-side— es feature de multi-tienda post-MVP; acá va la UI del switch.)
 */
function TiendaSwitcher({ tiendas }: { tiendas: TiendaAcceso[] }) {
  const activa = tiendas[0];
  if (!activa) return null;

  const contenido = (
    <Group gap={8} wrap="nowrap">
      <ColorSwatch
        color={activa.colorPrimario ?? "var(--mantine-color-gray-4)"}
        size={12}
        withShadow={false}
      />
      <Text size="sm" fw={500} truncate maw={160}>
        {activa.nombre}
      </Text>
      {tiendas.length > 1 && (
        <IconChevronDown className="size-3.5 opacity-60" stroke={2} />
      )}
    </Group>
  );

  const chip = (
    <Paper
      radius="sm"
      px={10}
      py={6}
      bg="var(--mantine-color-gray-1)"
      withBorder={false}
    >
      {contenido}
    </Paper>
  );

  if (tiendas.length <= 1) return chip;

  return (
    <Menu position="bottom-start" width={240} withArrow shadow="md">
      <Menu.Target>
        <UnstyledButton aria-label="Cambiar de tienda">{chip}</UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Cambiar de tienda</Menu.Label>
        {tiendas.map((t) => (
          <Menu.Item
            key={t.slug}
            leftSection={
              <ColorSwatch
                color={t.colorPrimario ?? "var(--mantine-color-gray-4)"}
                size={12}
                withShadow={false}
              />
            }
          >
            {t.nombre}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

/** Menú de cuenta del header (D6): avatar de la sesión, nombre/email, rol y cerrar sesión. */
function MenuCuenta({ esOperador }: { esOperador: boolean }) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <Menu position="bottom-end" width={248} withArrow shadow="md">
      <Menu.Target>
        <UnstyledButton aria-label="Menú de cuenta">
          <Avatar
            src={user?.image ?? undefined}
            radius="xl"
            size={34}
            color="sorteatelo"
          >
            {iniciales(user?.name, user?.email)}
          </Avatar>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <div className="px-3 py-2">
          <Text size="sm" fw={600} truncate>
            {user?.name ?? "Mi cuenta"}
          </Text>
          {user?.email && (
            <Text size="xs" c="dimmed" truncate>
              {user.email}
            </Text>
          )}
          {esOperador && (
            <Badge
              mt={8}
              size="xs"
              variant="light"
              color="sorteatelo"
              leftSection={<IconShieldLock className="size-3" stroke={2} />}
              styles={{ label: { textTransform: "none" } }}
            >
              Operador de plataforma
            </Badge>
          )}
        </div>
        <Menu.Divider />
        <Menu.Item
          leftSection={<IconLogout2 className="size-4" />}
          onClick={() => void signOut({ callbackUrl: "/login" })}
        >
          Cerrar sesión
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

/**
 * Empty state para un Operador de plataforma SIN Tienda propia (F08): las páginas del
 * Organizador (Resumen/Productos/…) no aplican, pero su superficie es el panel del Operador.
 * Un Organizador nuevo SIN Tienda ve el formulario de alta (`CrearTienda`), no esto.
 */
function SinTiendaOperador() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <ThemeIcon size={48} radius="xl" variant="light" color="gray">
        <IconBuildingStore className="size-6" stroke={1.75} />
      </ThemeIcon>
      <Text mt="md" size="lg" fw={600}>
        No administras una tienda propia
      </Text>
      <Text mt={6} size="sm" c="dimmed" className="max-w-sm">
        Tu cuenta es Operador de plataforma. Supervisa todas las tiendas desde
        el panel del Operador.
      </Text>
      <Button
        component={Link}
        href="/admin/operador"
        mt="xl"
        rightSection={<IconArrowRight className="size-4" />}
      >
        Ir al panel del Operador
      </Button>
    </div>
  );
}

/** Error de carga del acceso (data-fetching-conventions: error + reintentar). */
function ErrorAcceso({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <IconAlertTriangle
        className="size-8"
        stroke={1.75}
        color="var(--mantine-color-red-6)"
      />
      <Text mt="sm" size="sm" c="red" className="max-w-sm">
        No pudimos cargar tu panel. Revisa tu conexión e inténtalo de nuevo.
      </Text>
      <Button mt="md" variant="default" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

interface AdminLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminLayout({
  title,
  description,
  actions,
  children,
}: AdminLayoutProps) {
  const router = useRouter();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [colapsado, setColapsado] = useLocalStorage<boolean>({
    key: RAIL_KEY,
    defaultValue: false,
  });
  const esDesktop = useMediaQuery(LG_QUERY, false);
  const reducir = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  const iconOnly = colapsado && !!esDesktop;

  const acceso = api.panel.getAccesoActual.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  const tiendas = (acceso.data?.tenants ?? []) as TiendaAcceso[];
  const tiendaSlug = tiendas[0]?.slug ?? null;
  const esOperador = acceso.data?.esOperador ?? false;
  const sinTienda =
    acceso.data !== undefined && acceso.data.tenants.length === 0;

  // El botón hamburguesa del header: en desktop colapsa/expande el rail; en móvil abre/cierra el Drawer.
  const onHamburguesa = () =>
    esDesktop ? setColapsado((c) => !c) : toggle();

  // Acciones del Spotlight (Cmd/Ctrl+K, F07): navegación del panel + "Ver mi tienda".
  const spotlightActions: SpotlightActionData[] = [
    ...NAV.map((item) => {
      const Icon = item.icon;
      return {
        id: item.href,
        label: item.label,
        leftSection: <Icon className="size-[18px]" stroke={1.75} />,
        onClick: () => void router.push(item.href),
      };
    }),
    ...(esOperador
      ? [
          {
            id: "/admin/operador",
            label: "Operador",
            description: "Supervisión de todas las tiendas",
            leftSection: (
              <IconShieldLock className="size-[18px]" stroke={1.75} />
            ),
            onClick: () => void router.push("/admin/operador"),
          },
        ]
      : []),
    ...(tiendaSlug
      ? [
          {
            id: "ver-tienda",
            label: "Ver mi tienda",
            description: "Abre tu tienda en una pestaña nueva",
            leftSection: (
              <IconExternalLink className="size-[18px]" stroke={1.75} />
            ),
            onClick: () => abrirTienda(tiendaSlug),
          },
        ]
      : []),
  ];

  return (
    <>
      <Head>
        <title>{`${title} · ${APP_CONFIG.name}`}</title>
        <meta name="description" content={APP_CONFIG.tagline} />
      </Head>

      {/* El panel NO tiene modo oscuro (decisión del usuario): se fuerza `light` en TODO el subtree
          del admin, sin tocar `_app.tsx` (el storefront conserva su dark per-tenant). El rail vuelve a
          `dark` localmente para su superficie tinta. */}
      <div data-mantine-color-scheme="light">
      <AppShell
        // `layout="alt"`: el rail ocupa toda la altura (llega hasta arriba); el header queda solo
        // sobre el contenido, a la derecha del rail.
        layout="alt"
        header={{ height: 64 }}
        navbar={{
          width: iconOnly ? 68 : 232,
          breakpoint: "lg",
          collapsed: { mobile: !opened },
        }}
        padding={{ base: "md", lg: "xl" }}
        withBorder={false}
        transitionDuration={reducir ? 0 : 200}
        transitionTimingFunction="ease"
        styles={{
          main: {
            backgroundColor: "var(--mantine-color-gray-0)",
          },
          navbar: {
            backgroundColor: "var(--mantine-color-black)",
            border: "none",
            transition: reducir
              ? "none"
              : "width 200ms ease, transform 200ms ease",
          },
        }}
      >
        <AppShell.Header>
          <Group h="100%" px={{ base: "md", lg: "xl" }} gap="sm" wrap="nowrap">
            {/* Hamburguesa: colapsa el rail (desktop) o abre el Drawer (móvil). */}
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={onHamburguesa}
              aria-label={
                esDesktop
                  ? colapsado
                    ? "Expandir menú"
                    : "Colapsar menú"
                  : opened
                    ? "Cerrar menú"
                    : "Abrir menú"
              }
            >
              <IconMenu2 className="size-5" stroke={1.75} />
            </ActionIcon>

            {/* En móvil el rail es un Drawer colapsado: la marca se muestra acá. */}
            <Group hiddenFrom="lg" gap={0} wrap="nowrap">
              <Wordmark size={18} />
            </Group>

            {tiendas.length > 0 && (
              <div className="hidden sm:block">
                <TiendaSwitcher tiendas={tiendas} />
              </div>
            )}

            <Group ml="auto" gap="sm" wrap="nowrap">
              <Button
                variant="default"
                size="xs"
                onClick={spotlight.open}
                leftSection={<IconSearch className="size-3.5" />}
                rightSection={<Kbd size="xs">⌘K</Kbd>}
                visibleFrom="sm"
              >
                Buscar
              </Button>
              <ActionIcon
                variant="default"
                onClick={spotlight.open}
                hiddenFrom="sm"
                aria-label="Buscar en el panel"
              >
                <IconSearch className="size-4" />
              </ActionIcon>
              {tiendaSlug && (
                <>
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconExternalLink className="size-3.5" />}
                    onClick={() => abrirTienda(tiendaSlug)}
                    visibleFrom="sm"
                  >
                    Ver mi tienda
                  </Button>
                  <ActionIcon
                    variant="light"
                    onClick={() => abrirTienda(tiendaSlug)}
                    hiddenFrom="sm"
                    aria-label="Ver mi tienda"
                  >
                    <IconExternalLink className="size-4" />
                  </ActionIcon>
                </>
              )}
              <MenuCuenta esOperador={esOperador} />
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar>
          <NavbarContent
            pathname={router.pathname}
            onNavigate={close}
            esOperador={esOperador}
            iconOnly={iconOnly}
          />
        </AppShell.Navbar>

        <AppShell.Main>
          {/* Contenido full-width: sin el cap `max-w-6xl` del chrome anterior (§4). */}
          <div className="w-full">
            {acceso.isLoading ? (
              <Stack gap="md">
                <Skeleton height={32} width={192} />
                <Skeleton height={160} />
              </Stack>
            ) : acceso.isError ? (
              <ErrorAcceso onRetry={() => void acceso.refetch()} />
            ) : sinTienda ? (
              esOperador ? (
                <SinTiendaOperador />
              ) : (
                <CrearTienda />
              )
            ) : (
              <>
                <PageHeader
                  title={title}
                  description={description}
                  actions={actions}
                />
                {children}
              </>
            )}
          </div>
        </AppShell.Main>
      </AppShell>
      </div>

      <Spotlight
        actions={spotlightActions}
        shortcut="mod + K"
        nothingFound="No encontramos esa sección"
        highlightQuery
        searchProps={{
          leftSection: <IconSearch className="size-4" stroke={1.75} />,
          placeholder: "Buscar en el panel…",
        }}
      />
    </>
  );
}
