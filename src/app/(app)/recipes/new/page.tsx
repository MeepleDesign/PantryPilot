import Link from "next/link";
import { RecipeForm } from "@/components/recipe-form";
import { createRecipe } from "@/lib/actions/recipes";
import { getCurrentHousehold } from "@/lib/current-household";
import type { UnitSystem } from "@/lib/units";

export default async function NewRecipePage() {
  const { profile } = await getCurrentHousehold();
  const unitSystem: UnitSystem = profile.units === "imperial" ? "imperial" : "metric";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/recipes" className="text-sm text-muted hover:text-foreground">
        ← Recipes
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-semibold tracking-tight">Add a recipe</h1>
      <RecipeForm onSubmit={createRecipe} submitLabel="Create recipe" unitSystem={unitSystem} />
    </div>
  );
}
