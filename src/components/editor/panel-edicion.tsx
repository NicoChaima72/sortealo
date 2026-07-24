import {
  ActionIcon,
  Box,
  Group,
  Select,
  Stack,
  Switch,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useState } from "react";

import { FormProps } from "~/components/editor/form-props";
import { PickerImagen } from "~/components/editor/picker-imagen";
import { useAutoGuardado } from "~/components/editor/use-auto-guardado";
import { type SeccionNode } from "~/lib/pagebuilder/schema";
import {
  ALINEAR_VERTICAL,
  ALTO_MIN,
  ANCHO_FONDO,
  ANCHO_SECCION,
  ALTURA_DIVISOR,
  DIRECCIONES_BICOLOR,
  ESPACIADO_V,
  ESQUEMAS_FONDO,
  FORMAS_DIVISOR_DIBUJADAS,
  GRADIENTES,
  MEZCLAS_BICOLOR,
  PRESETS_ENTRADA,
  TONOS_FONDO,
  WIDGET_META,
  WIDGET_REGISTRY,
  type EstiloSeccion,
} from "~/lib/pagebuilder/widgets";
import { type MutacionPagina } from "~/server/domain/pagebuilder/schemas";

type Obj = Record<string, unknown>;
type NavEnvelope = NonNullable<SeccionNode["nav"]>;

/**
 * Panel de EDICIÓN de una sección (catálogo-v2 F10): dos pestañas — "Contenido" (form de props generado
 * desde el `propsSchema` del registro, D8) y "Estilo" (fondo/spacing/ancho/divisor/entrada como selects,
 * D2). Cada "Guardar" emite una mutación (`update_section_props` / `set_section_style`) que el use case
 * REVALIDA server-side (I3/I-I). Cero validación de borde acá.
 */
export function PanelEdicion({
  slug,
  nodo,
  onVolver,
  onAplicar,
}: {
  slug: string;
  nodo: SeccionNode;
  onVolver: () => void;
  onAplicar: (mutacion: MutacionPagina) => void;
}) {
  const meta = WIDGET_META[nodo.tipo];
  const propsSchema = WIDGET_REGISTRY[nodo.tipo].propsSchema;
  const [props, setProps] = useState<Obj>({ ...nodo.props });
  const [estilo, setEstilo] = useState<EstiloSeccion | undefined>(nodo.estilo);
  const [nav, setNav] = useState<NavEnvelope | undefined>(nodo.nav);

  // Auto-guardado on-change (F10/D14): sin botones "Guardar" — cada cambio del form emite su mutación con
  // debounce ~500ms sobre el lock optimista. El indicador Guardando…/Guardado vive en la barra del editor.
  useAutoGuardado(props, (p) => onAplicar({ accion: "update_section_props", id: nodo.id, props: p }));
  useAutoGuardado(estilo, (e) =>
    onAplicar({ accion: "set_section_style", id: nodo.id, estilo: (e ?? {}) as Obj }),
  );

  // El nav vive en el ENVELOPE (F05/D8): se aplica al toggle/blur con `set_section_nav` (no pasa por
  // los botones Guardar de contenido/estilo). `null` limpia el campo.
  const aplicarNav = (siguiente: NavEnvelope | undefined) => {
    setNav(siguiente);
    onAplicar({ accion: "set_section_nav", id: nodo.id, nav: siguiente ?? null });
  };

  return (
    <Stack gap="sm" p="md">
      <Group gap="xs" wrap="nowrap">
        <ActionIcon variant="subtle" onClick={onVolver} aria-label="Volver a la lista">
          <IconArrowLeft className="size-4" />
        </ActionIcon>
        <div style={{ minWidth: 0 }}>
          <Text fw={600} truncate>{meta.titulo}</Text>
          <Text size="xs" c="dimmed" truncate>{meta.descripcion}</Text>
        </div>
      </Group>

      {/* Nav del header (F05/D8): incluir esta sección en el menú + etiqueta opcional. */}
      <Box
        p="xs"
        style={{
          border: "1px solid var(--mantine-color-default-border)",
          borderRadius: "var(--mantine-radius-sm)",
        }}
      >
        <Switch
          label="Mostrar en el menú"
          checked={!!nav?.incluir}
          onChange={(e) =>
            aplicarNav(e.currentTarget.checked ? { incluir: true, etiqueta: nav?.etiqueta } : undefined)
          }
        />
        {nav?.incluir && (
          <TextInput
            mt="xs"
            label="Etiqueta del menú"
            placeholder="(por defecto según el tipo)"
            maxLength={20}
            defaultValue={nav.etiqueta ?? ""}
            onBlur={(e) =>
              aplicarNav({ incluir: true, etiqueta: e.currentTarget.value.trim() || undefined })
            }
          />
        )}
      </Box>

      <Tabs defaultValue="contenido">
        <Tabs.List grow>
          <Tabs.Tab value="contenido">Contenido</Tabs.Tab>
          <Tabs.Tab value="estilo">Estilo</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="contenido" pt="sm">
          <Stack gap="md">
            <FormProps propsSchema={propsSchema} valor={props} onChange={setProps} slug={slug} />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="estilo" pt="sm">
          <Stack gap="md">
            <PanelEstilo slug={slug} estilo={estilo} onChange={setEstilo} />
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

/** Selects del `estiloSeccion` (fondo/spacing/ancho/divisor/entrada). Los enums salen de `widgets.ts`. */
function PanelEstilo({
  slug,
  estilo,
  onChange,
}: {
  slug: string;
  estilo: EstiloSeccion | undefined;
  onChange: (e: EstiloSeccion) => void;
}) {
  // Borrador de estilo en edición (parcial: aún sin defaults; el use case revalida server-side, I3).
  const e: Partial<EstiloSeccion> = estilo ?? {};
  const setCampo = (campo: string, valor: unknown) => onChange({ ...(estilo ?? {}), [campo]: valor } as EstiloSeccion);

  // Fondo: elegimos el TIPO y su valor. "heredar" ⇒ sin fondo (transparente). El fondo es una unión
  // discriminada; lo leemos con forma laxa solo para sembrar los selects (el borde real es el schema).
  const fondo = e.fondo as
    | {
        tipo?: string;
        esquema?: string;
        preset?: string;
        url?: string;
        colorA?: string;
        colorB?: string;
        direccion?: string;
        mezcla?: string;
      }
    | undefined;
  const tipoFondo = fondo?.tipo ?? "heredar";

  const setFondo = (tipo: string) => {
    if (tipo === "heredar") return setCampo("fondo", undefined);
    if (tipo === "esquema") return setCampo("fondo", { tipo: "esquema", esquema: "superficie" });
    if (tipo === "gradiente") return setCampo("fondo", { tipo: "gradiente", preset: "marca_vivo" });
    if (tipo === "bicolor")
      return setCampo("fondo", {
        tipo: "bicolor",
        colorA: "marca",
        colorB: "acento",
        direccion: "vertical",
        mezcla: "dura",
      });
    if (tipo === "imagen") return setCampo("fondo", { tipo: "imagen", url: "" });
  };

  return (
    <Stack gap="sm">
      <Select
        label="Tipo de fondo"
        data={[
          { value: "heredar", label: "Heredar (transparente)" },
          { value: "esquema", label: "Color" },
          { value: "gradiente", label: "Degradado" },
          { value: "bicolor", label: "Bicolor" },
          { value: "imagen", label: "Imagen" },
        ]}
        value={tipoFondo}
        onChange={(v) => v && setFondo(v)}
      />
      {tipoFondo === "esquema" && (
        <Select
          label="Color de fondo"
          data={ESQUEMAS_FONDO.map((o) => ({ value: o, label: o }))}
          value={fondo?.esquema ?? "superficie"}
          onChange={(v) => v && setCampo("fondo", { tipo: "esquema", esquema: v })}
        />
      )}
      {tipoFondo === "gradiente" && (
        <Select
          label="Degradado"
          data={GRADIENTES.map((o) => ({ value: o, label: o }))}
          value={fondo?.preset ?? "marca_vivo"}
          onChange={(v) => v && setCampo("fondo", { tipo: "gradiente", preset: v })}
        />
      )}
      {tipoFondo === "bicolor" && (
        <>
          <Select
            label="Color A (arriba/izquierda)"
            description="Empareja el color del texto"
            data={TONOS_FONDO.map((o) => ({ value: o, label: o }))}
            value={fondo?.colorA ?? "marca"}
            onChange={(v) => v && setCampo("fondo", { ...fondo, tipo: "bicolor", colorA: v })}
          />
          <Select
            label="Color B (abajo/derecha)"
            data={TONOS_FONDO.map((o) => ({ value: o, label: o }))}
            value={fondo?.colorB ?? "acento"}
            onChange={(v) => v && setCampo("fondo", { ...fondo, tipo: "bicolor", colorB: v })}
          />
          <Select
            label="Dirección"
            data={DIRECCIONES_BICOLOR.map((o) => ({ value: o, label: o }))}
            value={fondo?.direccion ?? "vertical"}
            onChange={(v) => v && setCampo("fondo", { ...fondo, tipo: "bicolor", direccion: v })}
          />
          <Select
            label="Mezcla"
            data={MEZCLAS_BICOLOR.map((o) => ({ value: o, label: o }))}
            value={fondo?.mezcla ?? "dura"}
            onChange={(v) => v && setCampo("fondo", { ...fondo, tipo: "bicolor", mezcla: v })}
          />
        </>
      )}
      {tipoFondo === "imagen" && (
        <PickerImagen
          slug={slug}
          label="Imagen de fondo"
          valor={fondo?.url ?? ""}
          onChange={(url) => setCampo("fondo", { tipo: "imagen", url })}
        />
      )}

      <Select
        label="Espaciado vertical"
        data={ESPACIADO_V.map((o) => ({ value: o, label: o }))}
        value={e.padY ?? "l"}
        onChange={(v) => v && setCampo("padY", v)}
      />
      <Select
        label="Ancho del contenido"
        data={ANCHO_SECCION.map((o) => ({ value: o, label: o }))}
        value={e.ancho ?? "contenido"}
        onChange={(v) => v && setCampo("ancho", v)}
      />
      <Select
        label="Ancho del fondo"
        description="Completo = de borde a borde; Contenido = fondo acotado con esquinas redondeadas"
        data={ANCHO_FONDO.map((o) => ({ value: o, label: o }))}
        value={e.anchoFondo ?? "completo"}
        onChange={(v) => v && setCampo("anchoFondo", v)}
      />
      <Select
        label="Alto mínimo"
        description="Pantalla = ocupa toda la ventana (svh); Media = media ventana; Auto = según el contenido"
        data={ALTO_MIN.map((o) => ({ value: o, label: o }))}
        value={e.altoMin ?? "auto"}
        onChange={(v) => v && setCampo("altoMin", v)}
      />
      {e.altoMin && e.altoMin !== "auto" && (
        <Select
          label="Alineación vertical"
          data={ALINEAR_VERTICAL.map((o) => ({ value: o, label: o }))}
          value={e.alinearVertical ?? "arriba"}
          onChange={(v) => v && setCampo("alinearVertical", v)}
        />
      )}
      <Select
        label="Animación de entrada"
        data={PRESETS_ENTRADA.map((o) => ({ value: o, label: o }))}
        value={e.entrada ?? "heredar"}
        onChange={(v) => v && setCampo("entrada", v)}
      />
      <Select
        label="Divisor inferior"
        data={FORMAS_DIVISOR_DIBUJADAS.map((o) => ({ value: o, label: o }))}
        value={e.divisorInferior?.forma ?? "ninguno"}
        onChange={(v) =>
          setCampo("divisorInferior", v && v !== "ninguno" ? { forma: v, altura: e.divisorInferior?.altura ?? "m" } : undefined)
        }
      />
      {e.divisorInferior?.forma && e.divisorInferior.forma !== "ninguno" && (
        <Select
          label="Altura del divisor"
          data={ALTURA_DIVISOR.map((o) => ({ value: o, label: o }))}
          value={e.divisorInferior?.altura ?? "m"}
          onChange={(v) => v && setCampo("divisorInferior", { ...e.divisorInferior, altura: v })}
        />
      )}
    </Stack>
  );
}
