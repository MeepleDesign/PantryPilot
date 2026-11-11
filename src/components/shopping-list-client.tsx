"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Search, X } from "lucide-react";
import {
  regenerateShoppingList,
  toggleShoppingItem,
  removeShoppingItem,
  addManualShoppingItem,
  clearTickedItems,
  resetShoppingList,
} from "@/lib/actions/shopping-list";
import { Spinner } from "@/components/spinner";
import { UnitSelect } from "@/components/unit-select";
import { buildSupermarketSearchUrl } from "@/lib/supermarket-links";
import type { UnitSystem } from "@/lib/units";
import type { ShoppingListItem } from "@/lib/types";

export function RegenerateButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => regenerateShoppingList())}
      className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-background disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
      {pending ? "Recalculating…" : "Recalculate from plan"}
    </button>
  );
}

export function ResetButton() {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted">Delete everything on the list?</span>
        <button
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await resetShoppingList();
              setConfirming(false);
            });
          }}
          className="flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 font-medium text-white disabled:cursor-wait disabled:opacity-60"
        >
          {pending && <Spinner className="h-4 w-4" />}
          {pending ? "Resetting…" : "Yes, delete all"}
        </button>
        <button
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-border px-3 py-1.5 font-medium"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-danger shadow-sm transition-colors hover:bg-background"
    >
      <X className="h-4 w-4" />
      Reset list
    </button>
  );
}

export function ClearTickedButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => clearTickedItems())}
      className="text-sm font-medium text-muted hover:text-foreground"
    >
      Clear ticked
    </button>
  );
}

export function ShoppingListRow({
  item,
  supermarketName,
  knownPrice,
}: {
  item: ShoppingListItem;
  supermarketName: string | null;
  knownPrice?: { price: number; updated_at: string } | null;
}) {
  const [pending, startTransition] = useTransition();
  const [ticked, setTicked] = useState(item.ticked);

  return (
    <label
      className={`animate-fade-in-up flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-200 ${
        ticked ? "bg-background/60" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={ticked}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          setTicked(next);
          startTransition(() => toggleShoppingItem(item.id, next));
        }}
        className="h-4 w-4 accent-brand transition-transform duration-150 active:scale-90"
      />
      <span
        className={`flex-1 transition-all duration-300 ${
          ticked ? "text-muted line-through opacity-60" : "opacity-100"
        }`}
      >
        {item.ingredient_name}
      </span>
      <span className="tabular-nums text-muted">
        {item.to_buy_qty} {item.unit ?? ""}
      </span>
      {item.pantry_qty > 0 && (
        <span className="text-xs text-success">have {item.pantry_qty}</span>
      )}
      {knownPrice && (
        <span className="text-xs text-muted" title={`Last priced ${new Date(knownPrice.updated_at).toLocaleDateString()}`}>
          est. £{knownPrice.price.toFixed(2)}
        </span>
      )}
      <a
        href={buildSupermarketSearchUrl(supermarketName, item.ingredient_name)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title={supermarketName ? `Search for this on ${supermarketName}` : "Search for this online"}
        className="text-muted hover:text-brand print:hidden"
      >
        <Search className="h-4 w-4" />
      </a>
      <button
        disabled={pending}
        onClick={() => startTransition(() => removeShoppingItem(item.id))}
        className="text-muted hover:text-danger print:hidden"
      >
        <X className="h-4 w-4" />
      </button>
    </label>
  );
}

export function AddManualItemForm({ unitSystem }: { unitSystem: UnitSystem }) {
  const [pending, startTransition] = useTransition();
  const [unit, setUnit] = useState("");
  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await addManualShoppingItem({
            ingredient_name: String(formData.get("ingredient_name")),
            unit: unit || null,
            quantity: Number(formData.get("quantity")) || 1,
          });
          setUnit("");
        });
      }}
      className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-3 shadow-sm"
    >
      <input
        name="ingredient_name"
        placeholder="Add an item…"
        required
        className="min-w-[140px] flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <input
        name="quantity"
        type="number"
        step="any"
        defaultValue={1}
        className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <UnitSelect
        value={unit}
        onChange={setUnit}
        unitSystem={unitSystem}
        className="w-28 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground disabled:opacity-60"
      >
        Add
      </button>
    </form>
  );
}
