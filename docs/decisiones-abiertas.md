# Decisiones abiertas

Decisiones que el brief dejó **sin cerrar** y **requieren confirmación del cliente** antes de
implementar lo que dependa de ellas. No las cierres por tu cuenta: si una feature en curso choca
con una de estas, parar y preguntar. Cuando una se resuelva y sea load-bearing, promoverla a un
ADR en `docs/adr/` y sacarla de esta lista.

> La decisión #1 del brief (stack) ya quedó **resuelta**: T3 (Next.js 14 pages router + tRPC +
> Prisma + NextAuth + Tailwind + shadcn/ui).

## 1. Proveedor de almacenamiento de PDFs — ABIERTA

Candidatos: S3 / Cloudflare R2 / Supabase Storage. Impacto: ver [ADR-0002](adr/0002-entrega-pdf-storage-privado-url-firmada.md). Criterio: barato a bajo volumen + soporte de URLs firmadas con expiración. La abstracción de storage es un service para no acoplarse al proveedor.

## 2. Proveedor de correo — ABIERTA

Dos necesidades: (a) **envío transaccional** del enlace de descarga firmado (crítico del flujo de compra); (b) **buzones del dominio** (`contacto@dominio.cl`). Candidatos: Zoho Mail (gratis), Google Workspace (pago), o un transaccional dedicado. Criterio: entregabilidad del correo transaccional + costo de los buzones.

## 3. Modelo LLM por defecto para Hermes — ABIERTA

Detrás de la interfaz de [ADR-0003](adr/0003-hermes-llm-agnostico.md). Candidatos por costo/calidad: Google Gemini (plan gratis), Claude Haiku (~6 pesos/post, alta calidad), DeepSeek / Kimi (muy baratos). Requiere API de pago por uso. Costo absorbido por la mantención; marginal al volumen.

## 4. Nombre de dominio — ABIERTA

`.cl` o `.com`, comprado por la autora (~$10.000–$15.000/año). Nombre por definir. Bloquea: buzones de correo (#2), branding (`docs/design.md`), config de NextAuth (`NEXTAUTH_URL`).

## 5. Hosting / despliegue — ABIERTA

Criterio: plan barato o gratuito acorde al bajo volumen. La mantención (~$40.000/mes) debe cubrirlo con holgura. (Nota: el stack T3 encaja bien con Vercel, pero no está decidido.)

## 6. Marca de agua en los PDFs (MVP sí/no) — ABIERTA

Recomendada en [ADR-0002](adr/0002-entrega-pdf-storage-privado-url-firmada.md) para desincentivar redistribución (embeber correo/identificador del comprador). Decidir si entra en el MVP o se difiere.
