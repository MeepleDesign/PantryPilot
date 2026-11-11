"use client";

import { useState, useTransition } from "react";
import { addPantryItem, updatePantryItem, deletePantryItem } from "@/lib/actions/pantry";
import { Spinner } from "@/components/spinner";
import { UnitSelect } from "@/components/unit-select";
import { useToast } from "@/components/toast";
import { expiryStatus } from "@/lib/expiry";
import type { UnitSystem } from "@/lib/units";
import type { PantryItem, StorageLocation } from "@/lib/types";

const LOCATIONS: StorageLocation[] = ["cupboard", "fridge", "freezer", "other"];

export function PantryItemForm({
  onDone,
  unitSystem,
}: {
  onDone?: () => void;
  unitSystem: UnitSystem;
}) {
  const [pending, startTransition] = useTransition();
  const [unit, setUnit] = useState("");
  const showToast = useToast();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const name = String(formData.get("ingredient_name"));
          await addPantryItem({
            ingredient_name: name,
            storage_location: String(formData.get("storage_location")) as StorageLocation,
            quantity: Number(formData.get("quantity")) || 0,
            unit: unit || null,
            expiry_date: (formData.get("expiry_date") as string) || null,
            notes: null,
          });
          setUnit("");
          showToast(`${name} added to pantry`);
          onDone?.();
        });
      }}
      className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-3 shadow-sm sm:grid-cols-6"
    >
      <label className="col-span-2 block sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-muted">Ingredient</span>
        <input
          name="ingredient_name"
          placeholder="e.g. Chickpeas"
          required
          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Qty</span>
        <input
          name="quantity"
          type="number"
          step="any"
          placeholder="Qty"
          required
          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Unit</span>
        <UnitSelect
          value={unit}
          onChange={setUnit}
          unitSystem={unitSystem}
          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Storage</span>
        <select
          name="storage_location"
          defaultValue="cupboard"
          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        >
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {l[0].toUpperCase() + l.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Use by (optional)</span>
        <input
          name="expiry_date"
          type="date"
          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        />
      </label>
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

export function PantryItemRow({
  item,
  unitSystem,
}: {
  item: PantryItem;
  unitSystem: UnitSystem;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [pending, startTransition] = useTransition();
  const [unit, setUnit] = useState(item.unit ?? "");

  const status = expiryStatus(item.expiry_date);
  const expiringSoon = status === "soon";
  const expired = status === "expired";

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
              unit: unit || null,
              expiry_date: (formData.get("expiry_date") as string) || null,
              notes: item.notes,
            });
            setEditing(false);
          });
        }}
        className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-6"
      >
        <label className="col-span-2 block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-muted">Ingredient</span>
          <input
            name="ingredient_name"
            defaultValue={item.ingredient_name}
            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Qty</span>
          <input
            name="quantity"
            type="number"
            step="any"
            defaultValue={item.quantity}
            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Unit</span>
          <UnitSelect
            value={unit}
            onChange={setUnit}
            unitSystem={unitSystem}
            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Storage</span>
          <select
            name="storage_location"
            defaultValue={item.storage_location}
            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm"
          >
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l[0].toUpperCase() + l.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Use by</span>
          <input
            name="expiry_date"
            type="date"
            defaultValue={item.expiry_date ?? ""}
            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm"
          />
        </label>
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
    <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 px-4 py-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium">{item.ingredient_name}</p>
        <p className="text-xs text-muted">
          {item.quantity} {item.unit ?? ""} ·{" "}
          <span className="capitalize">{item.storage_location}</span>
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
      {confirmingRemove ? (
        <div className="flex shrink-0 items-center gap-2 text-xs">
          <span className="text-muted">Used it or wasted?</span>
          <button
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await deletePantryItem(item.id, "used");
                setConfirmingRemove(false);
              });
            }}
            className="rounded-lg border border-border px-2 py-1 font-medium hover:bg-background"
          >
            Used it
          </button>
          <button
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await deletePantryItem(item.id, "wasted");
                setConfirmingRemove(false);
              });
            }}
            className="rounded-lg bg-danger/10 px-2 py-1 font-medium text-danger hover:bg-danger/20"
          >
            Wasted it
          </button>
          <button
            disabled={pending}
            onClick={() => setConfirmingRemove(false)}
            className="text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 gap-3">
          <button onClick={() => setEditing(true)} className="font-medium text-brand">
            Edit
          </button>
          <button onClick={() => setConfirmingRemove(true)} className="text-danger">
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
