# Dev: trabajar el storefront/editor con login real (page builder F08/F09/F09d, ADR-0007/0019)

En **producción se trabaja SIEMPRE a nivel de subdominios** (`autora.sorteatelo.cl`, ADR-0007). En
**dev** los subdominios son incómodos: `*.localhost` NO comparte cookies entre subdominios, así que un
login en `localhost` no se ve en `autora.localhost`. La solución NO es simular una sesión — es **simular
el SUBDOMINIO**: hacer que el host apex pelado (`localhost:3001`) entero se comporte como una Tienda, de
modo que el login real de Google y las cookies funcionen sobre **un solo host**, sin trucos.

Hay tres caminos; el **primario** es `config.ts`. Los otros dos existen solo para probar el mecanismo
real de cookie **cross-subdominio**.

## 1. `config.ts` — override de subdominio de dev (CAMINO PRIMARIO, F09d)

Estilo `datawalt-app` (`configSession.ts` + `getInfoByHost`): un flag prendido hace que `localhost:3001`
ENTERO se comporte como la Tienda `slug`. Con **un solo host**, el login real de Google es normal (cookie
host-only sobre `localhost`) — no hay sesión que simular ni cookie que cruzar.

### Prender / apagar / cambiar de Tienda

`src/config.ts`:

```ts
export const devTienda = {
  slug: "autora", // la Tienda que impersona el apex pelado (debe existir y estar PUBLICADA)
  enabled: true,  // ← el switch. `false` ⇒ `localhost:3001` vuelve a ser la landing de plataforma.
};
```

### Qué hace

El override se cabla en **un único punto**: `configPlataformaDesdeEnv()` (`src/server/tenancy/`) le
inyecta `devTiendaSlug` al `ConfigPlataforma` **solo en `NODE_ENV=development`** (guard `devTiendaAplica`).
Desde ahí fluye al parser puro `parsearHost`, que cuando ve el **host apex pelado** (`localhost`, sin
subdominio) resuelve **zona tenant con ese slug** en vez de plataforma. Como TODA la tenancy pasa por
`parsearHost` (middleware, contexto tRPC, `getServerSideProps` del storefront), el override aplica
uniforme en los tres.

### Cómo se ve (con `enabled: true`)

- `http://localhost:3001/`       ⇒ **storefront de `autora`** (idéntico byte-a-byte a `autora.localhost:3001`).
- `http://localhost:3001/login`  ⇒ **login real de Google**. Al ser el mismo host, la cookie de sesión es
  host-only y el `useSession()`/SSR la ven sin nada raro. Tras loguear vuelve a la tienda (`callbackUrl`).
- `http://localhost:3001/editor` ⇒ **editor de `autora`** (tras autorizar por membresía/Operador, I7).
- `http://localhost:3001/admin`  ⇒ **panel del Organizador** (mismo host, sigue alcanzable; anónimo ⇒
  redirige a `/login`).
- Post-login, en el header del storefront aparece **"Editar mi página"** y el banner de dueña.

Los **subdominios reales** siguen intactos: `http://autora.localhost:3001/` (y `prueba.localhost:3001`,
etc.) resuelven por su propio label — el override **solo** toca el host pelado.

### Rutas de zona plataforma vs tienda en el mismo host (decisión F09d, REVISABLE)

Con el override, `/` sirve el storefront de la Tienda; la **landing de plataforma queda opacada** en el
host pelado (para verla, apagá `enabled` o usá un subdominio real). `/login` y `/admin` NO están gateadas
por zona (son páginas del pages router: `/login` es pública, `/admin` gatea por **sesión**, no por host),
así que **siguen alcanzables** en el host pelado — mismo criterio que datawalt (donde `/login` y el panel
se alcanzan sobre el host impersonado). No hubo que tocar ningún gate: no existía uno de "solo apex".

### Producción: INERTE por diseño

El guard `devTiendaAplica` exige `NODE_ENV === "development"`. Aunque `enabled` quede en `true`, en prod
**jamás aplica** ⇒ `localhost`/apex se comporta como plataforma y el ruteo por subdominio real manda.
Cubierto por tests (`src/__tests__/config.test.ts` — `enabled + production ⇒ false`;
`server/tenancy/configPlataforma.test.ts` — sin `devTiendaSlug` el config queda idéntico). Vercel siempre
corre en prod.

## 2. `/api/dev/login` — sesión de DB con cookie wildcard (ALTERNATIVA, solo cross-subdominio, F08/R3)

El camino primario NO necesita esto. Sirve **solo** para probar el **mecanismo real de la cookie al
wildcard** (`Domain=.<apex>`) entre subdominios distintos — algo que el override no ejercita porque usa un
único host. Como `*.localhost` no comparte cookies, **requiere `lvh.me`** (dominio público que resuelve a
`127.0.0.1`, con subdominios que sí comparten cookies).

### Setup

1. En `.env`: `NEXT_PUBLIC_PLATFORM_DOMAIN="lvh.me"` (⇒ `lvh.me` = apex, `autora.lvh.me` = tienda
   `autora`; la cookie sale con `Domain=.lvh.me`). Reiniciar el dev server (una sola instancia, `:3001`).
   Conviene apagar `devTienda.enabled` para no mezclar los dos mecanismos.
2. `GET http://lvh.me:3001/api/dev/login?slug=autora` — crea la `Session` de DB del **dueño** de `autora`
   y setea la cookie wildcard. Acepta `?callbackUrl=/editor` (ruta RELATIVA validada por
   `esRutaRelativaSegura`) y redirige ahí en un click; sin él, responde JSON.
3. Abrir `http://autora.lvh.me:3001/` ⇒ la sesión se ve (cookie compartida) ⇒ banner + "Editar mi página".

- **Dev-only**: `404` con `NODE_ENV=production`; solo `GET`.
- Requiere que la Tienda tenga dueño (`npm run otorgar:membresia`).

> **Nota** (REVISABLE, Bitácora de `tasks/26-07-17-page-builder.md`): ADR-0019 proponía un
> `CredentialsProvider` de NextAuth, incompatible con el adapter de DB (fuerza JWT). El endpoint preserva
> la intención creando la `Session` de DB directamente. Pendiente: addendum en ADR-0019.

## 3. HTTPS local (`dev:ssl`) — para el OAuth real de Google sobre subdominios

Cuando querés probar el **flujo Google real** con https (callback + cookies `__Secure-`) sobre
subdominios reales:

```
npm run dev:ssl   # next dev :3002 + local-ssl-proxy https :3001 → :3002
```

`concurrently` levanta `next dev` en `:3002` y `local-ssl-proxy` expone https en `:3001`. El `dev` normal
(`next dev`, http) queda igual. Con https, `NEXTAUTH_URL` pasa a https ⇒ la cookie de sesión es
`__Secure-` + `secure` (alineado con `useSecureCookies` de NextAuth). Alternativa histórica: túnel
**cloudflared** al apex (memoria `flow-sandbox-e2e`).

> Para el trabajo diario del storefront/editor **no hace falta nada de esto**: con `config.ts`
> (`devTienda.enabled: true`) y `npm run dev`, `localhost:3001` es la tienda y el login de Google real
> funciona sobre ese único host.
