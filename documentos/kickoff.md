# 🚀 Kickoff — Tienda de libros con sorteo

**Proyecto:** tienda web propia para vender e-books con un sorteo asociado, para el fandom K-pop / ARMY en Chile.
**Fecha de inicio:** 28 de junio de 2026 · **Entrega estimada:** ~12 de julio de 2026 (2 semanas).

---

## 1. Contexto

- La autora vende sus libros en **PDF** y quiere dejar de venderlos por mensajes privados (lento, inseguro —se filtran fácil— y desordenado).
- Su público es el **fandom K-pop / ARMY en Chile**, mayoritariamente en el celular.
- La oportunidad: montar una **tienda propia** donde **cada compra de un libro ($3.000) inscribe automáticamente en un sorteo**. Premio de esta etapa: **2 entradas a BTS** (Estadio Nacional, oct 2026). El sorteo es el **motor de marketing**: comprar = participar, y la gente lo comparte.
- El modelo **ya está validado** en Chile (ej. tiotito.cl hace lo mismo con "stickers" digitales y un sorteo de autos). Este proyecto **parte mejor parado**: vende un **producto real** (un libro con valor) y el premio es el **sueño del momento** del público exacto.

---

## 2. Solución

Una **tienda web propia, mobile-first**, simple y barata de operar (pensada para bajo volumen, sin costos fijos altos). Incluye:

- 🏪 **Catálogo y compra** sin fricción — solo se pide el correo, sin crear cuenta.
- 💳 **Pago seguro con Flow** (tarjetas, transferencia, MACH, Servipag); el dinero llega a la cuenta de la autora.
- 🔒 **Entrega protegida del PDF** — enlace privado que expira, nunca un link público.
- 🎟️ **Sistema de sorteo** — cada compra inscribe a la persona; transparente y en vivo.
- ✨ **Hermes** — asistente de marketing con IA.
- 📊 **Panel de administración** privado para que la autora gestione todo.

---

## 3. Desarrollo

Se construye **a medida** (no una plantilla alquilada), por eso es barato de mantener. Dos piezas principales:

### 🖥️ a) La aplicación web (la tienda)

Es la cara compradora + la trastienda. Lo que la lectora ve y usa, y desde donde la autora administra. Módulos:

- **Tienda y catálogo** — portada, descripción y precio por libro; pensada para celular.
- **Carrito y checkout** — comprar uno o varios libros, pagar con Flow; el pago se **confirma del lado del servidor** (no se confía en el navegador) antes de entregar.
- **Entrega protegida del PDF** — enlace privado con expiración; solo lo recibe quien pagó.
- **Sorteo** — la compra genera un número de participación al instante; la autora ve participantes y ejecuta el sorteo de forma auditable.
- **Panel de administración** — subir/editar libros, ver ventas e ingresos, gestionar el sorteo. Acceso privado, solo para la autora.

### ✨ b) Hermes (marketing con IA)

Asistente para que la autora **no parta de una hoja en blanco** al promocionar. Da tres datos (objetivo, red social y tono) y Hermes devuelve **varias opciones de texto + hashtags** con la voz del fandom. El sistema ya conoce el libro, el precio y el sorteo, así que no hay que explicárselos. En esta etapa: **"genera y copia"** (la autora publica a mano; el auto-posteo a redes queda para más adelante).

---

## 4. Preguntas y respuestas (decisiones pendientes)

Decisiones que necesitamos cerrar para avanzar. Las completamos juntos en el kickoff.

### Necesitamos que definas con nosotros

| Pregunta | De qué se trata | Respuesta |
| --- | --- | --- |
| **Diseño** | Cuál de las direcciones visuales usamos (Dreamy o Concert). | |
| **Nombre y dominio** | El nombre de la tienda y la dirección web (.cl o .com). | |
| **Premio y bases del sorteo** | Confirmar el premio y redactar las bases (parte legal, idealmente ante notario individualizado, cumpliendo SERNAC). | |
| **Edad mínima** | Si se exige mayoría de edad o permiso de un adulto (el premio es ir a un recital). | |
| **Plan B del premio** | Qué pasa si el recital se cancela o se reprograma (premio alternativo / nuevo sorteo / devolución). | |
| **Marca de agua en los PDFs** | Si incrustamos los datos del comprador en el PDF desde el inicio o más adelante. | |
| **Vía de participación gratuita** | Ofrecer una forma de participar gratis con la misma probabilidad (refuerza la legalidad del sorteo). | |

### Lo resolvemos nosotros (informativo, no te afecta)

| Decisión | Criterio |
| --- | --- |
| Dónde se alojan los PDFs | Más barato y seguro para el volumen. |
| Proveedor de correo | Que los correos lleguen bien (no a spam) y los buzones sean baratos. |
| Qué IA usa Hermes | Mejor relación costo/calidad; el costo lo cubre la mantención. |
| Dónde se hospeda el sitio | Plan económico o gratuito acorde al volumen. |

> ⚖️ **Recordatorio legal (responsabilidad del cliente):** Inicio de Actividades en el SII, emisión de boleta + IVA 19%, y las bases del sorteo. El sistema permite operar según esas bases, pero no las redacta. Conviene validar las bases con un abogado antes de lanzar.

---

## 5. Fechas y plazos

**Inicio:** 28 de junio de 2026 · **Entrega estimada:** 12 de julio de 2026 (**2 semanas**). Cada fase se prueba antes de pasar a la siguiente.

| Fase | Qué incluye | Cuándo |
| --- | --- | --- |
| 1 · Imagen de marca | Cerrar diseño elegido, nombre y colores. | Días 1–2 |
| 2 · Tienda y catálogo | Catálogo de libros + carrito. | Días 2–5 |
| 3 · Pago + entrega | Flow + entrega protegida del PDF. | Días 5–8 |
| 4 · Sorteo | Inscripción automática + gestión del sorteo. | Días 8–10 |
| 5 · Hermes | Generador de marketing con IA. | Días 10–12 |
| 6 · Pruebas y lanzamiento | QA y salida a producción. | Días 12–14 |

> ℹ️ El orden puede ajustarse según prioridades. En paralelo, la autora deja lista su cuenta de Flow y resuelve los puntos pendientes del kickoff.

---

## 6. Comunicación

- 💬 **Día a día por WhatsApp** — dudas, avances y coordinación.
- 📅 **Reunión cada 1 semana** (o antes si es necesario) para revisar avances y decisiones.
- ✅ Las decisiones que se vayan tomando quedan registradas en este documento.
