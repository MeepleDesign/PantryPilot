"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

/**
 * Layout wrapper for the recipe filter form. On phones the filters collapse
 * behind a "Filters" toggle (showing how many are active); from sm upwards
 * they sit inline as before. The fields stay inside the same GET form, so
 * submitting behaves exactly as it did.
 */
export function RecipeFilterBar({
  q,
  activeCount,
  children,
}: {
  q: string;
  activeCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <form method="get" className="mb-6 flex flex-wrap gap-3">
      <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search recipes…"
          aria-label="Search recipes"
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-brand"
        />
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors sm:hidden ${
          open || activeCount > 0
            ? "border-brand/40 bg-brand/10 text-brand-dark"
            : "border-border bg-surface"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-brand-foreground">
            {activeCount}
          </span>
        )}
      </button>
      <div
        className={`${open ? "grid" : "hidden"} w-full grid-cols-2 gap-2 sm:contents`}
      >
        {children}
      </div>
    </form>
  );
}
