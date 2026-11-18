"use client";

import { useState, useTransition } from "react";
import { Star, X } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { UnitSelect } from "@/components/unit-select";
import { SelectWithOther } from "@/components/select-with-other";
import { addKeyIngredient, removeKeyIngredient } from "@/lib/actions/key-ingredients";
import type { KeyIngredientStatus } from "@/lib/types";
import type { UnitSystem } from "@/lib/units";

export type PantryIngredientOption = { name: string; unit: string | null };

const STATUS_STYLES: Record<KeyIngredientStatus["status"], string> = {
  ok: "bg-success/10 text-success",
  low: "bg-warn/10 text-warn",
  out: "bg-danger/10 text-danger",
  expiring: "bg-warn/10 text-warn",
};

const STATUS_LABELS: Record<KeyIngredientStatus["status"], string> = {
  ok: "Stocked",
  low: "Running low",
  out: "Out of stock",
  expiring: "Expiring soon",
};

export function KeyIngredientsSection({
  items,
  unitSystem,
  pantryOptions,
}: {
  items: KeyIngredientStatus[];
  unitSystem: UnitSystem;
  pantryOptions: PantryIngredientOption[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="mb-8 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-medium">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand-dark">
            <Star className="h-4 w-4" />
          </span>
          Key ingredients
        </h2>
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          className="text-sm font-medium text-brand hover:text-brand-dark"
        >
          {adding ? "Cancel" : "+ Add"}
        </button>
      </div>
      <p className="mb-3 text-xs text-muted">
        Staples you always want on hand — you&apos;ll see an alert when one runs low, runs out, or
        is about to expire, even after the last of it is used up.
      </p>

      {adding && (
        <AddKeyIngredientForm
          unitSystem={unitSystem}
          pantryOptions={pantryOptions}
          onDone={() => setAdding(false)}
        />
      )}

      {items.length > 0 ? (
        <div className="mt-3 divide-y divide-border rounded-lg border border-border">
          {items.map((item) => (
            <KeyIngredientRow key={item.id} item={item} />
          ))}
        </div>
      ) : (
        !adding && <p className="text-sm text-muted">No key ingredients set yet.</p>
      )}
    </div>
  );
}

function AddKeyIngredientForm({
  unitSystem,
  pantryOptions,
  onDone,
}: {
  unitSystem: UnitSystem;
  pantryOptions: PantryIngredientOption[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");

  const pantryNames = pantryOptions.map((o) => o.name);

  return (
    <form
      action={(formData) => {
        if (!name.trim()) return;
        startTransition(async () => {
          await addKeyIngredient({
            ingredient_name: name.trim(),
            target_quantity: Number(formData.get("target_quantity")) || 1,
            unit: unit || null,
          });
          onDone();
        });
      }}
      className="mb-3 grid grid-cols-2 gap-2 rounded-lg border border-dashed border-border p-3 sm:grid-cols-4"
    >
      <SelectWithOther
        name="ingredient_name"
        value={name}
        onChange={(v) => {
          setName(v);
          const known = pantryOptions.find((o) => o.name === v);
          if (known) setUnit(known.unit ?? "");
        }}
        options={pantryNames}
        placeholder="Choose from pantry…"
        className="col-span-2 rounded-lg border border-border bg-background px-2 py-1.5 text-sm sm:col-span-2"
      />
      <input
        name="target_quantity"
        type="number"
        step="any"
        min={0}
        placeholder="Keep at least"
        required
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <UnitSelect
        value={unit}
        onChange={setUnit}
        unitSystem={unitSystem}
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground disabled:cursor-wait disabled:opacity-60 sm:col-span-4"
      >
        {pending && <Spinner className="h-4 w-4" />}
        {pending ? "Adding…" : "Add key ingredient"}
      </button>
    </form>
  );
}

function KeyIngredientRow({ item }: { item: KeyIngredientStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{item.ingredient_name}</p>
        <p className="text-xs text-muted">
          {item.current_quantity} {item.unit ?? ""} of {item.target_quantity} {item.unit ?? ""}
          {item.nearest_expiry && item.status === "expiring" && (
            <> · use by {item.nearest_expiry}</>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status]}`}>
          {STATUS_LABELS[item.status]}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => removeKeyIngredient(item.id))}
          className="text-muted hover:text-danger disabled:cursor-wait"
          title="Remove"
        >
          {pending ? <Spinner className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
