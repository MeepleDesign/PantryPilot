/**
 * Small decorative SVG illustrations. All colours come from theme tokens
 * (brand / accent / surface / border) so they adapt to dark mode and the
 * user's accent preset. Purely decorative: always aria-hidden.
 */

const stroke = "color-mix(in oklab, var(--brand) 55%, var(--foreground))";

/** A pot on the hob next to a couple of pantry jars. */
export function KitchenIllustration({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 200 110" fill="none" className={className}>
      {/* shelf line */}
      <path d="M8 100h184" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
      {/* jar 1 */}
      <rect x="18" y="50" width="30" height="48" rx="7" fill="var(--surface)" stroke={stroke} strokeOpacity="0.5" strokeWidth="2" />
      <rect x="16" y="42" width="34" height="10" rx="3" fill="var(--accent)" fillOpacity="0.8" />
      <rect x="22" y="66" width="22" height="28" rx="4" fill="var(--accent)" fillOpacity="0.25" />
      <circle cx="28" cy="74" r="2.5" fill="var(--accent)" fillOpacity="0.7" />
      <circle cx="36" cy="82" r="2.5" fill="var(--accent)" fillOpacity="0.7" />
      <circle cx="30" cy="88" r="2.5" fill="var(--accent)" fillOpacity="0.7" />
      {/* jar 2 */}
      <rect x="54" y="62" width="24" height="36" rx="6" fill="var(--surface)" stroke={stroke} strokeOpacity="0.5" strokeWidth="2" />
      <rect x="52" y="56" width="28" height="8" rx="3" fill="var(--brand)" fillOpacity="0.75" />
      <path d="M58 82h16M58 88h16M58 76h16" stroke="var(--brand)" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
      {/* pot */}
      <path d="M96 64h80v22a12 12 0 0 1-12 12h-56a12 12 0 0 1-12-12V64Z" fill="var(--brand)" fillOpacity="0.85" />
      <rect x="92" y="58" width="88" height="9" rx="4.5" fill="var(--brand-dark)" />
      <path d="M90 72h-6M182 72h6" stroke="var(--brand-dark)" strokeWidth="4" strokeLinecap="round" />
      <rect x="128" y="51" width="24" height="7" rx="3.5" fill="var(--brand-dark)" />
      <path d="M108 78h56" stroke="var(--surface)" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
      {/* steam */}
      <g stroke={stroke} strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round">
        <path d="M122 44c-4-4 4-8 0-12s4-8 0-12" />
        <path d="M140 40c-4-4 4-8 0-12s4-8 0-12" />
        <path d="M158 44c-4-4 4-8 0-12s4-8 0-12" />
      </g>
      {/* sparkle */}
      <path d="M70 18v10M65 23h10" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="186" cy="24" r="3" fill="var(--accent)" fillOpacity="0.6" />
    </svg>
  );
}

/** A loose arrangement of groceries — used on the sign-in page. */
export function GroceriesIllustration({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 240 120" fill="none" className={className}>
      <ellipse cx="120" cy="108" rx="104" ry="8" fill="var(--brand)" fillOpacity="0.08" />
      {/* bag */}
      <path d="M84 46h72l-6 60H90l-6-60Z" fill="var(--surface)" stroke={stroke} strokeOpacity="0.45" strokeWidth="2" />
      <path d="M104 46v-8a16 16 0 0 1 32 0v8" stroke={stroke} strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M96 70h48" stroke="var(--brand)" strokeOpacity="0.25" strokeWidth="6" strokeLinecap="round" />
      {/* baguette */}
      <rect x="128" y="10" width="14" height="52" rx="7" transform="rotate(18 135 36)" fill="var(--accent)" fillOpacity="0.85" />
      <path d="M134 22l6 2M131 32l6 2M128 42l6 2" stroke="var(--surface)" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
      {/* leafy greens */}
      <path d="M100 48c-10-14-4-30 6-32 4 10 2 22-6 32Z" fill="var(--brand)" fillOpacity="0.8" />
      <path d="M108 48c0-14 10-24 18-22-2 10-8 18-18 22Z" fill="var(--brand)" fillOpacity="0.55" />
      {/* tomato */}
      <circle cx="40" cy="92" r="14" fill="var(--accent)" fillOpacity="0.9" />
      <path d="M34 79l6 4 6-4" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* carrot */}
      <path d="M58 104l22-34c2-3 7-1 6 2l-14 36c-1 3-6 3-8 0l-6-4Z" fill="var(--accent)" fillOpacity="0.65" />
      <path d="M84 66l4-8M86 68l8-4" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" />
      {/* tin */}
      <rect x="168" y="70" width="30" height="36" rx="4" fill="var(--brand)" fillOpacity="0.8" />
      <rect x="168" y="80" width="30" height="14" fill="var(--surface)" fillOpacity="0.85" />
      <ellipse cx="183" cy="70" rx="15" ry="3.5" fill="var(--brand-dark)" />
      {/* egg */}
      <ellipse cx="214" cy="98" rx="9" ry="11" fill="var(--surface)" stroke={stroke} strokeOpacity="0.4" strokeWidth="2" />
      {/* sparkles */}
      <path d="M30 30v10M25 35h10" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M210 30v8M206 34h8" stroke="var(--brand)" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="62" cy="40" r="3" fill="var(--brand)" fillOpacity="0.35" />
    </svg>
  );
}
