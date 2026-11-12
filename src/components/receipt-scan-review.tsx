"use client";

import { useEffect, useState, useTransition } from "react";
import { Spinner } from "@/components/spinner";
import { UnitSelect } from "@/components/unit-select";
import { useToast } from "@/components/toast";
import { saveReceiptScan } from "@/lib/actions/receipts";
import { getKnownPrices, type KnownPrice } from "@/lib/actions/ingredient-prices";
import { normalizeIngredientName } from "@/lib/ingredient-name";
import { PantryImportReview } from "@/components/pantry-import-review";
import type { ExtractedReceiptScan } from "@/lib/actions/receipt-import";
import type { ExtractedPantryScan } from "@/lib/actions/pantry-import";
import type { UnitSystem } from "@/lib/units";

type ReviewRow = {
  id: string;
  ingredient_name: string;
  price: number;
  quantity: number | null;
  unit: string | null;
  uncertain_fields: string[];
  include: boolean;
  updatePrice: boolean;
};

function money(n: number) {
  return `£${n.toFixed(2)}`;
}

function daysAgo(iso: string): string {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function ReceiptScanReview({
  scan,
  unitSystem,
  onDone,
}: {
  scan: ExtractedReceiptScan;
  unitSystem: UnitSystem;
  onDone: () => void;
}) {
  const [pantryScan, setPantryScan] = useState<ExtractedPantryScan | null>(null);
  const [storeName, setStoreName] = useState(scan.store_name ?? "");
  const [purchasedAt, setPurchasedAt] = useState(
    scan.purchased_at ?? new Date().toISOString().slice(0, 10),
  );
  const [rows, setRows] = useState<ReviewRow[]>(() =>
    (scan.items ?? []).map((item, i) => ({
      id: `${i}`,
      ingredient_name: item.ingredient_name,
      price: item.price,
      quantity: item.quantity,
      unit: item.unit,
      uncertain_fields: item.uncertain_fields,
      include: true,
      updatePrice: false,
    })),
  );
  const [knownPrices, setKnownPrices] = useState<Record<string, KnownPrice>>({});
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [pricesFailed, setPricesFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const showToast = useToast();

  useEffect(() => {
    getKnownPrices()
      .then((prices) => {
        setKnownPrices(prices);
        setPricesLoaded(true);
      })
      .catch(() => setPricesFailed(true));
  }, []);

  function updateRow(id: string, patch: Partial<ReviewRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  const includedRows = rows.filter((r) => r.include && r.ingredient_name.trim());
  const includedTotal = includedRows.reduce((sum, r) => sum + (r.price || 0), 0);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleConfirm() {
    setSaveError(null);
    startTransition(async () => {
      try {
        await saveReceiptScan({
          store_name: storeName.trim() || null,
          purchased_at: purchasedAt || null,
          total: scan.total,
          items: includedRows.map((r) => ({
            ingredient_name: r.ingredient_name.trim(),
            price: r.price,
            quantity: r.quantity,
            unit: r.unit,
            update_price: r.updatePrice,
          })),
        });
      } catch {
        setSaveError(
          "Couldn't confirm the save went through — your connection may have dropped. Check your spending history before retrying, to avoid saving this twice.",
        );
        return;
      }
      showToast(`Saved ${includedRows.length} item${includedRows.length === 1 ? "" : "s"} · ${money(includedTotal)}`);
      setPantryScan({
        items: includedRows.map((r) => ({
          ingredient_name: r.ingredient_name.trim(),
          quantity: r.quantity,
          unit: r.unit,
          storage_location: null,
          uncertain_fields: [],
        })),
        notes: null,
      });
    });
  }

  if (pantryScan) {
    return (
      <PantryImportReview
        scan={pantryScan}
        unitSystem={unitSystem}
        onDone={onDone}
        source="receipt"
        title="Add these to your pantry?"
        subtitle="Optional — skip if you'd rather add them yourself, or not at all."
        emptyMessage="No items to add."
      />
    );
  }

  if (!rows.length) {
    return (
      <div className="mb-8 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
        Didn&apos;t spot any items on that receipt.{" "}
        <button type="button" onClick={onDone} className="font-medium text-brand">
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-medium">Review scanned receipt</h2>
        <button type="button" onClick={onDone} className="text-sm text-muted hover:text-foreground">
          Dismiss
        </button>
      </div>
      {scan.notes && <p className="mb-3 text-xs text-muted">{scan.notes}</p>}

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Shop</span>
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="e.g. Sainsbury's"
            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Date</span>
          <input
            type="date"
            value={purchasedAt}
            onChange={(e) => setPurchasedAt(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <div className="space-y-2">
        {rows.map((row) => {
          const known = knownPrices[normalizeIngredientName(row.ingredient_name)];
          const priceChanged = known && Math.abs(known.price - row.price) > 0.001;
          return (
            <div
              key={row.id}
              className={`rounded-lg border p-3 ${row.include ? "border-border" : "border-border opacity-50"}`}
            >
              <div className="flex items-center gap-2">
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
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:flex sm:items-center">
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
                  className="min-w-0 rounded-lg border border-border bg-background px-2 py-1.5 text-sm sm:w-20 sm:shrink-0"
                />
                <UnitSelect
                  value={row.unit ?? ""}
                  onChange={(unit) => updateRow(row.id, { unit })}
                  unitSystem={unitSystem}
                  className="min-w-0 rounded-lg border border-border bg-background px-2 py-1.5 text-sm sm:w-24 sm:shrink-0"
                />
                <div className="flex min-w-0 items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 sm:w-24 sm:shrink-0 sm:border-0 sm:bg-transparent sm:p-0">
                  <span className="text-sm text-muted">£</span>
                  <input
                    type="number"
                    step="0.01"
                    value={row.price}
                    onChange={(e) => updateRow(row.id, { price: Number(e.target.value) || 0 })}
                    className="min-w-0 flex-1 rounded-lg border-0 bg-transparent text-sm sm:w-20 sm:flex-none sm:border sm:border-border sm:bg-background sm:px-2 sm:py-1.5"
                  />
                </div>
              </div>
              {row.uncertain_fields.length > 0 && (
                <p className="mt-1.5 text-xs text-warn">
                  Please check: {row.uncertain_fields.join(", ")}
                </p>
              )}
              {!pricesLoaded && !pricesFailed && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                  <Spinner className="h-3 w-3" />
                  Checking remembered price…
                </p>
              )}
              {pricesLoaded && priceChanged && (
                <label className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={row.updatePrice}
                    onChange={(e) => updateRow(row.id, { updatePrice: e.target.checked })}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  Last priced {money(known.price)} ({daysAgo(known.updated_at)}) — update remembered
                  price to {money(row.price)}?
                </label>
              )}
              {pricesLoaded && !known && (
                <p className="mt-1.5 text-xs text-muted">New price — will be remembered for your shopping list.</p>
              )}
              {pricesFailed && (
                <p className="mt-1.5 text-xs text-warn">
                  Couldn&apos;t check remembered prices — this price won&apos;t overwrite anything saved.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {saveError && (
        <p className="mt-4 rounded-lg border border-warn bg-warn/10 p-3 text-sm text-warn">
          {saveError}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          <span className="font-medium">{includedRows.length}</span> item
          {includedRows.length === 1 ? "" : "s"} ·{" "}
          <span className="font-medium">{money(includedTotal)}</span>
          {scan.total != null && (
            <span className="text-muted"> (receipt total {money(scan.total)})</span>
          )}
        </p>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending || includedRows.length === 0 || (!pricesLoaded && !pricesFailed)}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
        >
          {(pending || (!pricesLoaded && !pricesFailed)) && <Spinner className="h-4 w-4" />}
          {pending
            ? "Saving…"
            : !pricesLoaded && !pricesFailed
              ? "Checking prices…"
              : saveError
                ? "Retry save"
                : "Save spend"}
        </button>
      </div>
    </div>
  );
}
