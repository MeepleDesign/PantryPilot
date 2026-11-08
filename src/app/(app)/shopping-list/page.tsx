import { PackageCheck } from "lucide-react";
import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import {
  RegenerateButton,
  ResetButton,
  ClearTickedButton,
  ShoppingListRow,
  AddManualItemForm,
} from "@/components/shopping-list-client";

export default async function ShoppingListPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

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
            For {household.default_supermarket ?? "your supermarket"} — recalculate
            after changing your meal plan
          </p>
        </div>
        <div className="flex gap-2">
          <RegenerateButton />
          <ResetButton />
        </div>
      </div>

      <div className="mb-4">
        <AddManualItemForm />
      </div>

      {toBuy.length > 0 ? (
        <div className="mb-6 divide-y divide-border rounded-xl border border-border bg-surface shadow-sm">
          {toBuy.map((item) => (
            <ShoppingListRow key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-dashed border-border py-10 text-center text-muted">
          Nothing to buy yet. Plan some meals, then recalculate.
        </div>
      )}

      {toBuy.some((i) => i.ticked) && (
        <div className="mb-6 text-right">
          <ClearTickedButton />
        </div>
      )}

      {covered.length > 0 && (
        <div>
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
