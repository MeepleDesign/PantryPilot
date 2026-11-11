"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Flag, UtensilsCrossed, Users } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { EmptyState } from "@/components/empty-state";
import { importCommunityRecipe, reportCommunityRecipe, unshareRecipe } from "@/lib/actions/community-recipes";

export type CommunityRecipeCard = {
  id: string;
  name: string;
  cuisine: string | null;
  course: string;
  isOwn: boolean;
  sharedByName: string | null;
  rating: { avg: number; count: number } | null;
  importCount: number;
  imageUrl: string | null;
};

export function CommunityRecipeList({ recipes }: { recipes: CommunityRecipeCard[] }) {
  if (!recipes.length) {
    return (
      <div className="rounded-xl border border-dashed border-border">
        <EmptyState icon={Users} title="No community recipes match yet" />
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface shadow-sm">
      {recipes.map((recipe) => (
        <CommunityRecipeRow key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}

function CommunityRecipeRow({ recipe }: { recipe: CommunityRecipeCard }) {
  const [pending, startTransition] = useTransition();
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reported, setReported] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-background">
          {recipe.imageUrl ? (
            <Image src={recipe.imageUrl} alt={recipe.name} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted">
              <UtensilsCrossed className="h-5 w-5" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <Link href={`/recipes/${recipe.id}`} className="font-medium hover:text-brand">
            {recipe.name}
          </Link>
          <p className="text-xs text-muted">
            {[recipe.course[0].toUpperCase() + recipe.course.slice(1), recipe.cuisine]
              .filter(Boolean)
              .join(" · ")}
            {recipe.rating && recipe.rating.count > 0
              ? ` · ${recipe.rating.avg.toFixed(1)}★ (${recipe.rating.count})`
              : " · No ratings yet"}
            {recipe.importCount > 0
              ? ` · Imported ${recipe.importCount} time${recipe.importCount === 1 ? "" : "s"}`
              : ""}
            {recipe.isOwn ? " · Your recipe" : recipe.sharedByName ? ` · Shared by ${recipe.sharedByName}` : ""}
          </p>
        </div>
      </div>

      {recipe.isOwn ? (
        <button
          disabled={pending}
          onClick={() => startTransition(() => unshareRecipe(recipe.id))}
          className="shrink-0 text-xs font-medium text-muted hover:text-foreground"
        >
          Unshare
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-3">
          <button
            disabled={pending}
            onClick={() => startTransition(() => importCommunityRecipe(recipe.id))}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? <Spinner className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
            Import
          </button>
          {reported ? (
            <span className="text-xs text-muted">Reported</span>
          ) : reporting ? (
            <div className="flex items-center gap-1.5">
              <input
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Reason"
                className="w-28 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand"
              />
              <button
                disabled={!reportReason.trim() || pending}
                onClick={() =>
                  startTransition(async () => {
                    await reportCommunityRecipe(recipe.id, reportReason.trim());
                    setReported(true);
                    setReporting(false);
                  })
                }
                className="text-xs font-medium text-danger"
              >
                Send
              </button>
            </div>
          ) : (
            <button
              onClick={() => setReporting(true)}
              className="flex items-center gap-1 text-xs text-muted hover:text-danger"
            >
              <Flag className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
