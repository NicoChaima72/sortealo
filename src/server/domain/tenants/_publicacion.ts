import { type TenantStatus } from "@prisma/client";

/**
 * Núcleo PURO del gate de publicación (F08/F03, D4/D5, ADR-0008). Es la ÚNICA fuente de verdad
 * de los requisitos para publicar una Tienda, y la comparten (por construcción, no por
 * disciplina) el checklist del panel (`getEstadoPublicacion`) y el gate real recomputado
 * server-side dentro de `publicarTienda` (I2: la transición a PUBLICADA jamás confía en un
 * `puedePublicar` del cliente). Sin DB ni sesión: el caller carga los datos y este módulo decide.
 */

/** Un requisito del checklist: si está cumplido (y, en el caso de bases, si aplica). */
export interface Requisito {
  cumplido: boolean;
}

export interface RequisitosPublicacion {
  /** Términos de Servicio aceptados en la versión vigente (ADR-0008). */
  tos: Requisito;
  /** Credenciales Flow cargadas (BYO-Flow, ADR-0006). */
  flow: Requisito;
  /** ≥1 Product `activo` con `pdfPath` (publicable = entregable, I9/D5). */
  producto: Requisito;
  /** Bases del sorteo: solo `aplica` si hay un Raffle ACTIVO (ADR-0008). */
  bases: Requisito & { aplica: boolean };
}

export interface EstadoPublicacion {
  estado: TenantStatus;
  requisitos: RequisitosPublicacion;
  /** Todos los requisitos aplicables cumplidos. Recomputado server-side; nunca del cliente (I2). */
  puedePublicar: boolean;
}

/**
 * Datos crudos que el gate necesita, cargados por el caller (getEstadoPublicacion desde `db`,
 * publicarTienda desde la `tx`). Mantener este shape chico y explícito acopla el núcleo puro a
 * DATOS, no a Prisma.
 */
export interface DatosGate {
  estado: TenantStatus;
  /** Última versión de ToS aceptada por el tenant (`Tenant.tosVersion`), o null. */
  tosVersion: string | null;
  /** Versión de ToS vigente de la plataforma (`TOS_VERSION`). */
  tosVersionVigente: string;
  flowConfigurada: boolean;
  tieneProductoPublicable: boolean;
  hayRaffleActivo: boolean;
  basesSorteo: string | null;
}

/** `true` sii el texto tiene contenido real (no null, no solo espacios). */
function tieneTexto(v: string | null): boolean {
  return (v?.trim().length ?? 0) > 0;
}

/**
 * Evalúa los requisitos de publicación y si la Tienda puede publicarse. El requisito de bases
 * SOLO aplica si hay un Raffle ACTIVO (sin sorteo activo no se exige, D5); cuando no aplica,
 * `cumplido` es `true` para no bloquear el gate.
 */
export function evaluarPublicacion(d: DatosGate): EstadoPublicacion {
  const tos: Requisito = {
    cumplido: d.tosVersion !== null && d.tosVersion === d.tosVersionVigente,
  };
  const flow: Requisito = { cumplido: d.flowConfigurada };
  const producto: Requisito = { cumplido: d.tieneProductoPublicable };

  const basesAplica = d.hayRaffleActivo;
  const bases = {
    aplica: basesAplica,
    cumplido: !basesAplica || tieneTexto(d.basesSorteo),
  };

  const puedePublicar =
    tos.cumplido && flow.cumplido && producto.cumplido && bases.cumplido;

  return { estado: d.estado, requisitos: { tos, flow, producto, bases }, puedePublicar };
}

/**
 * Mensaje humano del PRIMER requisito no cumplido (para el error de `publicarTienda` cuando el
 * gate no pasa). Devuelve `null` si todo está cumplido. El orden espeja el del checklist.
 */
export function mensajeRequisitoFaltante(
  r: RequisitosPublicacion,
): string | null {
  if (!r.tos.cumplido) {
    return "Antes de publicar debes aceptar los Términos de Servicio.";
  }
  if (!r.flow.cumplido) {
    return "Antes de publicar debes conectar tu cuenta de Flow para cobrar.";
  }
  if (!r.producto.cumplido) {
    return "Antes de publicar necesitas al menos un producto activo con su PDF subido.";
  }
  if (r.bases.aplica && !r.bases.cumplido) {
    return "Tu sorteo está activo: antes de publicar debes cargar las bases del sorteo.";
  }
  return null;
}
