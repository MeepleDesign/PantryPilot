"use client";

import { useTransition } from "react";
import {
  regenerateShoppingList,
  toggleShoppingItem,
  removeShoppingItem,
  addManualShoppingItem,
  clearTickedItems,
} from "@/lib/actions/shopping-list";
import { Spinner } from "@/components/spinner";
import type { ShoppingListItem } from "@/lib/types";

export function RegenerateButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => regenerateShoppingList())}
      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-background disabled:cursor-wait disabled:opacity-60"
    >
      {pending && <Spinner className="h-4 w-4" />}
      {pending ? "Recalculating…" : "↻ Recalculate from plan"}
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

export function ShoppingListRow({ item }: { item: ShoppingListItem }) {
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-3 px-4 py-3 text-sm">
      <input
        type="checkbox"
        checked={item.ticked}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => toggleShoppingItem(item.id, e.target.checked))
        }
        className="h-4 w-4 accent-brand"
      />
      <span className={`flex-1 ${item.ticked ? "text-muted line-through" : ""}`}>
        {item.ingredient_name}
      </span>
      <span className="tabular-nums text-muted">
        {item.to_buy_qty} {item.unit ?? ""}
      </span>
      {item.pantry_qty > 0 && (
        <span className="text-xs text-success">have {item.pantry_qty}</span>
      )}
      <button
        disabled={pending}
        onClick={() => startTransition(() => removeShoppingItem(item.id))}
        className="text-danger"
      >
        ✕
      </button>
    </label>
  );
}

export function AddManualItemForm() {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await addManualShoppingItem({
            ingredient_name: String(formData.get("ingredient_name")),
            unit: (formData.get("unit") as string) || null,
            quantity: Number(formData.get("quantity")) || 1,
          });
        });
      }}
      className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-3"
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
      <input
        name="unit"
        placeholder="Unit"
        className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
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
