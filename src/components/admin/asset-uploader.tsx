import { FileInput, Group, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPhoto } from "@tabler/icons-react";
import { useState } from "react";

import {
  ACCEPT_IMAGEN,
  type DestinoImagen,
  useSubirImagenMarca,
} from "~/components/admin/use-subir-imagen";

/**
 * Uploader de un asset de marca cuyo recurso YA existe (logo/hero de la Tienda, premio de un
 * sorteo ya sembrado): sube la imagen apenas se elige el archivo (presigned PUT + confirmación,
 * plantilla-rica F03). Muestra la imagen actual (o un placeholder) y avisa por notificación.
 *
 * Para la PORTADA de un producto NUEVO (que aún no tiene id) NO se usa este componente: la subida
 * se difiere a después de `crearProducto` (ver `productos.tsx`).
 */
export function AssetUploader({
  destino,
  urlActual,
  label,
  description,
  onSubido,
}: {
  destino: DestinoImagen;
  urlActual: string | null;
  label: string;
  description?: string;
  /** Se llama tras subir OK (para invalidar la query que trae `urlActual`). */
  onSubido: () => void | Promise<void>;
}) {
  const { subir, subiendo } = useSubirImagenMarca();
  const [file, setFile] = useState<File | null>(null);

  const onChange = async (elegido: File | null) => {
    setFile(elegido);
    if (!elegido) return;
    try {
      await subir(destino, elegido);
      notifications.show({ message: "Imagen actualizada.", color: "green" });
      await onSubido();
    } catch (e) {
      notifications.show({
        message: e instanceof Error ? e.message : "No se pudo subir la imagen.",
        color: "red",
      });
    } finally {
      setFile(null);
    }
  };

  return (
    <Stack gap="xs">
      <Group gap="md" align="flex-start" wrap="nowrap">
        <VistaPrevia url={urlActual} />
        <FileInput
          className="flex-1"
          label={label}
          description={description}
          placeholder={urlActual ? "Reemplazar imagen…" : "Elegir imagen (PNG, JPG o WebP)"}
          accept={ACCEPT_IMAGEN}
          clearable
          value={file}
          onChange={(f) => void onChange(f)}
          disabled={subiendo}
          leftSection={<IconPhoto className="size-4" />}
        />
      </Group>
    </Stack>
  );
}

/** Miniatura del asset actual, o un placeholder neutro por token del theme si no hay. */
function VistaPrevia({ url }: { url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="Vista previa"
        style={{
          height: 56,
          width: 56,
          objectFit: "cover",
          borderRadius: "var(--mantine-radius-md)",
          border: "1px solid var(--mantine-color-default-border)",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center"
      style={{
        height: 56,
        width: 56,
        borderRadius: "var(--mantine-radius-md)",
        border: "1px dashed var(--mantine-color-default-border)",
        background: "var(--mantine-color-default-hover)",
        flexShrink: 0,
      }}
    >
      <IconPhoto
        className="size-5"
        stroke={1.5}
        color="var(--mantine-color-dimmed)"
      />
    </div>
  );
}

/** Solo la miniatura + un texto auxiliar (para el form de producto, que difiere la subida). */
export function VistaPreviaAsset({ url }: { url: string | null }) {
  return <VistaPrevia url={url} />;
}
