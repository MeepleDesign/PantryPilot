"use client";

import { useState } from "react";
import { PantryImportReview } from "@/components/pantry-import-review";
import type { ExtractedPantryScan } from "@/lib/actions/pantry-import";
import type { UnitSystem } from "@/lib/units";

export function AddReceiptToPantryButton({
  items,
  unitSystem,
}: {
  items: { ingredient_name: string; quantity: number | null; unit: string | null }[];
  unitSystem: UnitSystem;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    const scan: ExtractedPantryScan = {
      items: items.map((item) => ({
        ingredient_name: item.ingredient_name,
        quantity: item.quantity,
        unit: item.unit,
        storage_location: null,
        uncertain_fields: [],
      })),
      notes: null,
    };
    return (
      <div className="border-t border-border p-3">
        <PantryImportReview
          scan={scan}
          unitSystem={unitSystem}
          onDone={() => setOpen(false)}
          source="receipt"
          title="Add these to your pantry?"
          emptyMessage="No items to add."
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="block w-full border-t border-border px-4 py-2.5 text-center text-sm font-medium text-brand hover:bg-background"
    >
      Add to pantry
    </button>
  );
}
