"use client";

import { RecipeForm } from "@/components/recipe-form";
import { updateRecipe } from "@/lib/actions/recipes";
import type { RecipeFormInput } from "@/lib/actions/recipes";
import type { RecipeWithIngredients } from "@/lib/types";
import type { UnitSystem } from "@/lib/units";

export function EditRecipeClient({
  recipeId,
  recipe,
  unitSystem,
  cuisineOptions,
  dietOptions,
}: {
  recipeId: string;
  recipe: RecipeWithIngredients;
  unitSystem: UnitSystem;
  cuisineOptions: string[];
  dietOptions: string[];
}) {
  return (
    <RecipeForm
      initial={recipe}
      submitLabel="Save changes"
      unitSystem={unitSystem}
      cuisineOptions={cuisineOptions}
      dietOptions={dietOptions}
      onSubmit={(input: RecipeFormInput) => updateRecipe(recipeId, input)}
    />
  );
}
