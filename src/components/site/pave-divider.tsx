import { Reveal } from "@/components/motion/reveal";

// Three ochre tones read as light hitting a row of paving stones.
const TONES = ["bg-cobble-300", "bg-cobble-500", "bg-cobble-700"];

/**
 * The site's signature divider: a row of small pavé stones that lay
 * themselves into place, left to right, when scrolled into view — Sofia's
 * yellow cobblestones, the brand's namesake. Static row without motion/JS.
 */
export function PaveDivider({ className = "" }: { className?: string }) {
  return (
    <Reveal variant="fade" className={`flex items-center justify-center gap-2.5 ${className}`.trim()}>
      {Array.from({ length: 15 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={`pave-stone inline-block h-2 w-2 rotate-45 rounded-[1px] ${TONES[i % TONES.length]}`}
          style={{ transitionDelay: `${i * 45}ms` }}
        />
      ))}
    </Reveal>
  );
}
