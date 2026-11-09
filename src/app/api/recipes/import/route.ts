import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractRecipeFromPhotos, type PhotoInput } from "@/lib/actions/recipe-import";

export const maxDuration = 60;

const MAX_PHOTOS = 4;
const VALID_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const images = body?.images;

  if (!Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: "No photo data received" }, { status: 400 });
  }
  if (images.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `You can import up to ${MAX_PHOTOS} photos at once` }, { status: 400 });
  }
  for (const img of images) {
    if (typeof img?.base64 !== "string" || !img.base64 || !VALID_MEDIA_TYPES.has(img?.mediaType)) {
      return NextResponse.json({ error: "Unsupported photo data" }, { status: 400 });
    }
  }

  const photos: PhotoInput[] = images.map((img) => ({
    base64Data: img.base64,
    mediaType: img.mediaType,
  }));

  try {
    const recipe = await extractRecipeFromPhotos(photos);
    return NextResponse.json(recipe);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong reading that photo.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
