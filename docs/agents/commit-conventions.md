# Commit conventions

Convenciones de commits para libros-iselk.

## Formato

Conventional commits en español:

```
<tipo>(<scope>): <descripción en imperativo>
```

- **Tipos**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
- **Scope**: el módulo tocado (eg. `catalogo`, `checkout`, `auth`, `harness`).
- Descripción corta, en imperativo, sin punto final.

Ejemplos:

```
feat(catalogo): listar libros con portada y precio
test(checkout): corrida feature-tester crear-orden — N/N verde
docs(harness): seed de conventions iniciales
```

## Reglas

- Un commit por unidad coherente de trabajo (idealmente, una feature F0X del plan o un cierre de fase).
- NUNCA commitear con `check` rojo salvo autorización explícita del usuario.
- NO usar `--no-verify` ni saltarse hooks.
- El `change-set-reviewer` se invoca ANTES del commit de cierre de una tarea no trivial.
