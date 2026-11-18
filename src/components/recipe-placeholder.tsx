/**
 * Decorative stand-in for recipes without a photo. Draws a small plate-and-
 * cutlery illustration over a soft tinted background. Colours come from the
 * theme tokens (brand / accent), so it follows light/dark mode and the
 * user's accent choice. A stable hash of the recipe name picks one of a few
 * tint variants so a grid of photo-less recipes doesn't look uniform.
 */

const VARIANTS = [
  { bg: "var(--brand)", plate: "var(--brand)", food: "var(--accent)" },
  { bg: "var(--accent)", plate: "var(--accent)", food: "var(--brand)" },
  { bg: "var(--brand-dark)", plate: "var(--brand)", food: "var(--accent)" },
] as const;

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function RecipePlaceholder({
  name = "",
  size = "md",
  className = "",
}: {
  name?: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const v = VARIANTS[hash(name) % VARIANTS.length];
  const showCutlery = size !== "xs";

  return (
    <div
      aria-hidden
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 90% at 20% 10%, color-mix(in oklab, ${v.bg} 16%, var(--surface)), color-mix(in oklab, ${v.bg} 7%, var(--background)))`,
      }}
    >
      {/* soft dotted texture */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `radial-gradient(color-mix(in oklab, ${v.bg} 22%, transparent) 1px, transparent 1.2px)`,
          backgroundSize: size === "xs" ? "6px 6px" : "12px 12px",
        }}
      />
      <svg
        viewBox="0 0 120 80"
        className={
          size === "xs" ? "relative h-9 w-9" : size === "sm" ? "relative h-14 w-20" : "relative h-24 w-36"
        }
        fill="none"
      >
        {showCutlery && (
          <>
            {/* fork */}
            <g stroke={`color-mix(in oklab, ${v.plate} 55%, var(--muted))`} strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 18v14M22 18v14M26 18v14" />
              <path d="M18 32c0 4 8 4 8 0" />
              <path d="M22 35v28" />
            </g>
            {/* knife */}
            <g stroke={`color-mix(in oklab, ${v.plate} 55%, var(--muted))`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M98 63V18c5 4 6 13 0 20" />
            </g>
          </>
        )}
        {/* plate */}
        <circle cx="60" cy="42" r="27" fill="var(--surface)" stroke={`color-mix(in oklab, ${v.plate} 30%, var(--border))`} strokeWidth="2" />
        <circle cx="60" cy="42" r="19" fill={`color-mix(in oklab, ${v.plate} 8%, var(--surface))`} stroke={`color-mix(in oklab, ${v.plate} 22%, var(--border))`} strokeWidth="1.5" />
        {/* food blobs */}
        <circle cx="54" cy="44" r="6.5" fill={`color-mix(in oklab, ${v.food} 70%, var(--surface))`} />
        <circle cx="65" cy="39" r="5" fill={`color-mix(in oklab, ${v.plate} 65%, var(--surface))`} />
        <circle cx="64" cy="49" r="3.5" fill={`color-mix(in oklab, ${v.food} 45%, var(--surface))`} />
        <path d="M50 36c2-2 5-2 6 0" stroke={`color-mix(in oklab, ${v.plate} 70%, var(--surface))`} strokeWidth="1.8" strokeLinecap="round" />
        {/* steam */}
        {showCutlery && (
          <g stroke={`color-mix(in oklab, ${v.plate} 35%, var(--border))`} strokeWidth="1.8" strokeLinecap="round">
            <path d="M54 12c-2 2 2 4 0 6" />
            <path d="M60 9c-2 2 2 4 0 6" />
            <path d="M66 12c-2 2 2 4 0 6" />
          </g>
        )}
      </svg>
    </div>
  );
}
