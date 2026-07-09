<!--
PLANTILLA — copiar a `tasks/YY-MM-DD-<modulo>-<slug>.md` y completar.

Este archivo es el seam compartido entre planner, feature-implementer y feature-tester.
NO editar este template salvo para evolucionar el formato global del harness.

Convenciones:
- Frontmatter YAML obligatorio. Cualquier subagente puede leerlo sin parsear markdown.
- Sección "Validaciones" con checkboxes en texto puro durante planning.
  - planner deja: `- [ ] Comportamiento esperado`
  - feature-implementer completa: `- [ ] Comportamiento esperado — \`<archivo>::<test-id>\``
  - feature-tester marca: `- [x] ... ✅ YYYY-MM-DD` o `- [ ] ❌ ... — razón`
- Sección "Bitácora" es append-only con timestamp. Nadie borra entradas previas.
- El `state` de cada feature se actualiza MANUAL por el feature-tester (no automático).
- El `status` global se actualiza al cerrar fase: planning → implementing → testing → done.
-->

---
slug: <kebab-case-slug>
status: planning              # planning | implementing | testing | done
owner: nicolas
created: <YYYY-MM-DD>
related_adrs: []              # eg. [ADR-0001]
related_context: []           # términos del CONTEXT.md tocados, eg. [Libro, Orden]

features:
  - id: F01
    behavior: "<descripción del comportamiento esperado, una frase>"
    state: not_started        # not_started | active | blocked | passing | done

  - id: F02
    behavior: "<...>"
    state: not_started
---

# <Título descriptivo del feature>

## Contexto

<Problema, motivación, alcance. 1-2 párrafos. Narrativa.>

## Decisiones

<Decisiones tomadas durante el grilling. Cada una con su razón. Si hay ADR asociado, linkearlo.>

- D1: <decisión>. Razón: <por qué>.
- D2: ...

## Plan

<Pasos de implementación en orden. Cada paso referencia las features del frontmatter (F01, F02, etc.) que lo cubren.>

1. <Paso>. (F01)
2. <Paso>. (F01, F02)
3. ...

## Validaciones

<Por cada feature, listar checkboxes con el comportamiento a validar. NO incluir nombres de archivos en planning — los completa el feature-implementer al crear los tests.>

### F01 — <behavior corto>

**Vitest** (integration):
- [ ] <Comportamiento verificable 1>
- [ ] <Comportamiento verificable 2>

**E2E** (browser):
- [ ] <Comportamiento end-to-end, o `(no aplica — backend-only)`>

### F02 — <behavior corto>

**Vitest**:
- [ ] <...>

**E2E**:
- [ ] (no aplica — backend-only) <o el comportamiento que corresponda>

## Invariantes

<Reglas duras que el feature-implementer NO puede violar. Si encuentra ambigüedad fuera de estos invariantes y de las decisiones tomadas, debe parar y preguntar.>

- I1: <invariante>.
- I2: <invariante>.

## Out of scope

<Cosas que NO se hacen en esta feature, explícitamente. Para que el implementer no derive.>

- <...>

## Especialistas a consultar

<Subagentes que el feature-implementer puede invocar durante la implementación. NO autoinvocarlos en el plan.>

- `<subagente>` — <para qué>.

## Bitácora

<Append-only. Tres tipos de entries posibles:>

<1. Grill — el planner appendea cada Q + respuesta del user durante la fase de grilling. Es lo que permite que el planner sea stateless entre invocaciones.>

<2. Implementación — el feature-implementer appendea decisiones tácticas, drift resuelto, reviewers invocados.>

<3. Testing — el feature-tester appendea resumen de corridas y veredicto.>

<Formato: `- [YYYY-MM-DD HH:MM] [<actor>] <contenido>`>

<Actores posibles: `planner-grill`, `feature-implementer`, `feature-tester`.>

- [pendiente — primera entrada llega cuando el planner arranca el grill]
