"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Receipt } from "lucide-react";
import { AddReceiptToPantryButton } from "@/components/add-receipt-to-pantry";
import { EmptyState } from "@/components/empty-state";
import type { UnitSystem } from "@/lib/units";

type ReceiptScanWithItems = {
  id: string;
  store_name: string | null;
  purchased_at: string;
  total: number | null;
  receipt_items: {
    id: string;
    ingredient_name: string;
    price: number;
    quantity: number | null;
    unit: string | null;
  }[];
};

function money(n: number) {
  return `£${n.toFixed(2)}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function ReceiptCard({
  scan,
  unitSystem,
}: {
  scan: ReceiptScanWithItems;
  unitSystem: UnitSystem;
}) {
  const [open, setOpen] = useState(false);
  const scanTotal = scan.receipt_items.reduce((sum, i) => sum + Number(i.price), 0);

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-medium">{scan.store_name ?? "Receipt"}</p>
          <p className="text-xs text-muted">
            {scan.purchased_at} · {scan.receipt_items.length} item
            {scan.receipt_items.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{money(scanTotal)}</p>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open && (
        <div className="border-t border-border">
          <div className="divide-y divide-border">
            {scan.receipt_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{item.ingredient_name}</span>
                <span className="text-muted">{money(Number(item.price))}</span>
              </div>
            ))}
          </div>
          <AddReceiptToPantryButton
            items={scan.receipt_items.map((item) => ({
              ingredient_name: item.ingredient_name,
              quantity: item.quantity,
              unit: item.unit,
            }))}
            unitSystem={unitSystem}
          />
        </div>
      )}
    </div>
  );
}

export function ReceiptHistory({
  scans,
  unitSystem,
}: {
  scans: ReceiptScanWithItems[];
  unitSystem: UnitSystem;
}) {
  const [shopFilter, setShopFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  const shops = useMemo(
    () => Array.from(new Set(scans.map((s) => s.store_name).filter((s): s is string => !!s))).sort(),
    [scans],
  );
  const months = useMemo(
    () =>
      Array.from(new Set(scans.map((s) => s.purchased_at.slice(0, 7)))).sort((a, b) =>
        b.localeCompare(a),
      ),
    [scans],
  );

  const filtered = scans.filter(
    (s) =>
      (shopFilter === "all" || s.store_name === shopFilter) &&
      (monthFilter === "all" || s.purchased_at.slice(0, 7) === monthFilter),
  );

  return (
    <div>
      <h2 className="mb-2 font-medium">Receipt history</h2>

      {scans.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <select
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className="min-w-0 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">All shops</option>
            {shops.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="min-w-0 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">All time</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((scan) => (
            <ReceiptCard key={scan.id} scan={scan} unitSystem={unitSystem} />
          ))}
        </div>
      ) : scans.length > 0 ? (
        <p className="py-6 text-center text-sm text-muted">No receipts match that filter.</p>
      ) : (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState
            icon={Receipt}
            title="No receipts scanned yet"
            body="Scan one above to start tracking your spend."
          />
        </div>
      )}
    </div>
  );
}
