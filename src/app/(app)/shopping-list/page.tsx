import Link from "next/link";
import { PackageCheck, ShoppingCart, Receipt } from "lucide-react";
import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import {
  RegenerateButton,
  ResetButton,
  ClearTickedButton,
  ShoppingListRow,
  AddManualItemForm,
} from "@/components/shopping-list-client";
import { PrintButton } from "@/components/print-button";
import { EmptyState } from "@/components/empty-state";
import type { UnitSystem } from "@/lib/units";

export default async function ShoppingListPage() {
  const { household, profile } = await getCurrentHousehold();
  const supabase = await createClient();
  const unitSystem: UnitSystem = profile.units === "imperial" ? "imperial" : "metric";

  const { data: items, error } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("household_id", household.id)
    .order("ingredient_name");
  if (error) throw new Error(error.message);

  const toBuy = items?.filter((i) => i.to_buy_qty > 0 || i.is_manual) ?? [];
  const covered = items?.filter((i) => i.to_buy_qty <= 0 && !i.is_manual) ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shopping list</h1>
          <p className="text-sm text-muted">
            For {household.default_supermarket ?? "your supermarket"}. Recalculate
            after changing your meal plan
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link
            href="/shopping-list/spending"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface"
          >
            <Receipt className="h-4 w-4" />
            Spending
          </Link>
          <PrintButton label="Print" />
          <RegenerateButton />
          <ResetButton />
        </div>
      </div>

      <div className="mb-4 print:hidden">
        <AddManualItemForm unitSystem={unitSystem} />
      </div>

      {toBuy.length > 0 ? (
        <div className="mb-6 divide-y divide-border rounded-xl border border-border bg-surface shadow-sm">
          {toBuy.map((item) => (
            <ShoppingListRow key={item.id} item={item} supermarketName={household.default_supermarket} />
          ))}
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-dashed border-border">
          <EmptyState
            icon={ShoppingCart}
            title="Nothing to buy yet"
            body="Plan some meals, then recalculate."
          />
        </div>
      )}

      {toBuy.some((i) => i.ticked) && (
        <div className="mb-6 text-right print:hidden">
          <ClearTickedButton />
        </div>
      )}

      {covered.length > 0 && (
        <div className="print:hidden">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted">
            <PackageCheck className="h-4 w-4" />
            Already in your pantry
          </h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-surface opacity-70">
            {covered.map((item) => (
              <div key={item.id} className="flex justify-between px-4 py-2.5 text-sm">
                <span>{item.ingredient_name}</span>
                <span className="text-muted">
                  have {item.pantry_qty} {item.unit ?? ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
