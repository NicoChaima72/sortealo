/**
 * Decisión PURA de si mostrar el banner "Editar mi tienda" (F09/D11/R5, ADR-0019). El banner monta
 * SOLO **post-hidratación** (`montado`) y SOLO si el que mira **puede editar** (`puedeEditar`).
 *
 * La clave del cache público (riesgo R5): en SSR y hasta que el cliente hidrata, `montado` es `false`
 * ⇒ el banner NO existe en el HTML ⇒ el HTML anónimo es IDÉNTICO para todos (con o sin cookie de
 * sesión) ⇒ CDN-cacheable. La sesión no toca el SSR: `puedoEditar` se consulta client-side tras montar.
 */
export function debeMostrarBanner({
  montado,
  puedeEditar,
}: {
  montado: boolean;
  puedeEditar: boolean;
}): boolean {
  return montado && puedeEditar;
}
