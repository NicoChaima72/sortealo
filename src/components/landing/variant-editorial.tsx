// Variante de diseño 3 — "Editorial Boutique" (refinada, serif, marfil). Datos de ejemplo.
// Mobile-first, solo Tailwind. Se migra a shadcn cuando la clienta elija dirección.
import { useState } from "react";
import {
  BRAND,
  FAQS,
  formatCLP,
  LIBRO,
  PACKS,
  PASOS,
  PREMIO,
  SORTEO_DEADLINE_ISO,
  STATS,
  TICKET_EJEMPLO,
} from "./mock";
import { formatCompact, useCountdown } from "./use-countdown";

export function VariantEditorial() {
  const cd = useCountdown(SORTEO_DEADLINE_ISO);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen w-full bg-[#ece7df] text-[#1a1625]">
      <div className="mx-auto w-full max-w-[440px] bg-[#faf7f2] px-6 pb-24 shadow-[0_0_60px_-20px_rgba(0,0,0,0.2)]">

        {/* Topbar */}
        <header className="sticky top-0 z-30 -mx-6 mb-2 flex items-center gap-3 border-b border-[#e3dcd0] bg-[#faf7f2]/85 px-6 py-3.5 backdrop-blur-md">
          <span className="font-serif text-xl font-bold italic tracking-tight">{BRAND}</span>
          <span className="ml-auto font-mono text-[11px] tabular-nums text-[#8a8175]">
            cierra en {formatCompact(cd)}
          </span>
          <button aria-label="Carrito" className="text-[#6d28d9]">🛒</button>
        </header>

        {/* Hero */}
        <section className="pt-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a8175]">
            Sorteo abierto — edición ARMY
          </div>
          <h1 className="mt-5 font-serif text-[2.9rem] font-bold leading-[1.02] tracking-[-0.01em] text-[#1a1625]">
            Compra el libro.<br />Anda a ver a <span className="italic text-[#6d28d9]">BTS</span>.
          </h1>
          <p className="mt-5 max-w-[40ch] text-[15px] leading-relaxed text-[#534e59]">
            Cada libro que compras ({formatCLP(LIBRO.precio)}) te inscribe en el sorteo de{" "}
            <span className="font-semibold text-[#1a1625]">2 entradas para BTS</span> en el Estadio Nacional, octubre 2026.
          </p>

          {/* Heroviz — trazo fino */}
          <div className="mt-8 border-y border-[#e3dcd0] py-7">
            <svg viewBox="0 0 320 150" className="mx-auto w-full max-w-[300px]" fill="none" stroke="#6d28d9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              {/* horizonte estadio */}
              <path d="M10 110 Q160 60 310 110" stroke="#c9bfb0" />
              <path d="M30 110 Q160 78 290 110" stroke="#c9bfb0" />
              <ellipse cx="160" cy="112" rx="150" ry="26" stroke="#e3dcd0" />
              {/* haces de luz finos */}
              <path d="M70 105 L40 30" stroke="#6d28d9" strokeWidth="0.8" opacity="0.5" />
              <path d="M250 105 L285 30" stroke="#6d28d9" strokeWidth="0.8" opacity="0.5" />
              <path d="M160 100 L160 22" stroke="#6d28d9" strokeWidth="0.8" opacity="0.4" />
              {/* dos tickets */}
              <g transform="translate(108 60) rotate(-7)">
                <rect x="0" y="0" width="46" height="30" rx="3" />
                <line x1="32" y1="0" x2="32" y2="30" strokeDasharray="2 2" stroke="#c9bfb0" />
              </g>
              <g transform="translate(150 58) rotate(7)">
                <rect x="0" y="0" width="46" height="30" rx="3" />
                <line x1="32" y1="0" x2="32" y2="30" strokeDasharray="2 2" stroke="#c9bfb0" />
              </g>
              {/* corazón */}
              <path d="M160 40 c-4 -7 -15 -4 -15 4 c0 6 9 11 15 15 c6 -4 15 -9 15 -15 c0 -8 -11 -11 -15 -4 z" fill="#6d28d9" stroke="none" />
            </svg>
          </div>

          <button className="mt-7 w-full bg-[#6d28d9] px-6 py-4 text-[15px] font-semibold tracking-wide text-white transition hover:bg-[#5b21b6] active:scale-[0.99]">
            Quiero participar — {formatCLP(LIBRO.precio)}
          </button>
          <div className="mt-4 flex justify-center gap-5 text-[11px] tracking-wide text-[#8a8175]">
            <span>Pago seguro</span><span>·</span><span>PDF al instante</span><span>·</span><span>Tu N° al toque</span>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-8 flex items-stretch divide-x divide-[#e3dcd0] border-y border-[#e3dcd0] text-center">
          {STATS.map((s) => (
            <div key={s.label} className="flex-1 px-2 py-4">
              <div className="font-serif text-xl font-bold tabular-nums text-[#1a1625]">{s.value}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[#8a8175]">{s.label}</div>
            </div>
          ))}
        </section>
        <p className="mt-1.5 text-right text-[10px] italic text-[#a89f92]">cifras de ejemplo</p>

        {/* El libro */}
        <Section roman="I" kicker="El libro" title="El objeto del deseo">
          <div className="mt-5 flex gap-5">
            <BookCover />
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-[17px] font-bold italic leading-snug text-[#1a1625]">«{LIBRO.titulo}»</h3>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-[#8a8175]">{LIBRO.autora}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-[#534e59]">{LIBRO.descripcion}</p>
              <div className="mt-4 font-serif text-2xl font-bold tabular-nums text-[#6d28d9]">{formatCLP(LIBRO.precio)}</div>
            </div>
          </div>
        </Section>

        {/* Packs */}
        <Section roman="II" kicker="Elige tu pack" title="Más libros, más chances">
          <div className="mt-5 grid gap-3">
            {PACKS.map((p) => (
              <div key={p.id} className={`flex items-center justify-between border p-4 ${p.popular ? "border-[#6d28d9] bg-[#f1ecfa]" : "border-[#e3dcd0] bg-white"}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-bold">{p.nombre}</span>
                    {p.popular && <span className="bg-[#6d28d9] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">Más elegido</span>}
                  </div>
                  <div className="text-xs text-[#8a8175]">{p.participaciones} {p.participaciones === 1 ? "participación" : "participaciones"}</div>
                  <div className="mt-1 font-serif text-xl font-bold tabular-nums text-[#1a1625]">{formatCLP(p.precio)}</div>
                </div>
                <button className={`px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${p.popular ? "bg-[#6d28d9] text-white hover:bg-[#5b21b6]" : "border border-[#1a1625] text-[#1a1625] hover:bg-[#1a1625] hover:text-white"}`}>
                  Comprar
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Cómo funciona */}
        <Section roman="III" kicker="El método" title="Comprar es participar">
          <div className="mt-5 grid gap-5">
            {PASOS.map((p) => (
              <div key={p.n} className="flex gap-4 border-b border-[#e3dcd0] pb-5 last:border-0 last:pb-0">
                <div className="font-serif text-3xl font-bold italic text-[#6d28d9]">{p.n}</div>
                <div>
                  <div className="font-serif text-base font-bold text-[#1a1625]">{p.titulo}</div>
                  <div className="mt-1 text-[13px] leading-relaxed text-[#534e59]">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* El premio */}
        <section className="mt-12">
          <div className="border border-[#6d28d9]/30 bg-[#f1ecfa] p-7 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6d28d9]">El premio</div>
            <div className="mt-3 font-serif text-[2rem] font-bold leading-tight text-[#1a1625]">{PREMIO.titulo}</div>
            <div className="mt-2 text-sm italic text-[#534e59]">{PREMIO.detalle} · {PREMIO.fecha}</div>
          </div>
        </section>

        {/* ¡Estás dentro! */}
        <Section roman="IV" kicker="Apenas compras" title="Así se siente entrar">
          <div className="mt-5 border border-[#e3dcd0] bg-white p-6 text-center">
            <div className="font-serif text-xl font-bold italic text-[#1a1625]">¡Estás dentro!</div>
            <p className="mt-2 text-[11px] uppercase tracking-wider text-[#8a8175]">Tu número de sorteo</p>
            <div className="mt-2 font-mono text-2xl font-bold tracking-[0.15em] text-[#6d28d9]">{TICKET_EJEMPLO}</div>
            <button className="mt-5 w-full border border-[#1a1625] py-2.5 text-sm font-semibold text-[#1a1625] transition hover:bg-[#1a1625] hover:text-white">
              Compartir y sumar más chances
            </button>
          </div>
        </Section>

        {/* Confianza */}
        <Section roman="V" kicker="Confianza" title="Un sorteo a la vista de todas">
          <p className="mt-3 text-[14px] leading-relaxed text-[#534e59]">
            El sorteo es <span className="font-semibold text-[#1a1625]">en vivo por Instagram</span>, con testigos y acta firmada.
            Cada ganadora aparece con su número. Transparencia, no promesas.
          </p>
          <div className="mt-5 flex items-center gap-4 border-l-2 border-[#6d28d9] bg-[#f1ecfa]/60 p-4">
            <div className="font-serif text-2xl">🏆</div>
            <div>
              <div className="font-serif text-[15px] font-bold italic text-[#1a1625]">Camila R. ganó el sorteo anterior</div>
              <div className="text-[11px] text-[#8a8175]">Ticket ARMY-01337 · entregado en vivo · <i>ejemplo</i></div>
            </div>
          </div>
        </Section>

        {/* FAQ */}
        <Section roman="VI" kicker="Dudas" title="Preguntas frecuentes">
          <div className="mt-5 divide-y divide-[#e3dcd0] border-y border-[#e3dcd0]">
            {FAQS.map((f, idx) => {
              const open = openFaq === idx;
              return (
                <div key={f.q}>
                  <button onClick={() => setOpenFaq(open ? null : idx)} className="flex w-full items-center justify-between gap-3 py-4 text-left">
                    <span className="font-serif text-[15px] font-semibold text-[#1a1625]">{f.q}</span>
                    <span className={`flex-none text-[#6d28d9] transition-transform ${open ? "rotate-45" : ""}`}>＋</span>
                  </button>
                  {open && <p className="pb-4 text-[13px] leading-relaxed text-[#534e59]">{f.a}</p>}
                </div>
              );
            })}
          </div>
        </Section>

        {/* Footer */}
        <footer className="mt-12 border-t border-[#1a1625]/15 pt-7 text-center">
          <div className="font-serif text-lg font-bold italic">{BRAND}</div>
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-[#6d28d9]">
            <a href="#" className="hover:underline">Bases del sorteo</a>
            <a href="#" className="hover:underline">Preguntas</a>
            <a href="#" className="hover:underline">WhatsApp</a>
            <a href="#" className="hover:underline">Instagram</a>
            <a href="#" className="hover:underline">TikTok</a>
          </div>
          <p className="mt-4 text-[12px] italic text-[#8a8175]">Hecho con 💜 para ARMY Chile</p>
          <p className="mt-2 text-[10px] leading-relaxed text-[#a89f92]">
            Mockup de diseño · datos de ejemplo · el nombre y la marca definitivos se definen con la clienta.
          </p>
        </footer>
      </div>
    </div>
  );
}

function Section({ roman, kicker, title, children }: { roman: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="flex items-baseline gap-3">
        <span className="font-serif text-sm font-bold italic text-[#6d28d9]">{roman}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a8175]">{kicker}</span>
      </div>
      <h2 className="mt-2 font-serif text-[1.7rem] font-bold leading-tight tracking-tight text-[#1a1625]">{title}</h2>
      {children}
    </section>
  );
}

function BookCover() {
  return (
    <div className="relative h-36 w-24 flex-none border border-[#1a1625]/10 bg-[linear-gradient(160deg,#6d28d9,#9333ea)] shadow-[6px_8px_0_0_rgba(26,22,37,0.08)]">
      <div className="absolute inset-0 p-2.5">
        <div className="font-serif text-[9px] font-bold uppercase leading-tight text-white">Cómo enriquecer a tu idol favorito</div>
        <div className="absolute bottom-2 left-2.5 text-[7px] italic text-white/70">borahae</div>
      </div>
    </div>
  );
}
