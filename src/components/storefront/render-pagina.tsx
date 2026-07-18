import { AvisoBarra } from "~/components/storefront/aviso-barra";
import { CatalogoStorefront } from "~/components/storefront/catalogo";
import { ComoFunciona } from "~/components/storefront/como-funciona";
import { ContadorTickets } from "~/components/storefront/contador-tickets";
import { EmbedSocial } from "~/components/storefront/embed-social";
import { Faq } from "~/components/storefront/faq";
import { Ganadores } from "~/components/storefront/ganadores";
import { SorteoStorefront } from "~/components/storefront/sorteo";
import { StorefrontHero } from "~/components/storefront/storefront-hero";
import { Testimonios } from "~/components/storefront/testimonios";
import { UrgenciaCountdown } from "~/components/storefront/urgencia-countdown";
import { Video } from "~/components/storefront/video";
import { WhatsappFlotante } from "~/components/storefront/whatsapp-flotante";
import {
  type OverlayNode,
  type PageDocument,
  type SeccionNode,
} from "~/lib/pagebuilder/schema";
import { type TenantBranding } from "~/styles/tenantTheme";

/**
 * Render del Documento de Página (F05/F10, ADR-0016). Recorre las secciones en el ORDEN del array y
 * despacha cada una a su componente por un switch EXHAUSTIVO sobre `tipo` (props narrowed por rama).
 * Los OVERLAYS (F10) se separan por posición: `aviso_barra` va ARRIBA del contenido, `whatsapp_flotante`
 * flota como FAB (position:fixed, su lugar en el DOM da igual). Un `tipo` desconocido NO renderiza (I9).
 * El `branding` aporta los fallbacks server-side (nombre/color) que el documento NO copia (I2/I11).
 */
export function RenderPagina({
  secciones,
  overlays,
  branding,
}: {
  secciones: PageDocument["secciones"];
  overlays: PageDocument["overlays"];
  branding: TenantBranding;
}) {
  return (
    <>
      {/* Overlays "arriba" (barra de aviso) antes del flujo vertical. */}
      {overlays
        .filter((o) => o.tipo === "aviso_barra")
        .map((o) => (
          <RenderOverlay key={o.id} overlay={o} />
        ))}

      {secciones.map((seccion) => (
        <RenderSeccion key={seccion.id} seccion={seccion} branding={branding} />
      ))}

      {/* Overlays flotantes (FAB): position:fixed, su posición en el DOM no importa. */}
      {overlays
        .filter((o) => o.tipo === "whatsapp_flotante")
        .map((o) => (
          <RenderOverlay key={o.id} overlay={o} />
        ))}
    </>
  );
}

function RenderSeccion({
  seccion,
  branding,
}: {
  seccion: SeccionNode;
  branding: TenantBranding;
}) {
  switch (seccion.tipo) {
    case "hero":
      return <StorefrontHero props={seccion.props} branding={branding} />;
    case "catalogo":
      return (
        <CatalogoStorefront
          props={seccion.props}
          colorPrimario={branding.colorPrimario}
        />
      );
    case "sorteo_vitrina":
      return (
        <SorteoStorefront
          props={seccion.props}
          colorPrimario={branding.colorPrimario}
        />
      );
    case "como_funciona":
      return <ComoFunciona props={seccion.props} />;
    case "contador_tickets":
      return <ContadorTickets props={seccion.props} />;
    case "urgencia_countdown":
      return <UrgenciaCountdown props={seccion.props} />;
    case "testimonios":
      return <Testimonios props={seccion.props} />;
    case "ganadores":
      return <Ganadores props={seccion.props} />;
    case "faq":
      return <Faq props={seccion.props} />;
    case "video":
      return <Video props={seccion.props} />;
    case "embed_social":
      return <EmbedSocial props={seccion.props} />;
    default: {
      // Candado de exhaustividad EN COMPILACIÓN (F10/F11 no pueden olvidar una rama) + tolerancia I9
      // en runtime (un `tipo` desconocido de un documento publicado viejo renderiza `null`, no crashea).
      const _exhaustivo: never = seccion;
      void _exhaustivo;
      return null;
    }
  }
}

function RenderOverlay({ overlay }: { overlay: OverlayNode }) {
  switch (overlay.tipo) {
    case "aviso_barra":
      return <AvisoBarra props={overlay.props} />;
    case "whatsapp_flotante":
      return <WhatsappFlotante props={overlay.props} />;
    default: {
      const _exhaustivo: never = overlay;
      void _exhaustivo;
      return null;
    }
  }
}
