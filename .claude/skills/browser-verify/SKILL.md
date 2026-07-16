---
name: browser-verify
description: Maneja un navegador real para verificar flujos UI/E2E en libros-iselk. Dos carriles — Playwright MCP (default) y chrome-devtools MCP; si uno está ocupado usá el otro, y solo cuando los dos están ocupados reportá qué los tiene y ofrecé claude-in-chrome. Usala cuando necesites navegar la app, screenshotear, leer DOM/consola/red, o ejercer un flujo (catálogo, carrito, checkout, descarga, panel admin, Hermes) — para la sesión principal y para el feature-tester. Cubre prioridad de drivers, contención entre agentes paralelos (usá el carril libre, nunca le robes el navegador a otro agente), screenshots en el tmp/ gitignored, nunca cerrar el navegador, las convenciones del dev server / login, y recuperación de locks.
---

# Verificar en el navegador (libros-iselk)

Cómo manejar un navegador real en libros-iselk para verificación visual/E2E. Aplica a la sesión principal y al `feature-tester`. Es la disciplina operativa transversal para trabajo de navegador.

## 0. Elegí el driver

Dos carriles primarios — **Playwright MCP** (default) y **chrome-devtools MCP**. Son navegadores independientes, así que dos agentes en paralelo pueden testear a la vez, uno por carril.

1. **Playwright MCP** (`mcp__playwright__browser_*`) — **DEFAULT**. Trae su propio navegador, navega por HTTP plano, lee el DOM/SVG vía `browser_evaluate`/`browser_snapshot`.
2. **chrome-devtools MCP** (`mcp__chrome-devtools__*`) — co-primario. Usalo cuando Playwright está ocupado/ausente, o cuando necesitás inspección a nivel CDP (perf traces, network, heap). **El `feature-tester` viene cableado con este carril** (sus tools son `mcp__chrome-devtools__*`) — ese es su carril por default; la sesión principal arranca con Playwright.

**Contención entre agentes paralelos.** Si corrés varios agentes a la vez (forks / worktrees), un carril está **ocupado** cuando navegar devuelve un error de profile-lock (Playwright: `Browser is already in use for ...mcp-chrome-<id>`). Ocupado ≠ stale — otro agente puede estar testeando.

- **Un carril ocupado → tomá el OTRO carril.** Nunca cierres ni mates el ocupado para apropiártelo — eso le arranca el navegador a un agente que está trabajando.
- **Los dos ocupados → PARÁ, no eches a nadie.** Reportale al usuario qué carril está ocupado y *con qué*:
  ```powershell
  Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" |
    Select-Object ProcessId, CommandLine    # --user-data-dir / mcp-chrome-<id> revelan quién lo tiene
  ```
  Después ofrecé **claude-in-chrome** como el único carril no-disruptivo: se engancha al Chrome existente del usuario vía la extensión, esquivando ambos locks de los MCP en vez de pelear con ellos (menos confiable: render en blanco / JS stale — es el compromiso, no un co-igual). Dejá que el usuario elija qué carril liberar.

Si las tools de navegador MCP están **deferred**, cargá todas las que esperes usar en **UNA** llamada a ToolSearch (el query `select:` toma una lista separada por comas). No las cargues de a una. Set base para Playwright:

```
ToolSearch select:mcp__playwright__browser_navigate,mcp__playwright__browser_snapshot,mcp__playwright__browser_evaluate,mcp__playwright__browser_take_screenshot,mcp__playwright__browser_click,mcp__playwright__browser_wait_for,mcp__playwright__browser_type,mcp__playwright__browser_network_requests,mcp__playwright__browser_console_messages
```

## 1. NUNCA cierres el navegador — ni entre checks, ni al terminar

**No** llames a `browser_close`: ni entre checks/rondas, ni como "limpieza" cuando termina tu tarea. Dejá la tab abierta y re-navegá la próxima vez.

Dos razones:
- Cerrar deja un **profile-lock stale** → tu siguiente `browser_navigate` falla con `Browser is already in use for ...mcp-chrome-<id>, use --isolated`.
- Un agente paralelo puede estar testeando en ese navegador. Cerrarlo le arranca la sesión. Si tu carril está tomado, cambiá de carril (§0); nunca lo reclames.

## 2. Screenshots y artefactos → `tmp/` (gitignored), NUNCA la raíz del repo

- `browser_take_screenshot` → pasá siempre `filename: "tmp/<name>.png"`. `tmp/` está gitignored. **Nunca** tires un `.png` en la raíz del repo (ensucian `git status`).
- Playwright MCP auto-guarda snapshots/logs en `.playwright-mcp/` (gitignored) — dejalos.
- Para inspeccionar refs sin reventar el contexto: `browser_snapshot filename: "tmp/snap.yml"` y después grepeá ese archivo por el ref que necesitás (los snapshots completos pueden exceder el cap de tokens).
- No acumules docenas de `tmp/*.png`; igual `tmp/` nunca llega a git.

## 3. Dev server: uno solo, puerto 3000, HTTP plano

libros-iselk corre **un solo** dev server. `npm run dev` levanta Next.js en `http://localhost:3000` — sin SSL proxy. Tras el pivote SaaS (ADR-0007) la app es **multi-tenant por subdominio**: en dev, `http://<slug>.localhost:3000` = storefront del tenant `<slug>` (los browsers resuelven `*.localhost` sin DNS) y `http://localhost:3000` (apex) = zona plataforma / panel. Los slugs de prueba salen de los seeds (`scripts/`).

- **Confirmá que el server está arriba** antes de confiar:
  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "down"
  ```
  `200` / `307` (redirect a login del admin) / `401` → arriba. `down` / connection refused → no está arriba.
- **El server es del usuario.** No lo mates si no lo arrancaste vos. Si está abajo, pedile que lo levante (`npm run dev`) o que te autorice a levantarlo en background (y bajalo al cierre).
- Tras editar código en Windows, el HMR puede tener un watch-gap (sirve stale). Si un fix no aparece, **reiniciá el dev server fresh** en vez de confiar en el HMR.

## 4. Login / sesión (NextAuth — no hay sessionFake)

- **Flujos públicos** — catálogo, detalle de [[Libro]], carrito, checkout — **NO requieren login**. Navegá directo.
- **Panel admin** SÍ requiere login: NextAuth con provider OAuth (Discord en el scaffold; confirmar el definitivo). El login lo hace **el usuario manualmente** una vez en la ventana del MCP (pedíselo y esperá su confirmación); después la cookie de NextAuth persiste entre runs — **no la invalides ni cierres sesión** (re-loguear cuesta una intervención manual).
- **Datos reales**: para verificar catálogo/órdenes/sorteo, asegurate de que la DB DEV tenga las filas relevantes (usá `npm run db:studio` o pedíselas al usuario). No verifiques contra una DB vacía y lo cantes verde — los números son la fuente de verdad.

## 5. Recuperación de lock (Playwright MCP) — matá solo un lock que sea TUYO

Que `browser_navigate` devuelva `Browser is already in use for ...mcp-chrome-<id>` significa que hay un profile-lock tomado. **Decidí de quién es antes de actuar:**

- **Tuyo** (cerraste tu propia tab antes — lo que §1 dice que no hagas): matá el proceso stale y reintentá.
  ```powershell
  Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" |
    Where-Object { $_.CommandLine -like '*mcp-chrome-<id>*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
  ```
  (Sustituí el `<id>` del error.) Después re-navegá.
- **Posiblemente de otro agente vivo** (no lo abriste vos, u otro fork/worktree está activo): NO lo mates — es el robo de navegador que §0 prohíbe. Cambiá al otro carril, o preguntale al usuario cuál liberar.

Prevención: §1 — no cierres el navegador en primer lugar.

## 6. No rompas la sesión ni la data del usuario

- **Nunca mates el dev server** que no arrancaste vos, y nunca cierres sesión — la cookie del admin tiene que sobrevivir.
- No dispares diálogos nativos (`alert`/`confirm`/`prompt`) — bloquean el navegador y el driver deja de responder.
- **Las escrituras pegan a la DB DEV.** En este dominio hay flujos que persisten plata y data:
  - **Nunca dispares un pago real de Flow.** Para verificar checkout, usá el **sandbox de Flow** si está configurado, o **pará antes del redirect** a la URL de pago. Confirmar un pago real crea `Order`/`Payment` reales y dispara el webhook.
  - No clickees create/edit/delete de [[Libro]]s, órdenes, ni ejecución del [[Sorteo]] que persisten, salvo que el usuario haya autorizado esa escritura para el check.
  - Hermes consume API de pago por uso del LLM — no spamees generaciones; una para verificar basta.

## 7. Leer el DOM (no confíes en el evento load)

La data del catálogo/órdenes viene de Prisma/Postgres (rápido), pero hay flujos asíncronos: **Hermes** genera con un LLM (puede tardar segundos) y el **checkout** redirige fuera del sitio (a la URL de Flow). No asumas que todo está listo en el `load`.

- Poleá con `browser_evaluate` hasta que aparezcan y se estabilicen los nodos esperados; usá `browser_wait_for` para un texto concreto.
- Si hay charts en el panel admin: Recharts = SVG (inspeccioná `path`/`rect`/`text`); canvas (Chart.js) = opaco (verificá por screenshot).
- Chequeá `browser_network_requests` (filtrá `/api/`, `/trpc/`) y `browser_console_messages` (level `error`) para confirmar que las llamadas (tRPC, webhook de Flow) funcionaron.
