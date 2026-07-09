// Datos de EJEMPLO (mock) para las propuestas de diseño del landing comprador.
// El contenido es idéntico en las 3 variantes; solo cambia la estética.
// Cuando la clienta elija dirección, esta data se reemplaza por la real (tRPC/Prisma)
// y el componente elegido se migra a shadcn/ui.

export const BRAND = "borahae"; // nombre de ejemplo — se define con la clienta

// ~12 días desde hoy (mock) para que el countdown tictaquee
export const SORTEO_DEADLINE_ISO = "2026-07-10T22:00:00-04:00";

export const PREMIO = {
  titulo: "2 entradas para BTS",
  detalle: "Estadio Nacional · Santiago",
  fecha: "Octubre 2026",
} as const;

export const LIBRO = {
  titulo: "Cómo enriquecer a tu idol favorito",
  autora: "por la autora",
  precio: 3000,
  descripcion:
    "La guía con humor y corazón para apoyar a tu bias sin fundirte el sueldo: ahorro real, merch inteligente y cómo llegar a verlos en vivo.",
} as const;

export interface Pack {
  id: string;
  nombre: string;
  libros: number;
  precio: number;
  participaciones: number;
  popular: boolean;
}

export const PACKS: Pack[] = [
  { id: "uno", nombre: "1 libro", libros: 1, precio: 3000, participaciones: 1, popular: false },
  { id: "cuatro", nombre: "Pack 4 libros", libros: 4, precio: 10000, participaciones: 4, popular: true },
];

export interface Stat {
  icon: string;
  value: string;
  label: string;
}

export const STATS: Stat[] = [
  { icon: "🎟️", value: "+2.480", label: "participando" },
  { icon: "⏳", value: "12 días", label: "para el cierre" },
  { icon: "💜", value: "2 entradas", label: "el premio" },
];

export interface Paso {
  n: number;
  titulo: string;
  desc: string;
}

export const PASOS: Paso[] = [
  { n: 1, titulo: "Compras el libro", desc: "Pagas $3.000 con tarjeta, transferencia, MACH o Servipag. Sin crear cuenta." },
  { n: 2, titulo: "Recibes todo al instante", desc: "Tu PDF y tu número de sorteo llegan a tu correo apenas se confirma el pago." },
  { n: 3, titulo: "Entras al sorteo", desc: "El sorteo es EN VIVO por Instagram, con testigos y acta. Transparente de punta a punta." },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  { q: "¿Cómo recibo el libro?", a: "Por correo, apenas se confirma tu pago, con un enlace privado de descarga. Si vence, pides uno nuevo con un clic." },
  { q: "¿Cómo sé que entré al sorteo?", a: "Cada compra te da un número de sorteo único, que ves al instante y queda en tu correo. Puedes verificarlo cuando quieras." },
  { q: "¿Qué pasa si gano?", a: "Te contactamos por correo y redes. Tienes 30 días para coordinar la entrega de tus 2 entradas. Todo queda en acta firmada." },
];

export const TICKET_EJEMPLO = "ARMY-04821";

export interface BookItem {
  id: string;
  titulo: string;
  precio: number;
  tag?: string;
  coverFrom: string;
  coverTo: string;
}

// Catálogo de ejemplo para el carrusel de libros.
export const CATALOGO: BookItem[] = [
  { id: "1", titulo: "Cómo enriquecer a tu idol favorito", precio: 3000, tag: "Más vendido", coverFrom: "#7c3aed", coverTo: "#ec4899" },
  { id: "2", titulo: "Cartas a los 7", precio: 3000, coverFrom: "#6d28d9", coverTo: "#a855f7" },
  { id: "3", titulo: "Mi era favorita", precio: 3000, tag: "Nuevo", coverFrom: "#db2777", coverTo: "#f0abfc" },
  { id: "4", titulo: "Diario de una ARMY", precio: 3000, coverFrom: "#4c1d95", coverTo: "#7c3aed" },
  { id: "5", titulo: "Borahae: ensayos de fandom", precio: 3000, coverFrom: "#9333ea", coverTo: "#ec4899" },
];

export const formatCLP = (n: number): string =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
