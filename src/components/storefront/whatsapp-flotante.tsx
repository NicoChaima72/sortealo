import { ActionIcon } from "@mantine/core";
import { IconBrandWhatsapp } from "@tabler/icons-react";

import { type WhatsappFlotanteProps } from "~/lib/pagebuilder/widgets";

/**
 * `whatsapp_flotante` (overlay, F10): botón flotante (FAB) a WhatsApp. Sin `numero` (E.164) ⇒ oculto
 * (§3). El link se arma con `wa.me/<solo-dígitos>` + mensaje prellenado opcional. Color de MARCA del
 * tenant (default), no verde crudo — evita la semántica financiera del verde (design.md §5).
 */
export function WhatsappFlotante({ props }: { props: WhatsappFlotanteProps }) {
  if (!props.numero) return null; // sin número ⇒ oculto

  const soloDigitos = props.numero.replace(/\D/g, "");
  const query = props.mensajePredefinido
    ? `?text=${encodeURIComponent(props.mensajePredefinido)}`
    : "";
  const href = `https://wa.me/${soloDigitos}${query}`;
  const lado = props.posicion === "bl" ? { left: 20 } : { right: 20 };

  return (
    <ActionIcon
      component="a"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Escríbenos por WhatsApp"
      variant="filled"
      size={54}
      radius="xl"
      style={{ position: "fixed", bottom: 20, zIndex: 300, ...lado }}
    >
      <IconBrandWhatsapp className="size-7" stroke={1.75} />
    </ActionIcon>
  );
}
