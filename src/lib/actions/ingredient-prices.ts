"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { normalizeIngredientName } from "@/lib/ingredient-name";

export type KnownPrice = { price: number; updated_at: string };

export async function getKnownPrices(): Promise<Record<string, KnownPrice>> {
  const supabase = await createClient();
  const { household } = await getCurrentHousehold();

  const { data, error } = await supabase
    .from("ingredient_prices")
    .select("ingredient_name, price, updated_at")
    .eq("household_id", household.id);
  if (error) throw new Error(error.message);

  const map: Record<string, KnownPrice> = {};
  for (const row of data ?? []) {
    map[normalizeIngredientName(row.ingredient_name)] = {
      price: Number(row.price),
      updated_at: row.updated_at,
    };
  }
  return map;
}
