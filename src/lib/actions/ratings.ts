"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { revalidatePath } from "next/cache";

export async function rateRecipe(recipeId: string, rating: number) {
  if (rating < 1 || rating > 5 || (rating * 2) % 1 !== 0) {
    throw new Error("Rating must be between 1 and 5, in half-star steps");
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  const { household } = await getCurrentHousehold();

  const { error } = await supabase.from("recipe_ratings").upsert(
    {
      recipe_id: recipeId,
      household_id: household.id,
      user_id: auth.user.id,
      rating,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "recipe_id,user_id" },
  );
  if (error) throw new Error(error.message);

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
}

export async function clearRating(recipeId: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("recipe_ratings")
    .delete()
    .eq("recipe_id", recipeId)
    .eq("user_id", auth.user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
}
