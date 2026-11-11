import { Archive, Snowflake, Refrigerator, Package } from "lucide-react";
import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import { PantryItemForm, PantryItemRow } from "@/components/pantry-item-form";
import { PantryPhotoSection } from "@/components/pantry-photo-section";
import { EmptyState } from "@/components/empty-state";
import type { PantryItem, StorageLocation } from "@/lib/types";
import type { UnitSystem } from "@/lib/units";

const LOCATIONS: StorageLocation[] = ["cupboard", "fridge", "freezer", "other"];

const LOCATION_ICONS: Record<StorageLocation, typeof Archive> = {
  cupboard: Archive,
  fridge: Refrigerator,
  freezer: Snowflake,
  other: Package,
};

export default async function PantryPage() {
  const { household, profile } = await getCurrentHousehold();
  const supabase = await createClient();
  const unitSystem: UnitSystem = profile.units === "imperial" ? "imperial" : "metric";

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

      <PantryPhotoSection unitSystem={unitSystem} />

      <div className="mb-8">
        <PantryItemForm unitSystem={unitSystem} />
      </div>

      {LOCATIONS.map((loc) => {
        const locItems = (items as PantryItem[] | null)?.filter(
          (i) => i.storage_location === loc,
        );
        if (!locItems?.length) return null;
        const Icon = LOCATION_ICONS[loc];
        return (
          <div key={loc} className="mb-6">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted">
              <Icon className="h-4 w-4" />
              {loc}
            </h2>
            <div className="divide-y divide-border rounded-xl border border-border bg-surface shadow-sm">
              {locItems.map((item) => (
                <PantryItemRow key={item.id} item={item} unitSystem={unitSystem} />
              ))}
            </div>
          </div>
        );
      })}

      {!items?.length && (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState
            icon={Archive}
            title="Your pantry is empty"
            body="Scan a photo or add what you already have above."
          />
        </div>
      )}
    </div>
  );
}
