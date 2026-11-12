"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { rateRecipe, clearRating } from "@/lib/actions/ratings";

function StarGlyph({ fill, size }: { fill: number; size: "sm" | "md" | "lg" }) {
  const px = size === "lg" ? 24 : size === "md" ? 18 : 14;
  const clamped = Math.max(0, Math.min(1, fill));
  return (
    <span className="relative inline-block shrink-0" style={{ width: px, height: px }}>
      <Star className="absolute inset-0 text-border" width={px} height={px} />
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${clamped * 100}%` }}
      >
        <Star
          className="text-accent"
          width={px}
          height={px}
          fill="currentColor"
        />
      </span>
    </span>
  );
}

export function StaticStars({
  value,
  count,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const textSize = size === "md" ? "text-sm" : "text-xs";
  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      <span className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <StarGlyph key={i} fill={value - i} size={size} />
        ))}
      </span>
      {count != null && <span className="text-muted">({count})</span>}
    </span>
  );
}

export function InteractiveStars({
  recipeId,
  initialRating,
}: {
  recipeId: string;
  initialRating: number;
}) {
  const [rating, setRating] = useState(initialRating);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const display = hovered ?? rating;

  function handleClick(n: number) {
    if (pending) return;
    if (n === rating) {
      setRating(0);
      startTransition(() => clearRating(recipeId));
      return;
    }
    setRating(n);
    startTransition(() => rateRecipe(recipeId, n));
  }

  function valueFromPointer(e: React.MouseEvent<HTMLDivElement>, starIndex: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    return starIndex + (fraction < 0.5 ? 0.5 : 1);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted">Your rating:</span>
      <div className="flex gap-0.5" onMouseLeave={() => setHovered(null)}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            role="button"
            tabIndex={0}
            aria-label={`Rate ${i + 1} star${i === 0 ? "" : "s"}`}
            onMouseMove={(e) => !pending && setHovered(valueFromPointer(e, i))}
            onClick={(e) => !pending && handleClick(valueFromPointer(e, i))}
            className="cursor-pointer disabled:opacity-60"
          >
            <StarGlyph fill={display - i} size="lg" />
          </div>
        ))}
      </div>
      {rating > 0 && (
        <button
          type="button"
          disabled={pending}
          onClick={() => handleClick(rating)}
          className="text-xs text-muted hover:text-danger"
        >
          Clear
        </button>
      )}
    </div>
  );
}
