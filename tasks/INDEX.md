# INDEX de tareas

Índice autoritativo de qué está activo. Lo mantienen los agentes del tridente
(`planner` appendea al crear el task file; `feature-tester` mueve a Cerradas al cerrar).
Una fila = una línea corta. El detalle vive en la **Bitácora** de cada `tasks/<slug>.md`.

## Activas

| slug | agente / estado |
|------|-----------------|
| saas-roadmap | implementing — F01 DONE (validada 82/82 + E2E D1 verde, commit 6d5a766). F02 y F05 en planning paralelo (task files propios). Siguientes bloqueos externos: identidad visual (F06), decisiones #3/#4/#5/#6. |

## En pausa

| slug | razón |
|------|-------|

## Cerradas recientes

| slug | cierre |
|------|--------|
| mvp-roadmap | superseded 2026-07-16 por pivote SaaS → `26-07-16-saas-roadmap.md` (trabajo parcial F01 se rescata en la Fase 1 nueva, ver S8) |
| auth-admin-google | superseded 2026-07-16 por pivote SaaS → `26-07-16-saas-roadmap.md` F05 (se rescatan OAuth/authPolicy/guard; muere la allowlist mono-usuario) |
| efectos-post-pago | superseded 2026-07-16 por pivote SaaS → `26-07-16-saas-roadmap.md` F02 (contrato del hook post-pago sigue válido, re-scopeado por tenant) |
