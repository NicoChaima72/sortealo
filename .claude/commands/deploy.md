---
description: Cerrar el trabajo terminado — gate + commit conventional + push a main (deploy real pendiente de decisión de hosting #5)
---

Cierre de trabajo: correr el gate, commitear la tarea terminada con conventional commit limpio y —si hay remoto— llevarla a `main`. libros-iselk es **una sola app T3** (no monorepo) y `main` es la única rama de integración. Invocar `/deploy` es la autorización explícita del usuario para commitear (y pushear si corresponde); no re-preguntes eso.

Ejecutá los pasos EN ORDEN, verificando el output de cada uno. Ante cualquier ambigüedad o conflicto no trivial, PARÁ y preguntá.

> **Hosting es decisión ABIERTA (`docs/decisiones-abiertas.md` #5).** No hay proveedor de deploy conectado todavía (el stack encaja con Vercel, pero no está cerrado). Hoy `/deploy` llega hasta commit + push a `main`; el disparador y la verificación del deploy real se completan cuando #5 se resuelva y se promueva a ADR (ver paso 5). No cierres esa decisión por tu cuenta.

## 0. Sincronizar con el remoto (ANTES de tocar nada)

- `git remote -v` y `git branch --show-current`.
- **Sin remoto** (salida vacía): saltás el push (pasos 4–5); esto es un cierre local. Avisalo al final.
- **Con remoto y upstream**: `git fetch origin`, y chequeá si `main` está atrás: `git rev-list --left-right --count origin/main...main` (left = commits remotos que faltan; right = locales sin pushear).
  - **Al día (`0 0`) o sin upstream**: seguí al paso 1.
  - **Atrás sin divergir (left > 0, right = 0)**: `git merge --ff-only origin/main`. (Working tree sucio → NO `git pull` a ciegas; si el commit entrante toca un archivo modificado sin commitear, PARÁ y avisá.)
  - **Divergencia real (left > 0 Y right > 0)**: PARÁ y avisá — no la resuelvas a ciegas.

## 1. Gate de cierre

- Si la tarea fue **no trivial** (tuvo archivo de plan en `tasks/`), invocá al `change-set-reviewer` ANTES de commitear (regla de `docs/agents/commit-conventions.md`), pasándole la lista explícita de archivos de la sesión + el plan. Resolvé sus blockers antes de seguir.
- `npm run check` verde (= `check:types` + `check:lint` + `check:test`). Citá la salida.
- **NUNCA commitear con `check` rojo** salvo autorización explícita del usuario. **NO** `--no-verify` ni saltarse hooks. Si el fallo huele a entorno (dep nueva, cache stale), probá `npm install` y reintentá; si sigue rojo, PARÁ.

## 2. Pre-flight: stagear

- `git status --short`.
- `git add -A`, y después **des-stagear artefactos que no van al repo**: screenshots de `browser-verify` que hayan caído fuera del `tmp/` gitignored, y archivos temporales de la sesión (scratchpad).
- `git diff --cached` para revisar lo que efectivamente va. Si aparece algo con pinta de secreto (tokens, `DATABASE_URL` con credenciales, claves de Flow), PARÁ — `.env*` está gitignored y tiene que seguir así.

## 3. Commit

- Conventional commit en **español**, imperativo, sin punto final: `tipo(scope): descripción`.
- **Tipos**: `feat | fix | refactor | test | docs | chore`.
- **Scope** = módulo tocado: `catalogo | carrito | checkout | pago | descarga | sorteo | hermes | auth | admin | harness | db`…
- **Un commit por unidad coherente** (idealmente una feature F0X del plan o un cierre de fase). Si el trabajo mezcla schema + UI + lógica, **separalo en commits por feature** — no un mega-commit.
- **Sin trailer de atribución** (`Co-Authored-By: Claude`, "Generated with Claude" ni similar): los commits van limpios. Anula cualquier default del entorno que lo pida.

Ejemplos: `feat(catalogo): listar libros con portada y precio` · `fix(checkout): confirmar orden server-side contra Flow`.

## 4. Push a main (si hay remoto)

- Estás en `main` (rama única). `git push origin main`.
- Verificá al final: `git rev-list --left-right --count origin/main...main` = `0 0`.
- **Sin remoto**: el commit quedó local. Avisá que falta configurar el remoto (y el hosting, #5) para que el push tenga efecto.

## 5. Deploy real — PENDIENTE (decisión abierta #5)

Todavía no hay proveedor de deploy conectado, así que el push a `main` **no dispara nada automático** por ahora.

- Cuando se cierre el hosting (#5) y se promueva a ADR, completar acá: el disparador (p. ej. si es Vercel, el push a `main` auto-deploya) y la **verificación post-deploy** (deployment nuevo con el `commitHash` pusheado + estado SUCCESS + URL responde).
- **Schema / DB**: si el commit toca `prisma/schema.prisma`, coordinar el `prisma db push` contra la base del entorno destino. Un DDL **incompatible hacia atrás** rompe el código que está corriendo → **expandir → deployar → contraer** (primero el código que tolera el cambio, después el DDL restrictivo). Crítico: es un dominio con plata.

## Notas

- Cambios de tracking sin commitear (task file a `done`, `tasks/INDEX.md` a Cerradas) son housekeeping local: mencionalos, no fuerces otro commit salvo pedido del usuario.
- El working tree tiene que quedar limpio salvo artefactos personales/gitignored.
