/**
 * Datos de ejemplo para el MOCKUP visual del panel de administración.
 *
 * NO son datos reales: solo alimentan las pantallas para que la clienta vea cómo
 * se verá el panel. Cuando el panel se conecte a la base de datos, esto se reemplaza
 * por queries tRPC (`api.<router>.<procedure>.useQuery`). Ver docs/agents/data-fetching-conventions.md.
 */

// ---- formato de dinero / números (CLP, sin decimales) ----
export const clp = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);

export const num = (n: number) => new Intl.NumberFormat("es-CL").format(n);

// comisión efectiva de Flow (~3,44%) — solo para mostrar el neto en el mockup
export const COMISION_FLOW = 0.0344;
export const neto = (total: number) => Math.round(total * (1 - COMISION_FLOW));

// ---- Libros ----
export interface Libro {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  activo: boolean;
  ventas: number;
  publicado: string;
}

export const LIBROS: Libro[] = [
  {
    id: "lib_01",
    titulo: "Cómo enriquecer a tu idol favorito",
    descripcion: "El primer libro de la colección. Guía con humor para el fandom.",
    precio: 3000,
    activo: true,
    ventas: 128,
    publicado: "12 mar 2026",
  },
  {
    id: "lib_02",
    titulo: "Cartas a Seúl",
    descripcion: "Relatos cortos sobre la distancia, la música y la comunidad ARMY.",
    precio: 3500,
    activo: true,
    ventas: 41,
    publicado: "02 may 2026",
  },
  {
    id: "lib_03",
    titulo: "Borahae: una historia",
    descripcion: "Borrador en preparación. Aún sin publicar.",
    precio: 3000,
    activo: false,
    ventas: 0,
    publicado: "—",
  },
];

// ---- Ventas / órdenes ----
export type EstadoOrden = "pagado" | "pendiente" | "fallido";

export interface Orden {
  id: string;
  correo: string;
  fecha: string;
  libro: string;
  unidades: number;
  total: number;
  estado: EstadoOrden;
}

export const ORDENES: Orden[] = [
  { id: "#1042", correo: "sofi***@gmail.com", fecha: "28 jun · 14:22", libro: "Cómo enriquecer a tu idol favorito", unidades: 1, total: 3000, estado: "pagado" },
  { id: "#1041", correo: "army***@hotmail.com", fecha: "28 jun · 11:05", libro: "Pack ×2", unidades: 2, total: 6000, estado: "pagado" },
  { id: "#1040", correo: "vale***@gmail.com", fecha: "27 jun · 22:48", libro: "Cartas a Seúl", unidades: 1, total: 3500, estado: "pagado" },
  { id: "#1039", correo: "juli***@outlook.com", fecha: "27 jun · 19:31", libro: "Cómo enriquecer a tu idol favorito", unidades: 1, total: 3000, estado: "pendiente" },
  { id: "#1038", correo: "cami***@gmail.com", fecha: "27 jun · 16:10", libro: "Cómo enriquecer a tu idol favorito", unidades: 1, total: 3000, estado: "pagado" },
  { id: "#1037", correo: "anto***@gmail.com", fecha: "26 jun · 20:55", libro: "Pack ×2", unidades: 2, total: 6000, estado: "pagado" },
  { id: "#1036", correo: "fran***@gmail.com", fecha: "26 jun · 13:02", libro: "Cartas a Seúl", unidades: 1, total: 3500, estado: "fallido" },
  { id: "#1035", correo: "maca***@gmail.com", fecha: "25 jun · 18:40", libro: "Cómo enriquecer a tu idol favorito", unidades: 1, total: 3000, estado: "pagado" },
  { id: "#1034", correo: "isi***@gmail.com", fecha: "25 jun · 09:17", libro: "Cómo enriquecer a tu idol favorito", unidades: 1, total: 3000, estado: "pagado" },
  { id: "#1033", correo: "dani***@gmail.com", fecha: "24 jun · 21:29", libro: "Cartas a Seúl", unidades: 1, total: 3500, estado: "pagado" },
  { id: "#1032", correo: "rena***@gmail.com", fecha: "24 jun · 12:48", libro: "Cómo enriquecer a tu idol favorito", unidades: 1, total: 3000, estado: "pagado" },
  { id: "#1031", correo: "barb***@gmail.com", fecha: "23 jun · 17:03", libro: "Pack ×2", unidades: 2, total: 6000, estado: "pagado" },
];

// ---- Ingresos por mes (para el gráfico) ----
export interface PuntoMes {
  mes: string;
  ingresos: number;
  ventas: number;
}

export const VENTAS_MES: PuntoMes[] = [
  { mes: "Nov", ingresos: 18000, ventas: 6 },
  { mes: "Dic", ingresos: 27000, ventas: 9 },
  { mes: "Ene", ingresos: 24000, ventas: 8 },
  { mes: "Feb", ingresos: 21000, ventas: 7 },
  { mes: "Mar", ingresos: 33000, ventas: 11 },
  { mes: "Abr", ingresos: 30000, ventas: 10 },
  { mes: "May", ingresos: 36000, ventas: 12 },
  { mes: "Jun", ingresos: 39000, ventas: 13 },
];

// ---- Sorteo activo ----
export const SORTEO = {
  nombre: "Sorteo BTS · Estadio Nacional",
  premio: "2 entradas para ver a BTS en vivo",
  fechaSorteo: "10 oct 2026",
  participantes: 87,
  meta: 150,
  estado: "activo" as const,
};

export interface Participante {
  correo: string;
  inscripcion: string;
  tickets: number;
}

export const PARTICIPANTES: Participante[] = [
  { correo: "sofi***@gmail.com", inscripcion: "28 jun", tickets: 1 },
  { correo: "army***@hotmail.com", inscripcion: "28 jun", tickets: 2 },
  { correo: "vale***@gmail.com", inscripcion: "27 jun", tickets: 1 },
  { correo: "cami***@gmail.com", inscripcion: "27 jun", tickets: 1 },
  { correo: "anto***@gmail.com", inscripcion: "26 jun", tickets: 2 },
  { correo: "maca***@gmail.com", inscripcion: "25 jun", tickets: 1 },
  { correo: "isi***@gmail.com", inscripcion: "25 jun", tickets: 1 },
];
