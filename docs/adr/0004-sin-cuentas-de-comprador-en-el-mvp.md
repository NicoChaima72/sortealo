# Sin cuentas de comprador en el MVP — la identidad es el correo

En el MVP no hay registro ni login de compradores. El checkout recoge, como mínimo, el **correo** del comprador, que es la clave para la entrega (enlace firmado) y para el sorteo (`RaffleEntry`). El **panel admin** sí tiene autenticación (provider OAuth, mono-usuario: la autora).

Razón: el volumen es muy bajo (~10 ventas/mes) y el principio rector del proyecto es simplicidad y costo bajo. Un sistema de cuentas (registro, verificación, recuperación de contraseña, sesión del comprador) es complejidad que la entrega por correo vuelve innecesaria en el MVP.

## Consecuencias

- La **identidad del comprador es su correo**. `Order`, `Entitlement` y `RaffleEntry` se anclan al correo (no a un `User` del comprador). `User`/`Account` de NextAuth quedan para el admin.
- El acceso a la descarga se valida por `Entitlement` (ligado a la orden pagada), no por sesión del comprador (ver [ADR-0002](0002-entrega-pdf-storage-privado-url-firmada.md)).
- Si más adelante se quieren cuentas de comprador (biblioteca personal, re-descarga con login), es un cambio mayor — se reabre esta decisión.
- Riesgo aceptado: un correo mal tipeado en el checkout rompe la entrega. Mitigación: confirmar/mostrar el correo antes de pagar.
