// Variante de diseño 2 — "Concert Night" (oscura, neón, recital). Datos de ejemplo.
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

export function VariantConcert() {
  const cd = useCountdown(SORTEO_DEADLINE_ISO);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen w-full bg-[#070310] text-[#efe7fb]">
      <div className="w-full bg-[radial-gradient(120%_50%_at_50%_-5%,#2a0f55_0%,#14082a_42%,#070310_100%)]">

        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070310]/70 backdrop-blur-md">
          <div className={`${WRAP} flex items-center gap-3 py-3`}>
            <span className="text-lg font-extrabold uppercase tracking-tight lg:text-xl">
              {BRAND}<span className="text-[#d946ef]">💜</span>
            </span>
            <nav className="ml-6 hidden gap-6 text-sm font-medium text-[#a99bc7] lg:flex">
              <a href="#catalogo" className="hover:text-white">Libros</a>
              <a href="#como" className="hover:text-white">Cómo funciona</a>
              <a href="#sorteo" className="hover:text-white">El sorteo</a>
              <a href="#faq" className="hover:text-white">Preguntas</a>
            </nav>
            <span className="ml-auto rounded-full border border-[#a855f7]/40 bg-[#a855f7]/10 px-3 py-1 font-mono text-xs font-bold tabular-nums text-[#d8b4fe] shadow-[0_0_18px_-4px_#a855f7]">
              ⏳ {formatCompact(cd)}
            </span>
            <button aria-label="Carrito" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-[#d8b4fe] active:scale-95">
              🛒
            </button>
          </div>
        </header>

        {/* Hero — 2 columnas en desktop */}
        <section className="pb-4 pt-8 lg:pt-16">
          <div className={`${WRAP} grid items-center gap-10 lg:grid-cols-2 lg:gap-14`}>
            <div className="text-center lg:text-left">
              <span className="inline-block rounded-full border border-[#d946ef]/40 bg-[#d946ef]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#f0abfc]">
                ● Sorteo en vivo abierto
              </span>
              <h1 className="mt-4 text-[2.7rem] font-black uppercase leading-[0.92] tracking-tight sm:text-6xl lg:text-[4.2rem]">
                Compra el libro.<br />
                <span className="bg-gradient-to-r from-[#a855f7] via-[#d946ef] to-[#f0abfc] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(217,70,239,0.45)]">
                  Anda a ver a BTS
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-[40ch] text-[14px] leading-relaxed text-[#c4b5e0] lg:mx-0 lg:text-lg">
                Cada libro que compras ({formatCLP(LIBRO.precio)}) te mete al sorteo de{" "}
                <b className="text-white">2 entradas para BTS</b> · Estadio Nacional · oct 2026.
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <button className="w-full rounded-xl bg-gradient-to-r from-[#a855f7] to-[#d946ef] px-7 py-4 text-base font-extrabold uppercase tracking-wide text-white shadow-[0_0_36px_-6px_rgba(217,70,239,0.8)] transition active:scale-[0.98] hover:brightness-110 sm:w-auto">
                  Quiero participar · {formatCLP(LIBRO.precio)}
                </button>
                <a href="#catalogo" className="text-sm font-semibold text-[#d8b4fe] hover:text-white">Ver los libros ↓</a>
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-4 text-[11px] font-medium text-[#a99bc7] lg:justify-start lg:text-xs">
                <span>🔒 Pago seguro</span>
                <span>⚡ PDF al instante</span>
                <span>🎟️ Tu N° al toque</span>
              </div>
            </div>

            {/* Heroviz — estadio de noche */}
            <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#1a0b35_0%,#0a0418_100%)] lg:h-[440px]">
              <div className="absolute left-1/4 top-0 h-full w-24 -translate-x-1/2 rotate-12 bg-[linear-gradient(180deg,rgba(168,85,247,0.5),transparent)] blur-md mix-blend-screen" />
              <div className="absolute right-1/4 top-0 h-full w-24 translate-x-1/2 -rotate-12 bg-[linear-gradient(180deg,rgba(217,70,239,0.5),transparent)] blur-md mix-blend-screen" />
              <div className="absolute left-1/2 top-0 h-full w-16 -translate-x-1/2 bg-[linear-gradient(180deg,rgba(240,171,252,0.45),transparent)] blur-md mix-blend-screen" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,#05020c)]" />
              <div className="absolute bottom-5 left-0 right-0 flex items-end justify-center gap-1.5 lg:bottom-10 lg:gap-2.5">
                {Array.from({ length: 17 }).map((_, i) => (
                  <span key={i} className="block w-1 rounded-full bg-[#c084fc] motion-safe:animate-pulse lg:w-1.5" style={{ height: `${12 + ((i * 7) % 26)}px`, opacity: 0.5 + ((i % 3) * 0.2) }} />
                ))}
              </div>
              <div className="absolute left-1/2 top-7 -translate-x-1/2 text-4xl drop-shadow-[0_0_16px_rgba(217,70,239,0.8)] lg:top-16 lg:text-6xl">💜</div>
              <div className="absolute bottom-14 left-1/2 flex -translate-x-1/2 gap-3 lg:bottom-24 lg:gap-5">
                <TicketStub className="-rotate-6" />
                <TicketStub className="rotate-6" />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className={`${WRAP} mt-10`}>
            <div className="mx-auto grid max-w-2xl grid-cols-3 gap-2 lg:gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center lg:py-5">
                  <div className="text-lg lg:text-2xl">{s.icon}</div>
                  <div className="text-sm font-black tabular-nums text-[#d946ef] lg:text-xl">{s.value}</div>
                  <div className="text-[10px] leading-tight text-[#a99bc7] lg:text-xs">{s.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-center text-[10px] text-[#6b5d86]">Cifras de ejemplo</p>
          </div>
        </section>

        {/* Carrusel de libros */}
        <section id="catalogo" className="mt-12 lg:mt-20">
          <div className={WRAP}>
            <div className="flex items-end justify-between">
              <SectionTitle kicker="El catálogo" title="Elige tu libro (y tu chance)" />
              <span className="hidden text-sm text-[#6b5d86] lg:block">Pasa el mouse para pausar</span>
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
                  className={`relative rounded-2xl p-5 ${
                    p.popular
                      ? "border border-[#d946ef]/50 bg-gradient-to-br from-[#3b0f6e] to-[#1c0a3a] shadow-[0_0_40px_-12px_rgba(217,70,239,0.7)]"
                      : "border border-white/10 bg-white/[0.04]"
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-2 right-4 rounded-full bg-[#d946ef] px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow-[0_0_16px_-2px_#d946ef]">
                      Más elegido 💜
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-extrabold text-white">{p.nombre}</div>
                      <div className="text-xs text-[#a99bc7]">
                        {p.participaciones} {p.participaciones === 1 ? "participación" : "participaciones"}
                      </div>
                    </div>
                    <div className="text-2xl font-black tabular-nums text-white">{formatCLP(p.precio)}</div>
                  </div>
                  <button
                    className={`mt-4 w-full rounded-lg py-3 text-sm font-extrabold uppercase tracking-wide transition active:scale-[0.98] ${
                      p.popular
                        ? "bg-gradient-to-r from-[#a855f7] to-[#d946ef] text-white hover:brightness-110"
                        : "border border-[#a855f7]/40 text-[#d8b4fe] hover:bg-white/5"
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
                <div key={p.n} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 lg:flex-col lg:p-6">
                  <div className="grid h-9 w-9 flex-none place-items-center rounded-full border border-[#a855f7]/50 bg-[#a855f7]/10 text-sm font-black text-[#d8b4fe] shadow-[0_0_14px_-3px_#a855f7] lg:h-11 lg:w-11 lg:text-base">
                    {p.n}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white lg:text-base">{p.titulo}</div>
                    <div className="mt-0.5 text-[12px] leading-relaxed text-[#c4b5e0] lg:text-sm">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* El premio */}
        <section id="sorteo" className="mt-12 lg:mt-20">
          <div className={WRAP}>
            <div className="relative overflow-hidden rounded-2xl border border-[#d946ef]/40 bg-[linear-gradient(135deg,#1c0a3a,#3b0f6e)] p-6 text-center shadow-[0_0_50px_-16px_rgba(217,70,239,0.8)] lg:flex lg:items-center lg:justify-between lg:p-12 lg:text-left">
              <span className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#d946ef]/40 blur-2xl" />
              <span className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[#a855f7]/40 blur-2xl" />
              <div className="relative">
                <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#f0abfc]">El premio</div>
                <div className="mt-2 text-3xl font-black uppercase text-white drop-shadow-[0_0_18px_rgba(217,70,239,0.6)] lg:text-5xl">{PREMIO.titulo} 💜</div>
                <div className="mt-1 text-sm text-[#c4b5e0] lg:text-base">{PREMIO.detalle} · {PREMIO.fecha}</div>
              </div>
              <button className="relative mt-5 rounded-xl bg-white px-7 py-3.5 text-sm font-extrabold uppercase tracking-wide text-[#3b0f6e] transition hover:bg-white/90 active:scale-[0.98] lg:mt-0">
                Participar ahora
              </button>
            </div>
          </div>
        </section>

        {/* ¡Estás dentro! + Confianza */}
        <section className="mt-12 lg:mt-20">
          <div className={`${WRAP} grid gap-6 lg:grid-cols-2 lg:gap-10`}>
            <div>
              <SectionTitle kicker="Apenas compras" title="Así se siente entrar" />
              <div className="mt-4 rounded-2xl border border-dashed border-[#d946ef]/50 bg-white/[0.04] p-6 text-center">
                <div className="text-2xl">🎉</div>
                <div className="mt-1 text-lg font-black uppercase text-white">¡Estás dentro! 💜</div>
                <p className="mt-1 text-xs text-[#a99bc7]">Tu número de sorteo:</p>
                <div className="mx-auto mt-2 inline-block rounded-lg border border-[#a855f7]/40 bg-[#a855f7]/10 px-4 py-2 font-mono text-lg font-bold tracking-wider text-[#f0abfc] shadow-[0_0_20px_-6px_#a855f7]">
                  {TICKET_EJEMPLO}
                </div>
                <button className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#a855f7] to-[#d946ef] py-2.5 text-sm font-extrabold uppercase tracking-wide text-white transition active:scale-[0.98] hover:brightness-110">
                  Compartir y sumar chances ✨
                </button>
              </div>
            </div>
            <div>
              <SectionTitle kicker="Confianza" title="Sorteo 100% transparente" />
              <p className="mt-3 text-[13px] leading-relaxed text-[#c4b5e0] lg:text-sm">
                El sorteo es <b className="text-white">en vivo por Instagram</b>, con testigos y acta firmada.
                Mostramos a cada ganadora con su número. Nada de cajas negras.
              </p>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="grid h-11 w-11 flex-none place-items-center rounded-full bg-gradient-to-br from-[#a855f7] to-[#d946ef] text-lg">🏆</div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white">Camila R. ganó el sorteo anterior</div>
                  <div className="text-[11px] text-[#8b7caa]">Ticket ARMY-01337 · entregado en vivo · <i>ejemplo</i></div>
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
                  <div key={f.q} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                    <button
                      onClick={() => setOpenFaq(open ? null : idx)}
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-white"
                    >
                      {f.q}
                      <span className={`flex-none text-[#d946ef] transition-transform ${open ? "rotate-45" : ""}`}>＋</span>
                    </button>
                    {open && <p className="px-5 pb-4 text-[13px] leading-relaxed text-[#c4b5e0]">{f.a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-white/10 py-10">
          <div className={`${WRAP} text-center`}>
            <div className="text-lg font-extrabold uppercase tracking-tight">{BRAND}<span className="text-[#d946ef]">💜</span></div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] font-medium text-[#d8b4fe]">
              <a href="#" className="hover:text-white">Bases del sorteo</a>
              <a href="#" className="hover:text-white">Preguntas</a>
              <a href="#" className="hover:text-white">WhatsApp</a>
              <a href="#" className="hover:text-white">Instagram</a>
              <a href="#" className="hover:text-white">TikTok</a>
            </div>
            <p className="mt-4 text-[12px] text-[#a99bc7]">Hecho con 💜 para ARMY Chile</p>
            <p className="mt-2 text-[10px] leading-relaxed text-[#6b5d86]">
              Mockup de diseño · datos de ejemplo · el nombre y la marca definitivos se definen con la clienta.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SectionTitle({ kicker, title, center = false }: { kicker: string; title: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d946ef]">{kicker}</div>
      <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-white lg:text-3xl">{title}</h2>
    </div>
  );
}

function BookCard({ book }: { book: BookItem }) {
  return (
    <div className="w-44 shrink-0 snap-start rounded-2xl border border-white/10 bg-white/[0.04] p-3 lg:w-52">
      <div
        className="relative flex h-52 flex-col justify-between overflow-hidden rounded-xl p-3 shadow-[0_0_30px_-10px_rgba(217,70,239,0.6)] lg:h-64"
        style={{ backgroundImage: `linear-gradient(160deg, ${book.coverFrom}, ${book.coverTo})` }}
      >
        {book.tag && <span className="self-start rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-bold uppercase text-white ring-1 ring-white/30">{book.tag}</span>}
        <div className="text-[12px] font-black uppercase leading-tight text-white drop-shadow">{book.titulo}</div>
        <span className="absolute right-2 top-2 text-sm">💜</span>
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-base font-black tabular-nums text-[#f0abfc]">{formatCLP(book.precio)}</span>
        <span className="text-[10px] font-semibold text-[#8b7caa]">+1 chance</span>
      </div>
      <button className="mt-2 w-full rounded-lg bg-gradient-to-r from-[#a855f7] to-[#d946ef] py-2 text-xs font-extrabold uppercase tracking-wide text-white transition active:scale-[0.98] hover:brightness-110">
        Comprar
      </button>
    </div>
  );
}

function TicketStub({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-12 w-20 rounded-md bg-[#f7e9c9] shadow-[0_0_22px_-4px_rgba(247,233,201,0.6)] lg:h-16 lg:w-28 ${className}`}>
      <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#0a0418]" />
      <span className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#0a0418]" />
      <span className="absolute right-2 top-1.5 text-[10px] lg:text-sm">🎫</span>
      <span className="absolute bottom-1.5 left-2 font-mono text-[8px] font-black text-[#3b0f6e] lg:text-[10px]">BTS · 2026</span>
    </div>
  );
}
