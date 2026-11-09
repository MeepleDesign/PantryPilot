import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { estimateNutrition } from "@/lib/actions/nutrition-estimate";

export const maxDuration = 30;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name;
  const servings = body?.servings;
  const ingredients = body?.ingredients;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Enter a recipe name first" }, { status: 400 });
  }
  if (!Array.isArray(ingredients)) {
    return NextResponse.json({ error: "No ingredients received" }, { status: 400 });
  }

  try {
    const estimate = await estimateNutrition({
      name,
      servings: Number(servings) || 1,
      ingredients,
    });
    return NextResponse.json(estimate);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Couldn't estimate nutrition.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
