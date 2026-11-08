"use client";

import { useState, useTransition } from "react";
import { rateRecipe, clearRating } from "@/lib/actions/ratings";

export function StaticStars({
  value,
  count,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const textSize = size === "md" ? "text-base" : "text-xs";
  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      <span className="tracking-tight text-accent">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{n <= Math.round(value) ? "★" : "☆"}</span>
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

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted">Your rating:</span>
      <div
        className="flex gap-0.5 text-xl leading-none"
        onMouseLeave={() => setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={pending}
            onMouseEnter={() => setHovered(n)}
            onClick={() => handleClick(n)}
            className={`transition disabled:opacity-60 ${
              n <= display ? "text-accent" : "text-border"
            }`}
            aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
          >
            ★
          </button>
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
