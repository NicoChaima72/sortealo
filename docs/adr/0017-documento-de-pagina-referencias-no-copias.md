# El documento de página guarda referencias al dominio, nunca copias de datos

> **Estado: aceptado** (2026-07-17, visto bueno del usuario). Plan: `tasks/26-07-17-page-builder.md` (carril A). Origen: síntesis D6. Refuerza ADR-0005 (tenancy) y la regla de oro del dinero.

**Decisión:** el documento de la Página de tienda (ADR-0016) referencia las entidades del dominio **por identidad**, jamás por copia. El widget de catálogo curado guarda `{ modo:'todos'|'seleccion', productoIds? }` — nunca título/precio/portada. La vitrina del sorteo referencia el `Raffle` **ACTIVO resuelto server-side**, no un id ni datos congelados. En render, las referencias se resuelven con queries **scoped al tenant** (`findFirst({ where: { id, tenantId } })`, `NOT_FOUND` indistinguible) y lo que no pertenece o está inactivo se descarta en silencio.

Razón — dos invariantes lo obligan:

1. **Dinero**: el precio autoritativo es `Product.precio` (`Decimal`). Un precio copiado en el JSON deriva y miente al Comprador; el documento no puede ser una segunda fuente de verdad comercial.
2. **Tenancy (clase de bug H1, ADR-0005)**: cada `productoId` que entra al documento se valida server-side contra el tenant resuelto en **cada mutación**. Sin esto, un editor LLM (MCP/chat) puede inyectar el ID de otra tienda y filtrar catálogo cruzado.

## Consecuencias

- Toda mutación del documento revalida las referencias contra el tenant; no existe mutación que "confíe" en referencias previas de otro origen.
- El render nunca falla por una referencia muerta: producto borrado/desactivado ⇒ desaparece de la sección (degradación elegante), jamás error ni dato stale.
- Datos derivados del dominio que un widget muestre (conteo de tickets, countdown del sorteo) se computan server-side al renderizar, nunca se persisten en el documento.
