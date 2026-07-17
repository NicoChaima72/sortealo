import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

/**
 * Tailwind acotado a LAYOUT (ADR-0011 / supuesto S-TW). Color, tipografía, radios y sombras
 * salen del theme de Mantine — NO de Tailwind. Por eso se retiraron los tokens de color
 * shadcn, el `borderRadius` por CSS var y el plugin `tailwindcss-animate`. Quedan `content`,
 * `darkMode` y `fontFamily` (para que las utilities `font-sans` resuelvan a Geist).
 */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
    },
  },
  plugins: [],
} satisfies Config;
