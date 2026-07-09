// Variante de diseño 1 — "Dreamy / Borahae" (clara, suave, tierna). Datos de ejemplo.
// Responsive: móvil = columna tipo celular; desktop = hero a 2 columnas + grillas anchas.
// Solo Tailwind. Se migra a shadcn cuando la clienta elija dirección.
import { useState } from "react";
import {
  BRAND,
  CATALOGO,
  FAQS,
  formatCLP,
  LIBRO,
  PACKS,
  PASOS,
  PREMIO,
  SORTEO_DEADLINE_ISO,
  STATS,
  TICKET_EJEMPLO,
  type BookItem,
} from "./mock";
import { BookCarousel } from "./book-carousel";
import { formatCompact, useCountdown } from "./use-countdown";

const WRAP = "mx-auto w-full max-w-[480px] px-5 lg:max-w-6xl lg:px-10";

export function VariantDreamy() {
  const cd = useCountdown(SORTEO_DEADLINE_ISO);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen w-full bg-[#f4f1fa] text-[#3a2d5c]">

      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/55 backdrop-blur-md">
        <div className={`${WRAP} flex items-center gap-3 py-3`}>
          <span className="text-lg font-extrabold tracking-tight lg:text-xl">
            {BRAND}<span className="text-[#ec4899]">💜</span>
          </span>
          <nav className="ml-6 hidden gap-6 text-sm font-medium text-[#6b6480] lg:flex">
            <a href="#catalogo" className="hover:text-[#7c3aed]">Libros</a>
            <a href="#como" className="hover:text-[#7c3aed]">Cómo funciona</a>
            <a href="#sorteo" className="hover:text-[#7c3aed]">El sorteo</a>
            <a href="#faq" className="hover:text-[#7c3aed]">Preguntas</a>
          </nav>
          <span className="ml-auto rounded-full bg-white/80 px-3 py-1 font-mono text-xs font-semibold tabular-nums text-[#7c3aed] shadow-sm ring-1 ring-[#7c3aed]/15">
            ⏳ {formatCompact(cd)}
          </span>
          <button aria-label="Carrito" className="grid h-9 w-9 place-items-center rounded-full bg-white/80 text-[#7c3aed] shadow-sm ring-1 ring-[#7c3aed]/10 active:scale-95">
            🛒
          </button>
        </div>
      </header>

      {/* Hero — 2 columnas en desktop */}
      <section className="pb-4 pt-8 lg:pt-16">
        <div className={`${WRAP} grid items-center gap-10 lg:grid-cols-2 lg:gap-14`}>
          <div className="text-center lg:text-left">
            <span className="inline-block rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#ec4899] ring-1 ring-[#ec4899]/20">
              ✦ Sorteo abierto 💜
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#2a1f47] sm:text-5xl lg:text-[3.7rem]">
              Compra el libro.<br />Anda a ver a <span className="bg-gradient-to-r from-[#7c3aed] to-[#4c1d95] bg-clip-text text-transparent">BTS</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-[40ch] text-[15px] leading-relaxed text-[#5b5076] lg:mx-0 lg:text-lg">
              Cada libro que compras ({formatCLP(LIBRO.precio)}) te inscribe automáticamente en el
              sorteo de <b className="text-[#3a2d5c]">2 entradas para BTS</b> en el Estadio Nacional · oct 2026.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <button className="w-full rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] px-7 py-4 text-base font-bold text-white shadow-[0_14px_30px_-10px_rgba(76,29,149,0.5)] transition active:scale-[0.98] hover:brightness-110 sm:w-auto">
                Quiero participar · {formatCLP(LIBRO.precio)}
              </button>
              <a href="#catalogo" className="text-sm font-semibold text-[#7c3aed] hover:underline">Ver los libros ↓</a>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-4 text-[11px] font-medium text-[#6b6480] lg:justify-start lg:text-xs">
              <span>🔒 Pago seguro</span>
              <span>⚡ PDF al instante</span>
              <span>🎟️ Tu N° al toque</span>
            </div>
          </div>

          {/* Heroviz */}
          <div className="relative h-64 w-full overflow-hidden rounded-[28px] bg-[linear-gradient(155deg,#8b5cf6,#4c1d95)] shadow-[0_24px_60px_-22px_rgba(76,29,149,0.45)] lg:h-[440px]">
            <span className="absolute left-6 top-6 h-12 w-12 rounded-full bg-white/40 blur-md" />
            <span className="absolute right-10 top-12 h-7 w-7 rounded-full bg-white/60 blur-sm" />
            <span className="absolute left-1/3 top-5 h-5 w-5 rounded-full bg-white/70 blur-[2px]" />
            <span className="absolute bottom-20 right-8 h-10 w-10 rounded-full bg-violet-300/40 blur-md" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(80%_120%_at_50%_120%,rgba(255,255,255,0.7),transparent)]" />
            <div className="absolute left-1/2 top-8 -translate-x-1/2 text-4xl drop-shadow motion-safe:animate-bounce lg:top-16 lg:text-6xl">💜</div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 lg:bottom-16">
              <div className="flex gap-3 lg:gap-5">
                <Ticket className="-rotate-6" />
                <Ticket className="rotate-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={`${WRAP} mt-10`}>
          <div className="mx-auto grid max-w-2xl grid-cols-3 gap-2 lg:gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/70 px-2 py-3 text-center shadow-sm ring-1 ring-white/80 lg:py-5">
                <div className="text-lg lg:text-2xl">{s.icon}</div>
                <div className="text-sm font-extrabold tabular-nums text-[#7c3aed] lg:text-xl">{s.value}</div>
                <div className="text-[10px] leading-tight text-[#6b6480] lg:text-xs">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-center text-[10px] text-[#9a93ad]">Cifras de ejemplo</p>
        </div>
      </section>

      {/* Carrusel de libros */}
      <section id="catalogo" className="mt-12 lg:mt-20">
        <div className={WRAP}>
          <div className="flex items-end justify-between">
            <SectionTitle kicker="El catálogo" title="Elige tu libro (y tu chance)" />
            <span className="hidden text-sm text-[#9a93ad] lg:block">Pasa el mouse para pausar</span>
          </div>
        </div>
        <div className="mt-5">
          <BookCarousel items={CATALOGO} card={(b) => <BookCard key={b.id} book={b} />} />
        </div>
      </section>

      {/* Packs */}
      <section className="mt-12 lg:mt-20">
        <div className={WRAP}>
          <SectionTitle kicker="Elige tu pack" title="Más libros, más chances" center />
          <div className="mx-auto mt-6 grid max-w-3xl gap-4 lg:grid-cols-2">
            {PACKS.map((p) => (
              <div
                key={p.id}
                className={`relative rounded-[22px] p-5 ${
                  p.popular
                    ? "bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-white shadow-[0_18px_40px_-16px_rgba(76,29,149,0.5)]"
                    : "bg-white/80 text-[#3a2d5c] ring-1 ring-white shadow-sm"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-2 right-4 rounded-full bg-[#ec4899] px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
                    MÁS ELEGIDO 💜
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold">{p.nombre}</div>
                    <div className={`text-xs ${p.popular ? "text-white/80" : "text-[#6b6480]"}`}>
                      {p.participaciones} {p.participaciones === 1 ? "participación" : "participaciones"}
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold tabular-nums">{formatCLP(p.precio)}</div>
                </div>
                <button
                  className={`mt-4 w-full rounded-xl py-3 text-sm font-bold transition active:scale-[0.98] ${
                    p.popular ? "bg-white text-[#7c3aed] hover:bg-white/90" : "bg-[#7c3aed] text-white hover:brightness-110"
                  }`}
                >
                  Comprar
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como" className="mt-12 lg:mt-20">
        <div className={WRAP}>
          <SectionTitle kicker="En 3 pasos" title="Comprar es participar" center />
          <div className="mt-6 grid gap-3 lg:grid-cols-3 lg:gap-5">
            {PASOS.map((p) => (
              <div key={p.n} className="flex gap-3 rounded-[20px] bg-white/70 p-4 ring-1 ring-white lg:flex-col lg:p-6">
                <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[#7c3aed] text-sm font-extrabold text-white lg:h-11 lg:w-11 lg:text-base">
                  {p.n}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#2a1f47] lg:text-base">{p.titulo}</div>
                  <div className="mt-0.5 text-[12px] leading-relaxed text-[#5b5076] lg:text-sm">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* El premio */}
      <section id="sorteo" className="mt-12 lg:mt-20">
        <div className={WRAP}>
          <div className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#2a1f47,#5b21b6)] p-6 text-center text-white shadow-xl lg:flex lg:items-center lg:justify-between lg:p-12 lg:text-left">
            <span className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[#a855f7]/40 blur-2xl" />
            <div className="relative">
              <div className="text-xs font-bold uppercase tracking-widest text-[#e9d5ff]">El premio</div>
              <div className="mt-2 text-3xl font-extrabold lg:text-5xl">{PREMIO.titulo} 💜</div>
              <div className="mt-1 text-sm text-white/80 lg:text-base">{PREMIO.detalle} · {PREMIO.fecha}</div>
            </div>
            <button className="relative mt-5 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-[#5b21b6] transition hover:bg-white/90 active:scale-[0.98] lg:mt-0">
              Participar ahora
            </button>
          </div>
        </div>
      </section>

      {/* ¡Estás dentro! + Confianza, 2 columnas en desktop */}
      <section className="mt-12 lg:mt-20">
        <div className={`${WRAP} grid gap-6 lg:grid-cols-2 lg:gap-10`}>
          <div>
            <SectionTitle kicker="Apenas compras" title="Así se siente entrar" />
            <div className="mt-4 rounded-[24px] border-2 border-dashed border-[#ec4899]/40 bg-white/85 p-6 text-center shadow-sm">
              <div className="text-2xl">🎉</div>
              <div className="mt-1 text-lg font-extrabold text-[#2a1f47]">¡Estás dentro! 💜</div>
              <p className="mt-1 text-xs text-[#6b6480]">Tu número de sorteo:</p>
              <div className="mx-auto mt-2 inline-block rounded-xl bg-[#7c3aed]/10 px-4 py-2 font-mono text-lg font-bold tracking-wider text-[#7c3aed]">
                {TICKET_EJEMPLO}
              </div>
              <button className="mt-4 w-full rounded-xl bg-[#ec4899] py-2.5 text-sm font-bold text-white transition active:scale-[0.98] hover:brightness-110">
                Compartir y sumar más chances ✨
              </button>
            </div>
          </div>
          <div>
            <SectionTitle kicker="Confianza" title="Sorteo 100% transparente" />
            <p className="mt-3 text-[13px] leading-relaxed text-[#5b5076] lg:text-sm">
              El sorteo es <b className="text-[#3a2d5c]">en vivo por Instagram</b>, con testigos y acta firmada.
              Mostramos a cada ganadora con su número. Nada de cajas negras.
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-[20px] bg-white/70 p-4 ring-1 ring-white">
              <div className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[#ede9fe] text-lg">🏆</div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#2a1f47]">Camila R. ganó el sorteo anterior</div>
                <div className="text-[11px] text-[#9a93ad]">Ticket ARMY-01337 · entregado en vivo · <i>ejemplo</i></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mt-12 lg:mt-20">
        <div className={WRAP}>
          <SectionTitle kicker="Dudas" title="Preguntas frecuentes" center />
          <div className="mx-auto mt-6 grid max-w-2xl gap-2">
            {FAQS.map((f, idx) => {
              const open = openFaq === idx;
              return (
                <div key={f.q} className="overflow-hidden rounded-[18px] bg-white/75 ring-1 ring-white">
                  <button
                    onClick={() => setOpenFaq(open ? null : idx)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-[#2a1f47]"
                  >
                    {f.q}
                    <span className={`flex-none text-[#7c3aed] transition-transform ${open ? "rotate-45" : ""}`}>＋</span>
                  </button>
                  {open && <p className="px-5 pb-4 text-[13px] leading-relaxed text-[#5b5076]">{f.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/70 py-10">
        <div className={`${WRAP} text-center`}>
          <div className="text-lg font-extrabold tracking-tight">{BRAND}<span className="text-[#ec4899]">💜</span></div>
          <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] font-medium text-[#7c3aed]">
            <a href="#" className="hover:underline">Bases del sorteo</a>
            <a href="#" className="hover:underline">Preguntas</a>
            <a href="#" className="hover:underline">WhatsApp</a>
            <a href="#" className="hover:underline">Instagram</a>
            <a href="#" className="hover:underline">TikTok</a>
          </div>
          <p className="mt-4 text-[12px] text-[#6b6480]">Hecho con 💜 para ARMY Chile</p>
          <p className="mt-2 text-[10px] leading-relaxed text-[#a89fbb]">
            Mockup de diseño · datos de ejemplo · el nombre y la marca definitivos se definen con la clienta.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ kicker, title, center = false }: { kicker: string; title: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <div className="text-[11px] font-bold uppercase tracking-widest text-[#ec4899]">{kicker}</div>
      <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#2a1f47] lg:text-3xl">{title}</h2>
    </div>
  );
}

function BookCard({ book }: { book: BookItem }) {
  return (
    <div className="w-44 shrink-0 snap-start rounded-[20px] bg-white/85 p-3 shadow-sm ring-1 ring-white lg:w-52">
      <div
        className="relative flex h-52 flex-col justify-between overflow-hidden rounded-xl p-3 shadow-md lg:h-64"
        style={{ backgroundColor: book.coverFrom }}
      >
        {book.tag && <span className="self-start rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold text-[#7c3aed]">{book.tag}</span>}
        <div className="text-[12px] font-extrabold uppercase leading-tight text-white drop-shadow">{book.titulo}</div>
        <span className="absolute right-2 top-2 text-sm">💜</span>
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-base font-extrabold tabular-nums text-[#7c3aed]">{formatCLP(book.precio)}</span>
        <span className="text-[10px] font-semibold text-[#9a93ad]">+1 chance</span>
      </div>
      <button className="mt-2 w-full rounded-xl bg-[#7c3aed] py-2 text-xs font-bold text-white transition active:scale-[0.98] hover:brightness-110">
        Comprar
      </button>
    </div>
  );
}

function Ticket({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-12 w-20 rounded-lg bg-white/95 shadow-lg lg:h-16 lg:w-28 ${className}`}>
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 border-l border-dashed border-[#c084fc]/50" />
      <span className="absolute right-2 top-1.5 text-[10px] lg:text-sm">🎫</span>
      <span className="absolute bottom-1.5 left-2 font-mono text-[8px] font-bold text-[#7c3aed] lg:text-[10px]">BTS · 2026</span>
    </div>
  );
}
