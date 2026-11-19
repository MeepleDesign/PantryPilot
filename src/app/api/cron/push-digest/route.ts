import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification } from "@/lib/push";
import { expiryStatus } from "@/lib/expiry";
import { normalizeIngredientName } from "@/lib/ingredient-name";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  type PantryRow = { household_id: string; ingredient_name: string; unit: string | null; quantity: number; expiry_date: string | null };
  type KeyIngredientRow = { household_id: string; ingredient_name: string; unit: string | null; target_quantity: number };
  type SubRow = { id: string; household_id: string; endpoint: string; p256dh: string; auth_key: string };

  const [{ data: households }, { data: pantryItems }, { data: keyIngredients }, { data: subs }] =
    await Promise.all([
      supabase.from("households").select("id"),
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

  let sent = 0;
  let pruned = 0;

  for (const household of households ?? []) {
    const householdSubs = subsByHousehold.get(household.id) ?? [];
    if (!householdSubs.length) continue;

    const pantry = pantryByHousehold.get(household.id) ?? [];
    const expiringCount = pantry.filter((p) => expiryStatus(p.expiry_date) !== null).length;

    const pantryQtyByKey = new Map<string, number>();
    for (const p of pantry) {
      const key = normalizeIngredientName(p.ingredient_name);
      pantryQtyByKey.set(key, (pantryQtyByKey.get(key) ?? 0) + Number(p.quantity));
    }
    const lowKeyCount = (keysByHousehold.get(household.id) ?? []).filter((k) => {
      const have = pantryQtyByKey.get(normalizeIngredientName(k.ingredient_name)) ?? 0;
      return have < Number(k.target_quantity);
    }).length;

    if (expiringCount === 0 && lowKeyCount === 0) continue;

    const parts = [
      expiringCount > 0 ? `${expiringCount} item${expiringCount === 1 ? "" : "s"} expiring soon` : null,
      lowKeyCount > 0 ? `${lowKeyCount} key ingredient${lowKeyCount === 1 ? "" : "s"} running low` : null,
    ].filter(Boolean);

    for (const sub of householdSubs) {
      const ok = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth_key: sub.auth_key },
        {
          title: "Pantry check",
          body: parts.join(" · "),
          url: "/pantry",
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
