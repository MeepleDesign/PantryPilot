"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { normalizeIngredientName } from "@/lib/ingredient-name";
import { expiryStatus } from "@/lib/expiry";
import { revalidatePath } from "next/cache";
import type { KeyIngredient, KeyIngredientStatus, PantryItem } from "@/lib/types";

export async function addKeyIngredient(input: {
  ingredient_name: string;
  unit: string | null;
  target_quantity: number;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const name = input.ingredient_name.trim();
  if (!name) throw new Error("Ingredient name is required.");

  const { error } = await supabase.from("key_ingredients").upsert(
    {
      household_id: household.id,
      ingredient_name: name,
      unit: input.unit,
      target_quantity: Math.max(0, input.target_quantity) || 1,
      created_by: auth.user?.id,
    },
    { onConflict: "household_id,ingredient_name" },
  );
  if (error) throw new Error(error.message);

  revalidatePath("/pantry");
  revalidatePath("/dashboard");
}

/**
 * Quick toggle used from the pantry add/edit form: turns tracking on or
 * off for an ingredient by name. Turning on only creates a row if one
 * doesn't already exist for this name — it never overwrites an existing
 * target, so editing stock later doesn't quietly change your "keep at
 * least" goal. Turning off removes it outright.
 */
export async function toggleKeyIngredient(input: {
  ingredient_name: string;
  tracked: boolean;
  default_target_quantity: number;
  default_unit: string | null;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const name = input.ingredient_name.trim();
  if (!name) return;

  if (!input.tracked) {
    const { error } = await supabase
      .from("key_ingredients")
      .delete()
      .eq("household_id", household.id)
      .ilike("ingredient_name", name);
    if (error) throw new Error(error.message);
    revalidatePath("/pantry");
    revalidatePath("/dashboard");
    return;
  }

  const { error } = await supabase.from("key_ingredients").upsert(
    {
      household_id: household.id,
      ingredient_name: name,
      unit: input.default_unit,
      target_quantity: Math.max(0, input.default_target_quantity) || 1,
      created_by: auth.user?.id,
    },
    { onConflict: "household_id,ingredient_name", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);

  revalidatePath("/pantry");
  revalidatePath("/dashboard");
}

export async function removeKeyIngredient(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("key_ingredients").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/pantry");
  revalidatePath("/dashboard");
}

export async function getKeyIngredientStatuses(): Promise<KeyIngredientStatus[]> {
  const supabase = await createClient();
  const { household } = await getCurrentHousehold();

  const [{ data: keyIngredients, error: keyError }, { data: pantryItems, error: pantryError }] =
    await Promise.all([
      supabase
        .from("key_ingredients")
        .select("*")
        .eq("household_id", household.id)
        .order("ingredient_name"),
      supabase.from("pantry_items").select("*").eq("household_id", household.id),
    ]);
  if (keyError) throw new Error(keyError.message);
  if (pantryError) throw new Error(pantryError.message);

  const pantry = (pantryItems as PantryItem[] | null) ?? [];

  return ((keyIngredients as KeyIngredient[] | null) ?? []).map((key) => {
    const normalizedKey = normalizeIngredientName(key.ingredient_name);
    const matches = pantry.filter(
      (p) =>
        normalizeIngredientName(p.ingredient_name) === normalizedKey &&
        (!key.unit || !p.unit || normalizeIngredientName(p.unit) === normalizeIngredientName(key.unit)),
    );

    const currentQuantity = matches.reduce((sum, m) => sum + Number(m.quantity), 0);
    const expiryDates = matches.map((m) => m.expiry_date).filter((d): d is string => !!d);
    const nearestExpiry = expiryDates.length
      ? expiryDates.reduce((a, b) => (a < b ? a : b))
      : null;
    const worstExpiry = expiryDates.reduce<"expired" | "soon" | null>((worst, d) => {
      const status = expiryStatus(d);
      if (status === "expired") return "expired";
      if (status === "soon" && worst !== "expired") return "soon";
      return worst;
    }, null);

    let status: KeyIngredientStatus["status"];
    if (currentQuantity <= 0) status = "out";
    else if (currentQuantity < key.target_quantity) status = "low";
    else if (worstExpiry) status = "expiring";
    else status = "ok";

    return {
      id: key.id,
      ingredient_name: key.ingredient_name,
      unit: key.unit,
      target_quantity: key.target_quantity,
      current_quantity: currentQuantity,
      status,
      nearest_expiry: nearestExpiry,
    };
  });
}
