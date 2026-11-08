"use client";

import { RecipeForm } from "@/components/recipe-form";
import { updateRecipe } from "@/lib/actions/recipes";
import type { RecipeFormInput } from "@/lib/actions/recipes";
import type { RecipeWithIngredients } from "@/lib/types";

export function EditRecipeClient({
  recipeId,
  recipe,
}: {
  recipeId: string;
  recipe: RecipeWithIngredients;
}) {
  return (
    <RecipeForm
      initial={recipe}
      submitLabel="Save changes"
      onSubmit={(input: RecipeFormInput) => updateRecipe(recipeId, input)}
    />
  );
}
