"use client";

import { useState, useTransition } from "react";
import { UnitSelect } from "@/components/unit-select";
import { Spinner } from "@/components/spinner";
import { addPantryItem } from "@/lib/actions/pantry";
import type { ExtractedPantryScan } from "@/lib/actions/pantry-import";
import type { StorageLocation } from "@/lib/types";
import type { UnitSystem } from "@/lib/units";

const LOCATIONS: StorageLocation[] = ["cupboard", "fridge", "freezer", "other"];

type ReviewRow = {
  id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  storage_location: StorageLocation;
  uncertain_fields: string[];
  include: boolean;
};

export function PantryImportReview({
  scan,
  unitSystem,
  onDone,
}: {
  scan: ExtractedPantryScan;
  unitSystem: UnitSystem;
  onDone: () => void;
}) {
  const [rows, setRows] = useState<ReviewRow[]>(() =>
    scan.items.map((item, i) => ({
      id: `${i}`,
      ingredient_name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
      storage_location: item.storage_location ?? "cupboard",
      uncertain_fields: item.uncertain_fields,
      include: true,
    })),
  );
  const [pending, startTransition] = useTransition();

  function updateRow(id: string, patch: Partial<ReviewRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  const includedCount = rows.filter((r) => r.include).length;

  function handleConfirm() {
    startTransition(async () => {
      const toAdd = rows.filter((r) => r.include && r.ingredient_name.trim());
      for (const row of toAdd) {
        await addPantryItem(
          {
            ingredient_name: row.ingredient_name.trim(),
            storage_location: row.storage_location,
            quantity: row.quantity ?? 1,
            unit: row.unit,
            expiry_date: null,
            notes: null,
          },
          "photo",
        );
      }
      onDone();
    });
  }

  if (!rows.length) {
    return (
      <div className="mb-8 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
        Didn&apos;t spot any items in that photo.{" "}
        <button type="button" onClick={onDone} className="font-medium text-brand">
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-medium">Review scanned items</h2>
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-muted hover:text-foreground"
        >
          Dismiss
        </button>
      </div>
      {scan.notes && <p className="mb-3 text-xs text-muted">{scan.notes}</p>}
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div
            key={row.id}
            className={`rounded-lg border p-3 ${row.include ? "border-border" : "border-border opacity-50"}`}
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 sm:items-center">
              <label className="col-span-2 flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={row.include}
                  onChange={(e) => updateRow(row.id, { include: e.target.checked })}
                  className="h-4 w-4 shrink-0 accent-brand"
                />
                <input
                  value={row.ingredient_name}
                  onChange={(e) => updateRow(row.id, { ingredient_name: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                />
              </label>
              <input
                type="number"
                step="any"
                value={row.quantity ?? ""}
                onChange={(e) =>
                  updateRow(row.id, {
                    quantity: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="Qty"
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              />
              <UnitSelect
                value={row.unit ?? ""}
                onChange={(unit) => updateRow(row.id, { unit })}
                unitSystem={unitSystem}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              />
              <select
                value={row.storage_location}
                onChange={(e) =>
                  updateRow(row.id, { storage_location: e.target.value as StorageLocation })
                }
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              >
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l[0].toUpperCase() + l.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            {row.uncertain_fields.length > 0 && (
              <p className="mt-1.5 text-xs text-warn">
                Please check: {row.uncertain_fields.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={pending || includedCount === 0}
        className="mt-4 flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
      >
        {pending && <Spinner className="h-4 w-4" />}
        {pending
          ? "Adding…"
          : `Add ${includedCount} item${includedCount === 1 ? "" : "s"} to pantry`}
      </button>
    </div>
  );
}
