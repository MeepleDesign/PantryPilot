import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractRecipeFromUrl } from "@/lib/actions/recipe-url-import";

export const maxDuration = 30;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const url = body?.url;

  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "Paste a recipe URL first" }, { status: 400 });
  }

  try {
    const recipe = await extractRecipeFromUrl(url.trim());
    return NextResponse.json(recipe);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Couldn't import that URL.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
