"use client";

import { useState, useTransition } from "react";
import { addPantryItem, updatePantryItem, deletePantryItem } from "@/lib/actions/pantry";
import { Spinner } from "@/components/spinner";
import type { PantryItem, StorageLocation } from "@/lib/types";

const LOCATIONS: StorageLocation[] = ["cupboard", "fridge", "freezer", "other"];

export function PantryItemForm({ onDone }: { onDone?: () => void }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await addPantryItem({
            ingredient_name: String(formData.get("ingredient_name")),
            storage_location: String(formData.get("storage_location")) as StorageLocation,
            quantity: Number(formData.get("quantity")) || 0,
            unit: (formData.get("unit") as string) || null,
            expiry_date: (formData.get("expiry_date") as string) || null,
            notes: null,
          });
          onDone?.();
        });
      }}
      className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-3 shadow-sm sm:grid-cols-6"
    >
      <input
        name="ingredient_name"
        placeholder="Ingredient"
        required
        className="col-span-2 rounded-lg border border-border bg-background px-2 py-1.5 text-sm sm:col-span-2"
      />
      <input
        name="quantity"
        type="number"
        step="any"
        placeholder="Qty"
        required
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <input
        name="unit"
        placeholder="Unit"
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <select
        name="storage_location"
        defaultValue="cupboard"
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      >
        {LOCATIONS.map((l) => (
          <option key={l} value={l}>
            {l[0].toUpperCase() + l.slice(1)}
          </option>
        ))}
      </select>
      <input
        name="expiry_date"
        type="date"
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60 sm:col-span-6"
      >
        {pending && <Spinner className="h-4 w-4" />}
        {pending ? "Adding…" : "+ Add to pantry"}
      </button>
    </form>
  );
}

export function PantryItemRow({ item }: { item: PantryItem }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const expiringSoon =
    item.expiry_date &&
    new Date(item.expiry_date).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
  const expired = item.expiry_date && new Date(item.expiry_date).getTime() < Date.now();

  if (editing) {
    return (
      <form
        action={(formData) => {
          startTransition(async () => {
            await updatePantryItem(item.id, {
              ingredient_name: String(formData.get("ingredient_name")),
              storage_location: String(
                formData.get("storage_location"),
              ) as StorageLocation,
              quantity: Number(formData.get("quantity")) || 0,
              unit: (formData.get("unit") as string) || null,
              expiry_date: (formData.get("expiry_date") as string) || null,
              notes: item.notes,
            });
            setEditing(false);
          });
        }}
        className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-6"
      >
        <input
          name="ingredient_name"
          defaultValue={item.ingredient_name}
          className="col-span-2 rounded-lg border border-border bg-background px-2 py-1 text-sm sm:col-span-2"
        />
        <input
          name="quantity"
          type="number"
          step="any"
          defaultValue={item.quantity}
          className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
        />
        <input
          name="unit"
          defaultValue={item.unit ?? ""}
          className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
        />
        <select
          name="storage_location"
          defaultValue={item.storage_location}
          className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
        >
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {l[0].toUpperCase() + l.slice(1)}
            </option>
          ))}
        </select>
        <input
          name="expiry_date"
          type="date"
          defaultValue={item.expiry_date ?? ""}
          className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
        />
        <div className="col-span-2 flex gap-2 sm:col-span-6">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand px-3 py-1 text-sm text-brand-foreground"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-border px-3 py-1 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium">{item.ingredient_name}</p>
        <p className="text-xs text-muted">
          {item.quantity} {item.unit ?? ""} · {item.storage_location}
          {item.expiry_date && (
            <span
              className={
                expired ? "text-danger" : expiringSoon ? "text-warn" : undefined
              }
            >
              {" "}
              · use by {item.expiry_date}
            </span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 gap-3">
        <button onClick={() => setEditing(true)} className="font-medium text-brand">
          Edit
        </button>
        <button
          disabled={pending}
          onClick={() => startTransition(() => deletePantryItem(item.id))}
          className="text-danger"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
