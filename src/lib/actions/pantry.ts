"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { revalidatePath } from "next/cache";
import type { StorageLocation } from "@/lib/types";

export type PantryItemInput = {
  ingredient_name: string;
  storage_location: StorageLocation;
  quantity: number;
  unit: string | null;
  expiry_date: string | null;
  notes: string | null;
};

export async function addPantryItem(
  input: PantryItemInput,
  source: "manual" | "photo" | "receipt" = "manual",
) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const { data: item, error } = await supabase
    .from("pantry_items")
    .insert({
      household_id: household.id,
      ingredient_name: input.ingredient_name,
      storage_location: input.storage_location,
      quantity: input.quantity,
      unit: input.unit,
      expiry_date: input.expiry_date,
      notes: input.notes,
      source,
      created_by: auth.user?.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("pantry_stock_history").insert({
    household_id: household.id,
    pantry_item_id: item.id,
    ingredient_name: input.ingredient_name,
    change_type: "add",
    quantity_delta: input.quantity,
    unit: input.unit,
    reason:
      source === "photo"
        ? "Added via photo scan"
        : source === "receipt"
          ? "Added via receipt scan"
          : "Added manually",
    created_by: auth.user?.id,
  });

  revalidatePath("/pantry");
  revalidatePath("/dashboard");
}

export type PantryMatchCandidate = {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string | null;
  storage_location: StorageLocation;
};

export async function getPantryMatchCandidates(): Promise<PantryMatchCandidate[]> {
  const supabase = await createClient();
  const { household } = await getCurrentHousehold();

  const { data, error } = await supabase
    .from("pantry_items")
    .select("id, ingredient_name, quantity, unit, storage_location")
    .eq("household_id", household.id);
  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function increasePantryItem(
  id: string,
  quantityDelta: number,
  source: "manual" | "photo" | "receipt" = "manual",
) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const { data: existing, error: fetchError } = await supabase
    .from("pantry_items")
    .select("ingredient_name, quantity, unit")
    .eq("id", id)
    .single();
  if (fetchError || !existing) throw new Error(fetchError?.message ?? "Pantry item not found");

  const { error } = await supabase
    .from("pantry_items")
    .update({
      quantity: existing.quantity + quantityDelta,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.from("pantry_stock_history").insert({
    household_id: household.id,
    pantry_item_id: id,
    ingredient_name: existing.ingredient_name,
    change_type: "add",
    quantity_delta: quantityDelta,
    unit: existing.unit,
    reason: source === "photo" ? "Added via photo scan" : source === "receipt" ? "Added via receipt scan" : "Added manually",
    created_by: auth.user?.id,
  });

  revalidatePath("/pantry");
  revalidatePath("/dashboard");
}

export async function updatePantryItem(id: string, input: PantryItemInput) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const { data: existing } = await supabase
    .from("pantry_items")
    .select("quantity")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("pantry_items")
    .update({
      ingredient_name: input.ingredient_name,
      storage_location: input.storage_location,
      quantity: input.quantity,
      unit: input.unit,
      expiry_date: input.expiry_date,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  const delta = input.quantity - (existing?.quantity ?? 0);
  if (delta !== 0) {
    await supabase.from("pantry_stock_history").insert({
      household_id: household.id,
      pantry_item_id: id,
      ingredient_name: input.ingredient_name,
      change_type: "correction",
      quantity_delta: delta,
      unit: input.unit,
      reason: "Manual correction",
      created_by: auth.user?.id,
    });
  }

  revalidatePath("/pantry");
  revalidatePath("/dashboard");
}

export async function deletePantryItem(id: string, reason: "used" | "wasted" = "used") {
  const supabase = await createClient();
  const { household } = await getCurrentHousehold();
  const { data: auth } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from("pantry_items")
    .select("ingredient_name, quantity, unit")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("pantry_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (existing) {
    await supabase.from("pantry_stock_history").insert({
      household_id: household.id,
      pantry_item_id: null,
      ingredient_name: existing.ingredient_name,
      change_type: reason === "wasted" ? "waste" : "consume",
      quantity_delta: -existing.quantity,
      unit: existing.unit,
      reason: reason === "wasted" ? "Thrown away" : "Used up",
      created_by: auth.user?.id,
    });
  }

  revalidatePath("/pantry");
  revalidatePath("/dashboard");
}
