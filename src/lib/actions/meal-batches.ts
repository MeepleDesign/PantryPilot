"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { revalidatePath } from "next/cache";
import type { MealBatchStorage } from "@/lib/types";

export type LogMealBatchInput = {
  recipe_id: string | null;
  recipe_name: string;
  meal_plan_entry_id: string | null;
  portions_total: number;
  storage_location: MealBatchStorage;
  notes: string | null;
};

export async function logMealBatch(input: LogMealBatchInput) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const { error } = await supabase.from("meal_batches").insert({
    household_id: household.id,
    recipe_id: input.recipe_id,
    recipe_name: input.recipe_name,
    meal_plan_entry_id: input.meal_plan_entry_id,
    portions_total: input.portions_total,
    portions_remaining: input.portions_total,
    storage_location: input.storage_location,
    notes: input.notes,
    created_by: auth.user?.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/batches");
  revalidatePath("/planner");
  revalidatePath("/dashboard");
}

export async function consumeBatchPortion(id: string, count: number = 1) {
  const supabase = await createClient();

  const { data: batch, error: fetchError } = await supabase
    .from("meal_batches")
    .select("portions_remaining")
    .eq("id", id)
    .single();
  if (fetchError || !batch) throw new Error(fetchError?.message ?? "Batch not found");

  const newRemaining = Math.max(0, batch.portions_remaining - count);

  const { error } = await supabase
    .from("meal_batches")
    .update({ portions_remaining: newRemaining })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/batches");
  revalidatePath("/dashboard");
}

export type UpdateMealBatchInput = {
  recipe_name: string;
  portions_total: number;
  portions_remaining: number;
  storage_location: MealBatchStorage;
};

export async function updateMealBatch(id: string, input: UpdateMealBatchInput) {
  const supabase = await createClient();

  const portions_total = Math.max(1, input.portions_total);
  const portions_remaining = Math.min(Math.max(0, input.portions_remaining), portions_total);

  const { error } = await supabase
    .from("meal_batches")
    .update({
      recipe_name: input.recipe_name,
      portions_total,
      portions_remaining,
      storage_location: input.storage_location,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/batches");
  revalidatePath("/dashboard");
}

export async function deleteMealBatch(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meal_batches").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/batches");
  revalidatePath("/dashboard");
}
