"use client";

import { useEffect, useState, useTransition } from "react";
import { UnitSelect } from "@/components/unit-select";
import { Spinner } from "@/components/spinner";
import {
  addPantryItem,
  getPantryMatchCandidates,
  increasePantryItem,
  type PantryMatchCandidate,
} from "@/lib/actions/pantry";
import { normalizeIngredientName, similarIngredientNames } from "@/lib/ingredient-name";
import type { ExtractedPantryScan } from "@/lib/actions/pantry-import";
import type { StorageLocation } from "@/lib/types";
import type { UnitSystem } from "@/lib/units";

const LOCATIONS: StorageLocation[] = ["cupboard", "fridge", "freezer", "other"];

type Match = { candidate: PantryMatchCandidate; exact: boolean };

type ReviewRow = {
  id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  storage_location: StorageLocation;
  uncertain_fields: string[];
  include: boolean;
  match: Match | null;
  mergeChoice: "merge" | "new";
};

function findMatch(name: string, candidates: PantryMatchCandidate[]): Match | null {
  const normalized = normalizeIngredientName(name);
  const exact = candidates.find((c) => normalizeIngredientName(c.ingredient_name) === normalized);
  if (exact) return { candidate: exact, exact: true };
  const similar = candidates.find((c) => similarIngredientNames(c.ingredient_name, name));
  if (similar) return { candidate: similar, exact: false };
  return null;
}

function qtyLabel(candidate: PantryMatchCandidate) {
  return `${candidate.quantity}${candidate.unit ? ` ${candidate.unit}` : ""}`;
}

export function PantryImportReview({
  scan,
  unitSystem,
  onDone,
  source = "photo",
  title = "Review scanned items",
  subtitle,
  emptyMessage = "Didn't spot any items in that photo.",
}: {
  scan: ExtractedPantryScan;
  unitSystem: UnitSystem;
  onDone: () => void;
  source?: "photo" | "receipt";
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
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
      match: null,
      mergeChoice: "new",
    })),
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getPantryMatchCandidates()
      .then((candidates) => {
        setRows((prev) =>
          prev.map((row) => {
            const match = findMatch(row.ingredient_name, candidates);
            return match ? { ...row, match, mergeChoice: match.exact ? "merge" : "new" } : row;
          }),
        );
      })
      .catch(() => {
        // Non-critical: matching just won't be offered this time.
      });
  }, []);

  function updateRow(id: string, patch: Partial<ReviewRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  const includedCount = rows.filter((r) => r.include).length;

  function handleConfirm() {
    startTransition(async () => {
      const toAdd = rows.filter((r) => r.include && r.ingredient_name.trim());
      for (const row of toAdd) {
        if (row.mergeChoice === "merge" && row.match) {
          await increasePantryItem(row.match.candidate.id, row.quantity ?? 1, source);
        } else {
          await addPantryItem(
            {
              ingredient_name: row.ingredient_name.trim(),
              storage_location: row.storage_location,
              quantity: row.quantity ?? 1,
              unit: row.unit,
              expiry_date: null,
              notes: null,
            },
            source,
          );
        }
      }
      onDone();
    });
  }

  if (!rows.length) {
    return (
      <div className="mb-8 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
        {emptyMessage}{" "}
        <button type="button" onClick={onDone} className="font-medium text-brand">
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h2 className="font-medium">{title}</h2>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onDone}
          className="shrink-0 text-sm text-muted hover:text-foreground"
        >
          Skip
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
              {row.mergeChoice === "merge" && row.match ? (
                <span className="col-span-2 flex items-center px-2 text-xs text-muted sm:col-span-2">
                  will be added to existing
                </span>
              ) : (
                <>
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
                </>
              )}
            </div>
            {row.uncertain_fields.length > 0 && (
              <p className="mt-1.5 text-xs text-warn">
                Please check: {row.uncertain_fields.join(", ")}
              </p>
            )}
            {row.match && row.match.exact && (
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                Already in pantry: &quot;{row.match.candidate.ingredient_name}&quot; (
                {qtyLabel(row.match.candidate)}). This will top it up instead of creating a
                duplicate.
                <button
                  type="button"
                  onClick={() => updateRow(row.id, { mergeChoice: "new" })}
                  className="font-medium text-brand hover:text-brand-dark"
                >
                  Add as new item instead
                </button>
              </p>
            )}
            {row.match && !row.match.exact && (
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-warn">
                Similar to existing &quot;{row.match.candidate.ingredient_name}&quot; (
                {qtyLabel(row.match.candidate)}). Merge into it, or add as a new item?
                <button
                  type="button"
                  onClick={() => updateRow(row.id, { mergeChoice: "merge" })}
                  className={`font-medium ${row.mergeChoice === "merge" ? "underline" : "text-brand hover:text-brand-dark"}`}
                >
                  Merge
                </button>
                <button
                  type="button"
                  onClick={() => updateRow(row.id, { mergeChoice: "new" })}
                  className={`font-medium ${row.mergeChoice === "new" ? "underline" : "text-brand hover:text-brand-dark"}`}
                >
                  Add as new
                </button>
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
