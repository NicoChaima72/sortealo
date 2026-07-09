import Head from "next/head";
import { type ComponentType, useState } from "react";

import { VariantConcert } from "~/components/landing/variant-concert";
import { VariantDreamy } from "~/components/landing/variant-dreamy";
import { VariantEditorial } from "~/components/landing/variant-editorial";

interface VariantDef {
  id: string;
  label: string;
  Comp: ComponentType;
}

// Propuestas de diseño de la cara compradora. Mock data, solo Tailwind.
// Cuando la clienta elija una, ese componente se migra a shadcn/ui y se conecta a datos reales.
const VARIANTS: VariantDef[] = [
  { id: "dreamy", label: "Dreamy", Comp: VariantDreamy },
  { id: "concert", label: "Concert", Comp: VariantConcert },
  { id: "editorial", label: "Editorial", Comp: VariantEditorial },
];

export default function Home() {
  const [active, setActive] = useState(0);
  const current = VARIANTS[active] ?? VARIANTS[0];
  const Active = current?.Comp ?? VariantDreamy;

  return (
    <>
      <Head>
        <title>borahae · propuestas de diseño</title>
        <meta name="description" content="Propuestas de diseño — tienda de libros con sorteo para ARMY Chile" />
      </Head>

      <Active />

      {VARIANTS.length > 1 && (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-[#1a1130]/90 p-1 text-white shadow-2xl backdrop-blur">
          <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">Diseño</span>
          {VARIANTS.map((v, i) => (
            <button
              key={v.id}
              onClick={() => setActive(i)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                i === active ? "bg-white text-[#1a1130]" : "text-white/70 hover:text-white"
              }`}
            >
              {i + 1} · {v.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
