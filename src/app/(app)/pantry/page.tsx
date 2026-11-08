import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import { PantryItemForm, PantryItemRow } from "@/components/pantry-item-form";
import type { PantryItem, StorageLocation } from "@/lib/types";

const LOCATIONS: StorageLocation[] = ["cupboard", "fridge", "freezer", "other"];

export default async function PantryPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from("pantry_items")
    .select("*")
    .eq("household_id", household.id)
    .order("ingredient_name");
  if (error) throw new Error(error.message);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Pantry</h1>
          <p className="text-sm text-muted">{items?.length ?? 0} items tracked</p>
        </div>
      </div>

      <div className="mb-8">
        <PantryItemForm />
      </div>

      {LOCATIONS.map((loc) => {
        const locItems = (items as PantryItem[] | null)?.filter(
          (i) => i.storage_location === loc,
        );
        if (!locItems?.length) return null;
        return (
          <div key={loc} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
              {loc}
            </h2>
            <div className="divide-y divide-border rounded-xl border border-border bg-surface">
              {locItems.map((item) => (
                <PantryItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}

      {!items?.length && (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted">
          Your pantry is empty. Add what you already have above — photo scanning is
          coming in Phase 2.
        </div>
      )}
    </div>
  );
}
