"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  List,
  Rows3,
  Grid2x2,
  LayoutGrid,
  UtensilsCrossed,
  Clock,
  Flame,
} from "lucide-react";
import { StaticStars } from "@/components/star-rating";
import type { Recipe } from "@/lib/types";

type ViewMode = "list" | "list-details" | "tiles-small" | "tiles-medium";

const STORAGE_KEY = "pantrypilot:recipes-view";
const DEFAULT_VIEW: ViewMode = "tiles-medium";

const VIEW_OPTIONS: { mode: ViewMode; label: string; icon: typeof List }[] = [
  { mode: "list", label: "List", icon: List },
  { mode: "list-details", label: "List with details", icon: Rows3 },
  { mode: "tiles-small", label: "Small tiles", icon: Grid2x2 },
  { mode: "tiles-medium", label: "Medium tiles", icon: LayoutGrid },
];

function useViewMode() {
  const [view, setView] = useState<ViewMode>(DEFAULT_VIEW);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as ViewMode | null;
      if (stored && VIEW_OPTIONS.some((o) => o.mode === stored)) {
        setView(stored);
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  function update(mode: ViewMode) {
    setView(mode);
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }

  return { view, setView: update, ready };
}

export function RecipeBrowser({
  recipes,
  ratings,
}: {
  recipes: Recipe[];
  ratings: Record<string, number[]>;
}) {
  const { view, setView } = useViewMode();

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          {VIEW_OPTIONS.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              aria-label={label}
              title={label}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                view === mode
                  ? "bg-brand/10 text-brand-dark"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {view === "list" && <ListView recipes={recipes} ratings={ratings} />}
      {view === "list-details" && <ListDetailsView recipes={recipes} ratings={ratings} />}
      {view === "tiles-small" && <TilesView recipes={recipes} ratings={ratings} size="small" />}
      {view === "tiles-medium" && <TilesView recipes={recipes} ratings={ratings} size="medium" />}
    </div>
  );
}

function avgOf(ratings: number[]) {
  return ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
}

function courseLabel(recipe: Recipe) {
  return recipe.course[0].toUpperCase() + recipe.course.slice(1);
}

function ListView({
  recipes,
  ratings,
}: {
  recipes: Recipe[];
  ratings: Record<string, number[]>;
}) {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface shadow-sm">
      {recipes.map((recipe) => {
        const r = ratings[recipe.id] ?? [];
        return (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.id}`}
            className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-background"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium">{recipe.name}</span>
              {recipe.protein_tag && (
                <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand-dark">
                  {recipe.protein_tag}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs text-muted">
              {r.length > 0 ? (
                <StaticStars value={avgOf(r)} />
              ) : (
                <span className="text-muted">—</span>
              )}
              <span className="hidden sm:inline">{courseLabel(recipe)}</span>
              {recipe.total_time_minutes && (
                <span className="hidden items-center gap-1 sm:flex">
                  <Clock className="h-3.5 w-3.5" /> {recipe.total_time_minutes}m
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ListDetailsView({
  recipes,
  ratings,
}: {
  recipes: Recipe[];
  ratings: Record<string, number[]>;
}) {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface shadow-sm">
      {recipes.map((recipe) => {
        const r = ratings[recipe.id] ?? [];
        return (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.id}`}
            className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-background"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-background">
              {recipe.image_url ? (
                <Image
                  src={recipe.image_url}
                  alt={recipe.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted">
                  <UtensilsCrossed className="h-5 w-5" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{recipe.name}</span>
                {recipe.protein_tag && (
                  <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand-dark">
                    {recipe.protein_tag}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted">
                {[courseLabel(recipe), recipe.cuisine, recipe.diet].filter(Boolean).join(" · ")}
                {recipe.tags?.length ? ` · ${recipe.tags.join(", ")}` : ""}
              </p>
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-1 text-xs text-muted sm:flex">
              {r.length > 0 ? (
                <StaticStars value={avgOf(r)} count={r.length} />
              ) : (
                <span>No ratings yet</span>
              )}
              <div className="flex gap-3">
                {recipe.total_time_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {recipe.total_time_minutes} min
                  </span>
                )}
                {recipe.calories && (
                  <span className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5" /> {recipe.calories} kcal
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function TilesView({
  recipes,
  ratings,
  size,
}: {
  recipes: Recipe[];
  ratings: Record<string, number[]>;
  size: "small" | "medium";
}) {
  const gridClass =
    size === "small"
      ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
  const imgHeight = size === "small" ? "h-20" : "h-32";
  const iconSize = size === "small" ? "h-5 w-5" : "h-8 w-8";
  const padding = size === "small" ? "p-2.5" : "p-4";

  return (
    <div className={gridClass}>
      {recipes.map((recipe) => {
        const r = ratings[recipe.id] ?? [];
        const avgRating = avgOf(r);
        return (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.id}`}
            className="block overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
          >
            {recipe.image_url ? (
              <div className={`relative w-full ${imgHeight}`}>
                <Image
                  src={recipe.image_url}
                  alt={recipe.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className={`flex w-full items-center justify-center bg-background text-muted ${imgHeight}`}>
                <UtensilsCrossed className={iconSize} strokeWidth={1.5} />
              </div>
            )}
            <div className={padding}>
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className={`font-medium leading-snug ${size === "small" ? "text-sm" : ""}`}>
                  {recipe.name}
                </h3>
                {size === "medium" && recipe.protein_tag && (
                  <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand-dark">
                    {recipe.protein_tag}
                  </span>
                )}
              </div>
              {size === "medium" && (
                <p className="mb-1 text-xs text-muted">
                  {[courseLabel(recipe), recipe.cuisine, recipe.diet].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className={size === "small" ? "mb-1" : "mb-2"}>
                {r.length > 0 ? (
                  <StaticStars value={avgRating} count={size === "medium" ? r.length : undefined} />
                ) : (
                  <span className="text-xs text-muted">
                    {size === "small" ? "—" : "No ratings yet"}
                  </span>
                )}
              </div>
              {size === "medium" && recipe.tags?.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {recipe.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-background px-2 py-0.5 text-[11px] text-muted"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {size === "medium" ? (
                <div className="flex flex-wrap gap-3 text-xs text-muted">
                  {recipe.total_time_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {recipe.total_time_minutes} min
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <UtensilsCrossed className="h-3.5 w-3.5" /> 2 servings
                  </span>
                  {recipe.calories && (
                    <span className="flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5" /> {recipe.calories} kcal
                    </span>
                  )}
                </div>
              ) : (
                recipe.total_time_minutes && (
                  <span className="flex items-center gap-1 text-[11px] text-muted">
                    <Clock className="h-3 w-3" /> {recipe.total_time_minutes} min
                  </span>
                )
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
