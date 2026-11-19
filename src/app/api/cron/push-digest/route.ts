import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification } from "@/lib/push";
import { expiryStatus } from "@/lib/expiry";
import { normalizeIngredientName } from "@/lib/ingredient-name";
import { ingredientKey } from "@/lib/ingredient-match";
import { todayIsoForRegion } from "@/lib/local-date";

export const maxDuration = 60;

const MEAL_SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  type HouseholdRow = { id: string; region: "uk" | "us" | "unspecified" };
  type PantryRow = { household_id: string; ingredient_name: string; unit: string | null; quantity: number; expiry_date: string | null };
  type KeyIngredientRow = { household_id: string; ingredient_name: string; unit: string | null; target_quantity: number };
  type SubRow = { id: string; household_id: string; endpoint: string; p256dh: string; auth_key: string };
  type MealEntryRow = {
    household_id: string;
    plan_date: string;
    meal_slot: string;
    batch_multiplier: number;
    recipe_id: string | null;
  };
  type RecipeIngredientRow = { recipe_id: string; ingredient_name: string; unit: string | null; quantity: number | null };

  const [
    { data: households },
    { data: pantryItems },
    { data: keyIngredients },
    { data: subs },
    { data: mealEntries },
  ] = await Promise.all([
    supabase.from("households").select("id, region").returns<HouseholdRow[]>(),
    supabase
      .from("pantry_items")
      .select("household_id, ingredient_name, unit, quantity, expiry_date")
      .returns<PantryRow[]>(),
    supabase
      .from("key_ingredients")
      .select("household_id, ingredient_name, unit, target_quantity")
      .returns<KeyIngredientRow[]>(),
    supabase
      .from("push_subscriptions")
      .select("id, household_id, endpoint, p256dh, auth_key")
      .returns<SubRow[]>(),
    supabase
      .from("meal_plan_entries")
      .select("household_id, plan_date, meal_slot, batch_multiplier, recipe_id")
      .eq("cooked", false)
      .not("recipe_id", "is", null)
      .returns<MealEntryRow[]>(),
  ]);

  const pantryByHousehold = new Map<string, PantryRow[]>();
  for (const item of pantryItems ?? []) {
    const list = pantryByHousehold.get(item.household_id) ?? [];
    list.push(item);
    pantryByHousehold.set(item.household_id, list);
  }

  const keysByHousehold = new Map<string, KeyIngredientRow[]>();
  for (const key of keyIngredients ?? []) {
    const list = keysByHousehold.get(key.household_id) ?? [];
    list.push(key);
    keysByHousehold.set(key.household_id, list);
  }

  const subsByHousehold = new Map<string, SubRow[]>();
  for (const sub of subs ?? []) {
    const list = subsByHousehold.get(sub.household_id) ?? [];
    list.push(sub);
    subsByHousehold.set(sub.household_id, list);
  }

  const todaysEntriesByHousehold = new Map<string, MealEntryRow[]>();
  for (const household of households ?? []) {
    const today = todayIsoForRegion(household.region);
    const todaysEntries = (mealEntries ?? []).filter(
      (e) => e.household_id === household.id && e.plan_date === today,
    );
    if (todaysEntries.length) todaysEntriesByHousehold.set(household.id, todaysEntries);
  }

  const todaysRecipeIds = [
    ...new Set([...todaysEntriesByHousehold.values()].flat().map((e) => e.recipe_id as string)),
  ];

  const [{ data: recipes }, { data: recipeIngredients }] = await Promise.all([
    todaysRecipeIds.length
      ? supabase.from("recipes").select("id, name").in("id", todaysRecipeIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    todaysRecipeIds.length
      ? supabase
          .from("recipe_ingredients")
          .select("recipe_id, ingredient_name, unit, quantity")
          .in("recipe_id", todaysRecipeIds)
          .returns<RecipeIngredientRow[]>()
      : Promise.resolve({ data: [] as RecipeIngredientRow[] }),
  ]);

  const recipeNameById = new Map((recipes ?? []).map((r) => [r.id, r.name]));
  const ingredientsByRecipe = new Map<string, RecipeIngredientRow[]>();
  for (const ri of recipeIngredients ?? []) {
    const list = ingredientsByRecipe.get(ri.recipe_id) ?? [];
    list.push(ri);
    ingredientsByRecipe.set(ri.recipe_id, list);
  }

  let sent = 0;
  let pruned = 0;

  for (const household of households ?? []) {
    const householdSubs = subsByHousehold.get(household.id) ?? [];
    if (!householdSubs.length) continue;

    const pantry = pantryByHousehold.get(household.id) ?? [];
    const expiringCount = pantry.filter((p) => expiryStatus(p.expiry_date) !== null).length;

    const pantryQtyByName = new Map<string, number>();
    const pantryQtyByKey = new Map<string, number>();
    for (const p of pantry) {
      const nameKey = normalizeIngredientName(p.ingredient_name);
      pantryQtyByName.set(nameKey, (pantryQtyByName.get(nameKey) ?? 0) + Number(p.quantity));
      const key = ingredientKey(p.ingredient_name, p.unit);
      pantryQtyByKey.set(key, (pantryQtyByKey.get(key) ?? 0) + Number(p.quantity));
    }
    const lowKeyCount = (keysByHousehold.get(household.id) ?? []).filter((k) => {
      const have = pantryQtyByName.get(normalizeIngredientName(k.ingredient_name)) ?? 0;
      return have < Number(k.target_quantity);
    }).length;

    const mealLines = (todaysEntriesByHousehold.get(household.id) ?? []).map((entry) => {
      const recipeName = recipeNameById.get(entry.recipe_id as string) ?? "a recipe";
      const ingredients = ingredientsByRecipe.get(entry.recipe_id as string) ?? [];
      const missing = ingredients.filter((ri) => {
        if (ri.quantity == null) return false;
        const needed = ri.quantity * Number(entry.batch_multiplier);
        const have = pantryQtyByKey.get(ingredientKey(ri.ingredient_name, ri.unit)) ?? 0;
        return have < needed;
      });
      const slotLabel = MEAL_SLOT_LABEL[entry.meal_slot] ?? entry.meal_slot;
      if (missing.length === 0) return `${slotLabel}: ${recipeName} — ready to cook`;
      const names = missing.slice(0, 3).map((m) => m.ingredient_name);
      const extra = missing.length > 3 ? ` +${missing.length - 3} more` : "";
      return `${slotLabel}: ${recipeName} — missing ${names.join(", ")}${extra}`;
    });

    if (mealLines.length === 0 && expiringCount === 0 && lowKeyCount === 0) continue;

    const pantryLine = [
      expiringCount > 0 ? `${expiringCount} item${expiringCount === 1 ? "" : "s"} expiring soon` : null,
      lowKeyCount > 0 ? `${lowKeyCount} key ingredient${lowKeyCount === 1 ? "" : "s"} running low` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const body = [...mealLines, pantryLine].filter(Boolean).join("\n");
    const title = mealLines.length ? "Today's meals" : "Pantry check";

    for (const sub of householdSubs) {
      const ok = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth_key: sub.auth_key },
        {
          title,
          body,
          url: mealLines.length ? "/planner" : "/pantry",
        },
      );
      if (ok) {
        sent++;
      } else {
        pruned++;
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }

  return NextResponse.json({ sent, pruned });
}
