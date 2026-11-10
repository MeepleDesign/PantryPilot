"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function shareRecipe(recipeId: string) {
  const supabase = await createClient();

  const { data: recipe, error: fetchError } = await supabase
    .from("recipes")
    .select("id, community_origin_id")
    .eq("id", recipeId)
    .single();
  if (fetchError || !recipe) throw new Error(fetchError?.message ?? "Recipe not found");

  const { error } = await supabase
    .from("recipes")
    .update({
      is_shared: true,
      shared_at: new Date().toISOString(),
      community_origin_id: recipe.community_origin_id ?? recipe.id,
    })
    .eq("id", recipeId);
  if (error) throw new Error(error.message);

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
}

export async function unshareRecipe(recipeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recipes")
    .update({ is_shared: false })
    .eq("id", recipeId);
  if (error) throw new Error(error.message);

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
}

export async function importCommunityRecipe(recipeId: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const { data: original, error: fetchError } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .eq("id", recipeId)
    .eq("is_shared", true)
    .single();
  if (fetchError || !original) {
    throw new Error("That recipe isn't available to import (it may have been unshared).");
  }

  const { data: copy, error: insertError } = await supabase
    .from("recipes")
    .insert({
      household_id: household.id,
      name: original.name,
      description: original.description,
      cuisine: original.cuisine,
      diet: original.diet,
      protein_tag: original.protein_tag,
      main_protein_source: original.main_protein_source,
      total_time_minutes: original.total_time_minutes,
      servings: original.servings,
      course: original.course,
      equipment: original.equipment,
      method: original.method,
      source: "community",
      calories: original.calories,
      protein_g: original.protein_g,
      carbs_g: original.carbs_g,
      fat_g: original.fat_g,
      fibre_g: original.fibre_g,
      nutrition_note: original.nutrition_note,
      image_url: original.image_url,
      tags: original.tags,
      prep_note: original.prep_note,
      community_origin_id: original.community_origin_id ?? original.id,
      imported_from_recipe_id: original.id,
      created_by: auth.user?.id,
    })
    .select()
    .single();
  if (insertError || !copy) throw new Error(insertError?.message ?? "Couldn't import that recipe.");

  const ingredients = (original.recipe_ingredients ?? []) as {
    ingredient_name: string;
    quantity: number | null;
    unit: string | null;
    category: string | null;
    notes: string | null;
    sort_order: number;
  }[];
  if (ingredients.length) {
    const rows = ingredients.map((ing) => ({
      recipe_id: copy.id,
      ingredient_name: ing.ingredient_name,
      quantity: ing.quantity,
      unit: ing.unit,
      category: ing.category,
      notes: ing.notes,
      sort_order: ing.sort_order,
    }));
    const { error: ingError } = await supabase.from("recipe_ingredients").insert(rows);
    if (ingError) throw new Error(ingError.message);
  }

  revalidatePath("/recipes");
  redirect(`/recipes/${copy.id}`);
}

export async function reportCommunityRecipe(recipeId: string, reason: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const { error } = await supabase.from("community_recipe_reports").insert({
    recipe_id: recipeId,
    reporter_user_id: auth.user?.id,
    reporter_household_id: household.id,
    reason,
  });
  if (error) throw new Error(error.message);
}
