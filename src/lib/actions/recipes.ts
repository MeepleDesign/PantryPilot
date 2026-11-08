"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type RecipeIngredientInput = {
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  notes: string | null;
};

export type RecipeFormInput = {
  name: string;
  description: string | null;
  cuisine: string | null;
  diet: string | null;
  protein_tag: string | null;
  main_protein_source: string | null;
  total_time_minutes: number | null;
  servings: number;
  equipment: string | null;
  method: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fibre_g: number | null;
  ingredients: RecipeIngredientInput[];
};

export async function createRecipe(input: RecipeFormInput) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      household_id: household.id,
      name: input.name,
      description: input.description,
      cuisine: input.cuisine,
      diet: input.diet,
      protein_tag: input.protein_tag,
      main_protein_source: input.main_protein_source,
      total_time_minutes: input.total_time_minutes,
      servings: input.servings,
      equipment: input.equipment,
      method: input.method,
      calories: input.calories,
      protein_g: input.protein_g,
      carbs_g: input.carbs_g,
      fat_g: input.fat_g,
      fibre_g: input.fibre_g,
      source: "manual",
      created_by: auth.user?.id,
    })
    .select()
    .single();

  if (error || !recipe) {
    throw new Error(error?.message ?? "Failed to create recipe");
  }

  if (input.ingredients.length) {
    const rows = input.ingredients.map((ing, i) => ({
      recipe_id: recipe.id,
      ingredient_name: ing.ingredient_name,
      quantity: ing.quantity,
      unit: ing.unit,
      category: ing.category,
      notes: ing.notes,
      sort_order: i,
    }));
    const { error: ingError } = await supabase.from("recipe_ingredients").insert(rows);
    if (ingError) throw new Error(ingError.message);
  }

  revalidatePath("/recipes");
  redirect(`/recipes/${recipe.id}`);
}

export async function updateRecipe(recipeId: string, input: RecipeFormInput) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("recipes")
    .update({
      name: input.name,
      description: input.description,
      cuisine: input.cuisine,
      diet: input.diet,
      protein_tag: input.protein_tag,
      main_protein_source: input.main_protein_source,
      total_time_minutes: input.total_time_minutes,
      servings: input.servings,
      equipment: input.equipment,
      method: input.method,
      calories: input.calories,
      protein_g: input.protein_g,
      carbs_g: input.carbs_g,
      fat_g: input.fat_g,
      fibre_g: input.fibre_g,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recipeId);

  if (error) throw new Error(error.message);

  const { error: delError } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("recipe_id", recipeId);
  if (delError) throw new Error(delError.message);

  if (input.ingredients.length) {
    const rows = input.ingredients.map((ing, i) => ({
      recipe_id: recipeId,
      ingredient_name: ing.ingredient_name,
      quantity: ing.quantity,
      unit: ing.unit,
      category: ing.category,
      notes: ing.notes,
      sort_order: i,
    }));
    const { error: ingError } = await supabase.from("recipe_ingredients").insert(rows);
    if (ingError) throw new Error(ingError.message);
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  redirect(`/recipes/${recipeId}`);
}

export async function deleteRecipe(recipeId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
  if (error) throw new Error(error.message);
  revalidatePath("/recipes");
  redirect("/recipes");
}
