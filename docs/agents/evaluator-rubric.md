# Evaluator rubric

Rúbrica compartida por los subagentes `*-reviewer` y `schema-guardian` para emitir veredictos estructurados. Niveles A (excelente) / B (aceptable) / C (necesita ajuste) / D (rechazado).

Cada reviewer aplica las dimensiones relevantes a su área + sus reglas específicas (`backend-conventions.md`, `frontend-conventions.md`, `prisma-conventions.md`). Esta rúbrica define **cómo se reporta**, no qué se evalúa exhaustivamente.

## Dimensiones

### 1. Corrección del comportamiento

¿El código cumple lo que dice el `tasks/<slug>.md` o la feature pedida?

- **A** — Cumple todos los checkboxes de la sección "Validaciones" del plan, sin regresiones detectables.
- **B** — Cumple con 1-2 ajustes menores (typos, naming local, comentarios faltantes).
- **C** — Cumple parcialmente; falta una capa de validación o un edge case crítico.
- **D** — No cumple; comportamiento divergente o tests rotos.

### 2. Compliance arquitectónico

¿Respeta los ADRs aplicables (`docs/adr/`) y la separación de capas?

- **A** — Respeta todos los ADRs relevantes (citados en `related_adrs` del plan). Cliente no importa código del server; Prisma solo via `src/server/db.ts`.
- **B** — Respeta pero hay un olvido menor (eg. no agregó router a `root.ts` y se nota; falta `select` y usa `include`).
- **C** — Viola un ADR de manera no intencional. Requiere fix.
- **D** — Viola múltiples ADRs o un ADR central (eg. instancia PrismaClient propio, cliente importa código del server).

### 3. Naming y estructura

¿Sigue las convenciones del repo y de la capa tocada?

- **A** — Naming consistente con sibling files. Imports con alias `~/*`. Estructura de directorios respetada.
- **B** — 1-2 desvíos menores (eg. naming local fuera de patrón pero entendible).
- **C** — Viola convención en archivo central (eg. componente que rompe el patrón de la carpeta entera).
- **D** — Estructura caótica que confunde al lector.

### 4. Tests

¿Hay tests adecuados a la capa modificada?

- **A** — Vitest integration completo (cubre happy + edges). Si toca UI, también hay items E2E en `tasks/e2e-*.md`. Smoke incluidos si aplica.
- **B** — Vitest completo. E2E declarado pero pendiente con razón explícita en la Bitácora del plan.
- **C** — Vitest parcial (falta cubrir branches importantes).
- **D** — Sin tests donde claramente hacen falta.

### 5. Documentación

¿La doc adyacente se actualizó si el cambio lo amerita?

- **A** — `CONTEXT.md` actualizado si se introdujo vocabulario (via domain-planner). ADR creado si la decisión es load-bearing. Conventions actualizadas si nació un patrón nuevo.
- **B** — Doc adyacente sin actualizar pero el cambio no es estructural (no es crítico).
- **C** — Doc desincronizada con el código (lector se confunde leyendo doc + código juntos).
- **D** — Sin doc donde hace falta. Cambio estructural sin ADR.

## Output del reviewer

Cada reviewer emite una tabla con las dimensiones que le correspondan + sus hallazgos específicos. Plantilla mínima:

```markdown
## Veredicto

| Dim | Nivel | Nota |
|-----|-------|------|
| 1. Corrección | A | F01 y F02 verdes en Vitest. E2E F02 pendiente. |
| 2. Compliance | A | — |
| 3. Naming | B | `tokenStore` debería ser `TokenStore` (constante de paquete). |
| 4. Tests | A | — |
| 5. Documentación | B | Falta sugerir término nuevo en CONTEXT.md. No bloquea. |

**Veredicto global**: APPROVE
```

## Veredicto global

- **APPROVE** — todas las dimensiones A o B.
- **REQUEST_CHANGES** — alguna dimensión C o D. Listar fixes específicos.
- **REJECT** — múltiples D, o D en dimensión 1 o 2. Requiere replantear, no patchear.

## Cómo se usa esta rúbrica

- Cada `*-reviewer` aplica **solo las dimensiones relevantes a su scope** (eg. `frontend-reviewer` ignora dimensión 2 de ADRs si no toca arquitectura, pero sí evalúa 3 y 4).
- El `change-set-reviewer` evalúa las 5 dimensiones a nivel de change-set completo, integrando los reportes de los reviewers específicos.
- El veredicto se cita en la **Bitácora** del `tasks/<slug>.md`.

## Evolución

Esta rúbrica es seed. Si una review repetidamente choca con una dimensión que no cubre bien, ajustar acá. Los reviewers la leen en cada invocación.
