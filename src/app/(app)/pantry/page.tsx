import { Archive, Snowflake, Refrigerator, Package, AlertTriangle } from "lucide-react";
import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import { PantryItemForm, PantryItemRow } from "@/components/pantry-item-form";
import { PantryPhotoSection } from "@/components/pantry-photo-section";
import { KeyIngredientsSection } from "@/components/key-ingredients-section";
import { EmptyState } from "@/components/empty-state";
import { getKeyIngredientStatuses } from "@/lib/actions/key-ingredients";
import { normalizeIngredientName } from "@/lib/ingredient-name";
import { expiryStatus } from "@/lib/expiry";
import { formatShortDate } from "@/lib/format-date";
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

  const keyIngredients = await getKeyIngredientStatuses();
  const keyIngredientNames = new Set(
    keyIngredients.map((k) => normalizeIngredientName(k.ingredient_name)),
  );

  const pantryOptions = Array.from(
    new Map(
      ((items as PantryItem[] | null) ?? []).map((i) => [i.ingredient_name, i.unit]),
    ).entries(),
  )
    .map(([name, unit]) => ({ name, unit }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const byExpiry = (a: PantryItem, b: PantryItem) =>
    (a.expiry_date ?? "").localeCompare(b.expiry_date ?? "");
  const expiredItems = ((items as PantryItem[] | null) ?? [])
    .filter((i) => expiryStatus(i.expiry_date) === "expired")
    .sort(byExpiry);
  const soonItems = ((items as PantryItem[] | null) ?? [])
    .filter((i) => expiryStatus(i.expiry_date) === "soon")
    .sort(byExpiry);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Pantry</h1>
          <p className="text-sm text-muted">{items?.length ?? 0} items tracked</p>
        </div>
      </div>

      {(expiredItems.length > 0 || soonItems.length > 0) && (
        <div className="mb-6 rounded-xl border border-warn/40 bg-warn/5 p-4">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-warn">
            <AlertTriangle className="h-4 w-4" />
            {expiredItems.length + soonItems.length} item
            {expiredItems.length + soonItems.length === 1 ? "" : "s"} need attention
          </h2>
          <ul className="space-y-1 text-sm">
            {expiredItems.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">{p.ingredient_name}</span>
                <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                  Expired {formatShortDate(p.expiry_date)}
                </span>
              </li>
            ))}
            {soonItems.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">{p.ingredient_name}</span>
                <span className="shrink-0 rounded-full bg-warn/10 px-2 py-0.5 text-xs font-medium text-warn">
                  Use by {formatShortDate(p.expiry_date)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <PantryPhotoSection unitSystem={unitSystem} />

      <div className="mb-8 mt-2">
        <PantryItemForm unitSystem={unitSystem} />
      </div>

      <KeyIngredientsSection
        items={keyIngredients}
        unitSystem={unitSystem}
        pantryOptions={pantryOptions}
      />

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
                <PantryItemRow
                  key={item.id}
                  item={item}
                  unitSystem={unitSystem}
                  isKeyIngredient={keyIngredientNames.has(normalizeIngredientName(item.ingredient_name))}
                />
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
