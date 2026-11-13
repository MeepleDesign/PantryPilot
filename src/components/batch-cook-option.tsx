"use client";

import { useState, useTransition } from "react";
import { PackageOpen } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { confirmCookedFromBatch } from "@/lib/actions/planner";

export type AvailableBatch = {
  id: string;
  recipe_id: string | null;
  recipe_name: string;
  portions_remaining: number;
  storage_location: "fridge" | "freezer";
};

export function BatchCookOption({
  entryId,
  recipeId,
  batches,
}: {
  entryId: string;
  recipeId: string;
  batches: AvailableBatch[];
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [batchId, setBatchId] = useState(
    batches.find((b) => b.recipe_id === recipeId)?.id ?? batches[0]?.id ?? "",
  );
  const [qty, setQty] = useState("1");
  const [pending, startTransition] = useTransition();

  if (!batches.length || done) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-dark"
      >
        <PackageOpen className="h-3.5 w-3.5" />
        Eating from a stored batch instead?
      </button>
    );
  }

  const selected = batches.find((b) => b.id === batchId);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2">
      <select
        value={batchId}
        onChange={(e) => setBatchId(e.target.value)}
        className="min-w-0 rounded-lg border border-border bg-surface px-2 py-1 text-sm"
      >
        {batches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.recipe_name} ({b.portions_remaining} left, {b.storage_location})
          </option>
        ))}
      </select>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={selected?.portions_remaining ?? 1}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        onBlur={() => {
          if (!qty.trim() || Number(qty) < 1) setQty("1");
        }}
        className="w-16 rounded-lg border border-border bg-surface px-2 py-1 text-sm"
      />
      <button
        type="button"
        disabled={pending || !batchId}
        onClick={() =>
          startTransition(async () => {
            await confirmCookedFromBatch(entryId, batchId, Number(qty) || 1);
            setDone(true);
          })
        }
        className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1 text-xs font-medium text-brand-foreground disabled:cursor-wait disabled:opacity-60"
      >
        {pending && <Spinner className="h-3 w-3" />}
        Use batch &amp; mark cooked
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-muted hover:text-foreground"
      >
        Cancel
      </button>
    </div>
  );
}
