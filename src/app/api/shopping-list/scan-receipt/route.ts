import { createClient } from "@/lib/supabase/server";
import { extractReceiptItemsFromPhotos, type PhotoInput } from "@/lib/actions/receipt-import";

export const maxDuration = 60;

const MAX_PHOTOS = 4;
const VALID_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return jsonResponse({ error: "Not signed in" }, 401);
  }

  const body = await request.json().catch(() => null);
  const images = body?.images;

  if (!Array.isArray(images) || images.length === 0) {
    return jsonResponse({ error: "No photo data received" }, 400);
  }
  if (images.length > MAX_PHOTOS) {
    return jsonResponse({ error: `You can scan up to ${MAX_PHOTOS} photos at once` }, 400);
  }
  for (const img of images) {
    if (typeof img?.base64 !== "string" || !img.base64 || !VALID_MEDIA_TYPES.has(img?.mediaType)) {
      return jsonResponse({ error: "Unsupported photo data" }, 400);
    }
  }

  const photos: PhotoInput[] = images.map((img) => ({
    base64Data: img.base64,
    mediaType: img.mediaType,
  }));

  // Stream the response (NDJSON heartbeats + a final result/error line) so the
  // connection stays active while a slow extraction (e.g. a very long receipt)
  // runs — a plain awaited JSON response can otherwise get cut by upstream
  // infrastructure as "idle" well before this route's own maxDuration.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let open = true;
      const heartbeat = setInterval(() => {
        if (open) controller.enqueue(encoder.encode(JSON.stringify({ type: "heartbeat" }) + "\n"));
      }, 10000);
      try {
        const scan = await extractReceiptItemsFromPhotos(photos);
        controller.enqueue(encoder.encode(JSON.stringify({ type: "result", scan }) + "\n"));
      } catch (e) {
        const message = e instanceof Error ? e.message : "Something went wrong reading that receipt.";
        controller.enqueue(encoder.encode(JSON.stringify({ type: "error", error: message }) + "\n"));
      } finally {
        open = false;
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}
