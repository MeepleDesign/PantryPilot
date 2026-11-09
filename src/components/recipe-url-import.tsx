"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { Spinner } from "@/components/spinner";
import type { ExtractedRecipe } from "@/lib/recipe-extraction-types";

export function RecipeUrlImport({
  onImported,
}: {
  onImported: (data: ExtractedRecipe) => void;
}) {
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    if (!url.trim()) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/recipes/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Couldn't import that URL.");
      onImported(data as ExtractedRecipe);
      setUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't import that URL.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-dashed border-border bg-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <Link2 className="h-5 w-5 text-muted" />
        <div>
          <p className="text-sm font-medium">Import from a website</p>
          <p className="text-xs text-muted">Paste a link to a recipe page and we&apos;ll pre-fill the form below — free, no AI involved.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleImport();
            }
          }}
          placeholder="https://example.com/recipes/..."
          disabled={pending}
          className="min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={pending || !url.trim()}
          className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-surface disabled:cursor-wait disabled:opacity-60"
        >
          {pending && <Spinner className="h-4 w-4" />}
          {pending ? "Importing…" : "Import"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
