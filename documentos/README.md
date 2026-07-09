# documentos

Documentos de **presentación** del proyecto: briefs visuales, propuestas, resúmenes de
arquitectura/alcance, mockups exportados — material pensado para leerse o mostrarse (incluido al
cliente), no para que lo consuman los agentes.

Es una carpeta distinta de las demás del repo:

- `docs/` — documentación interna que es **fuente de verdad** para construir (ADRs, convenciones de agentes, glosario de dominio, línea gráfica).
- `tasks/` — planes del tridente de subagentes (ejecución).
- `.scratch/` — PRDs e issues (descubrimiento/triage).
- **`documentos/`** — documentos de presentación / cara al cliente.

## Contenido

- `propuesta.html` — **propuesta para el cliente** (la autora): qué es la plataforma, qué incluye,
  la experiencia del comprador, cómo se cobra y se entrega, el sorteo, Hermes, costos, qué necesita
  de ella y las fases. En lenguaje no técnico (sin mencionar el stack). Incluye diagramas **Mermaid**
  (journey, secuencia de pago, sorteo, mindmap del panel, etc.) **incrustados en el archivo**: es
  autocontenido (~3,4 MB), se abre con doble clic en cualquier navegador sin internet.

> El púrpura del documento es un guiño a la cultura ARMY, **solo para la presentación**. La identidad
> de marca del producto (nombre, paleta, tipografía) sigue **PENDIENTE** — ver `docs/decisiones-abiertas.md`.
