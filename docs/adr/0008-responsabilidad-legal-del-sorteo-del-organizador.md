# La responsabilidad legal del sorteo es del Organizador (ToS + bases propias + disclaimer)

La Plataforma **no asume la responsabilidad legal de los sorteos** que las Tiendas montan. El modelo es: (1) el Organizador redacta/protocoliza y **sube sus propias bases legales** del sorteo; (2) al operar su Tienda acepta los **Términos de Servicio** de la Plataforma, que le atribuyen expresamente la responsabilidad del sorteo y del contenido que vende; (3) el storefront muestra un **disclaimer visible al Comprador** dejando claro que el responsable del sorteo es la persona/organización detrás de la tienda, no el sitio.

Razón: la Plataforma no puede redactar, protocolizar ni responder por las bases de N sorteos de terceros (cumplimiento SERNAC, premios, ejecución); atribuir la responsabilidad al organizador es el modelo estándar de marketplaces promocionales y mantiene a la Plataforma como orquestador técnico (coherente con ADR-0006: tampoco toca la plata).

## Consecuencias

- **Gate de publicación**: una Tienda no publica un sorteo activo sin bases cargadas, y un Organizador no opera sin ToS aceptados (con registro de la aceptación: quién, cuándo, qué versión).
- El disclaimer es parte de la plantilla del storefront en toda tienda con sorteo activo — no es opcional por tenant.
- **Dependencia externa (riesgo conocido y aceptado)**: falta validación por abogado de cuánto protege realmente este esquema — una cláusula de ToS no elimina al 100% la responsabilidad ante SERNAC. Pendiente antes del go-live público de la plataforma; el usuario ya está avisado.
- Las bases son **contenido del tenant**, no código: el sistema las publica y permite operar el sorteo conforme a ellas, pero no las redacta ni automatiza su cumplimiento.
