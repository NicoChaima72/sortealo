# Hosting: Vercel (app) + Supabase (PostgreSQL)

Decisión del usuario (2026-07-17), cierra la decisión abierta **#5**. La app corre en **Vercel**
(proyecto `sorteatelo`, team personal, importado del repo GitHub `NicoChaima72/sorteatelo` con
deploy automático desde `main`) y la base de datos productiva es **Supabase PostgreSQL** (conexión
vía pooler; por ahora es la MISMA base que usa dev — ver consecuencias). Los nameservers de
`sorteatelo.cl` (ADR-0014) están delegados a Vercel (`ns1/ns2.vercel-dns.com`): Vercel administra
todo el DNS del dominio y emite los certificados, incluido el **wildcard `*.sorteatelo.cl`** que
exige el ADR-0007.

Razón: el stack T3/Next.js encaja nativo en Vercel (cero config de build, deploy por push), el
wildcard con certificado automático cumple ADR-0007 sin infraestructura propia, y ambos free
tiers cubren el volumen esperado del MVP — consistente con el principio "simple y barato".

## Consecuencias

- **DNS**: todo registro futuro (Resend DKIM/SPF, buzones `contacto@`) se agrega en el DNS de
  Vercel, NO en NIC Chile.
- **Env vars**: viven en el proyecto Vercel; un cambio de variable NO afecta el deployment
  corriente — requiere redeploy (las `NEXT_PUBLIC_*` se hornean al build).
  `NEXT_PUBLIC_PLATFORM_DOMAIN=sorteatelo.cl` es obligatoria (fail-fast ADR-0007).
- **DB dev = DB prod (transitorio)**: hoy la misma base Supabase sirve dev y producción. Antes
  del go-live público (F10) separar en dos proyectos/bases (dev vs prod) para que el desarrollo
  no pueda tocar datos reales.
- **Plan Hobby (transitorio)**: los ToS de Vercel Hobby prohíben uso comercial. Configurar y
  probar está bien; para vender de verdad (piloto F07 / go-live F10) subir a **Pro**
  (US$20/mes, cubierto por la mantención de ~$40.000/mes).
- La URL `sorteatelo.vercel.app` responde 404 **a propósito** (host desconocido ⇒ respuesta
  neutral, ADR-0007): las únicas entradas válidas son `sorteatelo.cl` y `*.sorteatelo.cl`.
- Pendientes operativos registrados el 2026-07-17: redirect URI de producción en el OAuth client
  de Google, verificación del dominio en Resend, bucket R2 público de assets (ADR-0013) con sus
  env vars.
