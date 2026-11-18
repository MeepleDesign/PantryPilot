import Link from "next/link";
import { NewRecipeClient } from "@/components/new-recipe-client";
import { getCurrentHousehold } from "@/lib/current-household";
import { getLearnedRecipeOptions } from "@/lib/actions/recipe-options";
import { createClient } from "@/lib/supabase/server";
import { expiryStatus } from "@/lib/expiry";
import { isPro } from "@/lib/plan";
import type { UnitSystem } from "@/lib/units";

const MAX_PANTRY_HINTS = 15;

export default async function NewRecipePage() {
  const { household, profile } = await getCurrentHousehold();
  const unitSystem: UnitSystem = profile.units === "imperial" ? "imperial" : "metric";
  const { cuisineOptions, dietOptions } = await getLearnedRecipeOptions(household.id);

  const supabase = await createClient();
  const { data: pantryItems } = await supabase
    .from("pantry_items")
    .select("ingredient_name, expiry_date")
    .eq("household_id", household.id);

  const sorted = [...(pantryItems ?? [])].sort((a, b) => {
    const aExpiring = expiryStatus(a.expiry_date) !== null;
    const bExpiring = expiryStatus(b.expiry_date) !== null;
    return aExpiring === bExpiring ? 0 : aExpiring ? -1 : 1;
  });
  const pantryHints = [...new Set(sorted.map((i) => i.ingredient_name))].slice(0, MAX_PANTRY_HINTS);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/recipes" className="text-sm text-muted hover:text-foreground">
        ← Recipes
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-semibold tracking-tight">Add a recipe</h1>
      <NewRecipeClient
        unitSystem={unitSystem}
        cuisineOptions={cuisineOptions}
        dietOptions={dietOptions}
        isPro={isPro(household)}
        cookingMachine={household.cooking_machine}
        pantryHints={pantryHints}
      />
    </div>
  );
}
