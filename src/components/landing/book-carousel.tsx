// Carrusel de libros con auto-scroll continuo que se pausa al pasar el mouse.
// Usa Embla (la misma librería que usa shadcn/ui por debajo) + el plugin auto-scroll.
import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import { type ReactNode } from "react";

import { type BookItem } from "./mock";

export function BookCarousel({
  items,
  card,
}: {
  items: BookItem[];
  card: (book: BookItem) => ReactNode;
}) {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true },
    [
      AutoScroll({
        speed: 1.1,
        startDelay: 0,
        stopOnInteraction: false, // si arrastran, retoma solo
        stopOnMouseEnter: true, // se queda quieto con el mouse encima
      }),
    ],
  );

  // Duplicamos los items para que el track SIEMPRE desborde el ancho visible:
  // sin overflow, Embla no hace loop ni auto-scroll (en desktop los 5 entran enteros).
  const slides = [...items, ...items, ...items];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 lg:px-10">
      {/* máscara: desvanece los bordes izq/der del carrusel */}
      <div
        ref={emblaRef}
        className="overflow-hidden [-webkit-mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)]"
      >
        <div className="flex gap-4 py-1">
          {slides.map((b, i) => (
            <div key={`${b.id}-${i}`} className="shrink-0">
              {card(b)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
