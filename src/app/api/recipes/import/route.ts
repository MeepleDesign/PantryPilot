import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractRecipeFromPhoto } from "@/lib/actions/recipe-import";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const base64 = body?.base64;
  const mediaType = body?.mediaType;

  if (typeof base64 !== "string" || !base64) {
    return NextResponse.json({ error: "No photo data received" }, { status: 400 });
  }
  if (mediaType !== "image/jpeg" && mediaType !== "image/png" && mediaType !== "image/webp") {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  try {
    const recipe = await extractRecipeFromPhoto(base64, mediaType);
    return NextResponse.json(recipe);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong reading that photo.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
