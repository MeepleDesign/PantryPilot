"use client";

import { useState } from "react";
import { RecipeForm, type RecipeFormInitial } from "@/components/recipe-form";
import { RecipePhotoImport } from "@/components/recipe-photo-import";
import { createRecipe } from "@/lib/actions/recipes";
import type { ExtractedRecipe } from "@/lib/actions/recipe-import";
import type { UnitSystem } from "@/lib/units";

function toFormInitial(data: ExtractedRecipe): RecipeFormInitial {
  return {
    name: data.name,
    description: data.description,
    cuisine: data.cuisine,
    total_time_minutes: data.total_time_minutes,
    servings: data.servings,
    course: data.course,
    equipment: data.equipment,
    method: data.steps.map((s, i) => `${i + 1}. ${s}`).join("\n"),
    calories: data.calories,
    protein_g: data.protein_g,
    carbs_g: data.carbs_g,
    fat_g: data.fat_g,
    fibre_g: data.fibre_g,
    tags: data.tags,
    recipe_ingredients: data.ingredients.map((ing, i) => ({
      ingredient_name: ing.ingredient_name,
      quantity: ing.quantity,
      unit: ing.unit,
      sort_order: i,
    })),
  };
}

export function NewRecipeClient({ unitSystem }: { unitSystem: UnitSystem }) {
  const [imported, setImported] = useState<RecipeFormInitial | null>(null);
  const [reviewFields, setReviewFields] = useState<string[]>([]);
  const [formKey, setFormKey] = useState(0);

  function handleImported(data: ExtractedRecipe) {
    setImported(toFormInitial(data));
    setReviewFields(data.low_confidence_fields ?? []);
    setFormKey((k) => k + 1);
  }

  return (
    <>
      <RecipePhotoImport onImported={handleImported} />
      <RecipeForm
        key={formKey}
        initial={imported ?? undefined}
        onSubmit={createRecipe}
        submitLabel="Create recipe"
        unitSystem={unitSystem}
        source={imported ? "photo" : "manual"}
        reviewFields={imported ? reviewFields : undefined}
      />
    </>
  );
}
