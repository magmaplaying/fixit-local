/**
 * Brand mark: four pavé stones. Three sit seated in the diagonal grid
 * (the divider's 700/500/300 light-across-the-row tones); the fourth is
 * lifted and tilted — the stone being laid, the job "под ръка". Hovering
 * the lockup seats it (transition lives in globals.css, motion-gated).
 */
export function PaveMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={`shrink-0 ${className}`}>
      {/* seated stones: left, bottom, right */}
      <rect
        x="3.9"
        y="11.3"
        width="9.4"
        height="9.4"
        rx="0.8"
        transform="rotate(45 8.6 16)"
        fill="var(--color-cobble-700)"
      />
      <rect
        x="11.3"
        y="18.7"
        width="9.4"
        height="9.4"
        rx="0.8"
        transform="rotate(45 16 23.4)"
        fill="var(--color-cobble-500)"
      />
      <rect
        x="18.7"
        y="11.3"
        width="9.4"
        height="9.4"
        rx="0.8"
        transform="rotate(45 23.4 16)"
        fill="var(--color-cobble-300)"
      />
      {/* the loose stone, mid-air above its slot */}
      <g className="logo-stone">
        <rect
          x="11.3"
          y="3.9"
          width="9.4"
          height="9.4"
          rx="0.8"
          transform="rotate(45 16 8.6)"
          fill="var(--color-cobble-400)"
        />
      </g>
    </svg>
  );
}

/** Mark + wordmark lockup used in the navbar and footer. */
export function Logo({
  markClassName = "h-7 w-7",
  textClassName = "text-xl",
}: {
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <PaveMark className={markClassName} />
      <span className={`font-display font-semibold tracking-tight ${textClassName}`}>
        Под <span className="text-cobble-600">ръка</span>
      </span>
    </span>
  );
}
