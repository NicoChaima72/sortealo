/**
 * Términos de Servicio de la Plataforma — texto VERSIONADO EN EL REPO (F08/D3, ADR-0008).
 *
 * El contenido lo escribe un humano/abogado, NO es dato del dominio: por eso vive como
 * constante del repo y no en la DB. La aceptación (quién/cuándo/qué versión) SÍ se persiste
 * en `Tenant` (tosVersion/tosAceptadoAt/tosAceptadoPor, D2). El gate de publicación exige
 * `tenant.tosVersion === TOS_VERSION`: una bump de `TOS_VERSION` invalida las aceptaciones
 * previas a efectos del gate (obliga a re-aceptar la versión nueva).
 *
 * ⚠️ BORRADOR OPERATIVO — la validación legal formal es F10 (ADR-0008, dependencia externa: un
 * abogado revisa cuánto protege realmente este esquema ante SERNAC). El borrador NO bloquea el
 * MVP, pero su TEXTO es REVISABLE por el usuario/su abogado antes del go-live público.
 *
 * Para bumpar la versión: editar `TOS_TEXTO` y subir `TOS_VERSION` a la nueva fecha (ISO).
 */

/** Versión vigente del ToS (fecha ISO). Bumpar al cambiar el texto invalida aceptaciones previas. */
export const TOS_VERSION = "2026-07-17";

/**
 * Texto del ToS que renderiza la UI antes de aceptar. Refleja ADR-0008 (responsabilidad del
 * sorteo y del contenido = del Organizador) y ADR-0006 (BYO-Flow: la Plataforma no mueve plata
 * de terceros). BORRADOR — revisable por abogado (F10).
 */
export const TOS_TEXTO = `Términos de Servicio de la Plataforma
Versión ${TOS_VERSION} (borrador operativo — pendiente de validación legal)

Al crear y operar tu Tienda en esta Plataforma, aceptas estos Términos. Léelos con atención: definen tu responsabilidad como Organizador.

1. Qué es la Plataforma
La Plataforma es un servicio técnico que te permite montar una tienda de productos digitales con un sorteo promocional, cada tienda en su propio subdominio. La Plataforma orquesta la parte técnica (catálogo, entrega de archivos, checkout, sorteo); NO es la vendedora de tus productos ni la organizadora de tu sorteo.

2. Tu tienda y tus productos
Eres el único responsable de los productos que vendes: su contenido, su legalidad, que tengas los derechos para venderlos, y de entregar lo que ofreces. Respondes también por tus obligaciones tributarias (Inicio de Actividades ante el SII, emisión de boleta, IVA cuando corresponda). La Plataforma no emite documentos tributarios por ti.

3. Pagos (Flow)
Los cobros se procesan con TU propia cuenta de Flow.cl, que conectas a tu tienda. El dinero de tus ventas va directo a tu cuenta: la Plataforma NUNCA recibe, custodia ni mueve tu dinero ni el de tus compradores, ni retiene comisión sobre tus ventas. La relación comercial y tributaria por los pagos es directamente entre tú y Flow/SII.

4. Tu sorteo — responsabilidad legal
Si tu tienda ofrece un sorteo, ERES TÚ, y no la Plataforma, la persona u organización legalmente responsable de ese sorteo. Eso incluye redactar y protocolizar sus bases, definir y entregar el premio, cumplir la normativa aplicable (incluida la de SERNAC) y responder ante los participantes. Para publicar una tienda con un sorteo activo debes cargar tus bases. La Plataforma muestra a tus compradores un aviso indicando que el responsable del sorteo eres tú.

5. Contenido y conducta
No puedes usar la Plataforma para vender contenido ilegal, que infrinja derechos de terceros, o para fines fraudulentos. La Plataforma puede suspender una tienda que incumpla estos Términos o la ley, para proteger a los compradores y a la propia Plataforma.

6. Datos y privacidad
Tratas los datos de tus compradores conforme a la ley. La Plataforma procesa datos para prestarte el servicio (por ejemplo, enviar los enlaces de descarga tras un pago).

7. Sin garantías absolutas
La Plataforma se ofrece "tal cual". Hacemos lo posible por mantener el servicio disponible, pero no garantizamos que esté libre de interrupciones o errores. En la medida que la ley lo permita, la responsabilidad de la Plataforma se limita al servicio técnico que presta.

8. Cambios en estos Términos
Podemos actualizar estos Términos. Si cambian de forma relevante, te pediremos aceptarlos de nuevo antes de seguir publicando tu tienda.

Al aceptar, confirmas que leíste y estás de acuerdo con estos Términos, y que asumes la responsabilidad por tu tienda, tus productos y tu sorteo.`;
