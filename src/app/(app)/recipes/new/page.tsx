import Link from "next/link";
import { NewRecipeClient } from "@/components/new-recipe-client";
import { getCurrentHousehold } from "@/lib/current-household";
import { getLearnedRecipeOptions } from "@/lib/actions/recipe-options";
import type { UnitSystem } from "@/lib/units";

export default async function NewRecipePage() {
  const { household, profile } = await getCurrentHousehold();
  const unitSystem: UnitSystem = profile.units === "imperial" ? "imperial" : "metric";
  const { cuisineOptions, dietOptions } = await getLearnedRecipeOptions(household.id);

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
      />
    </div>
  );
}
