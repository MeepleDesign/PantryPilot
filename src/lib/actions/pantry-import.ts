import Anthropic from "@anthropic-ai/sdk";
import type { StorageLocation } from "@/lib/types";

export type PhotoInput = { base64Data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" };

export type ExtractedPantryItem = {
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  storage_location: StorageLocation | null;
  uncertain_fields: string[];
};

export type ExtractedPantryScan = {
  items: ExtractedPantryItem[];
  notes: string | null;
};

const EXTRACT_PANTRY_TOOL: Anthropic.Tool = {
  name: "extract_pantry_items",
  description:
    "Record each distinct food/pantry item visible across the photo(s) of a cupboard, fridge, freezer, or shopping haul.",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            ingredient_name: { type: "string" },
            quantity: {
              type: ["number", "null"],
              description:
                "Best guess at how many packs/units are present, or the amount remaining if a package is partially used. Null if you genuinely can't tell.",
            },
            unit: {
              type: ["string", "null"],
              description: "e.g. g, kg, ml, l, pack, can, each. Null if unclear.",
            },
            storage_location: {
              type: ["string", "null"],
              enum: ["cupboard", "fridge", "freezer", "other", null],
              description: "Guess from context (e.g. visibly in a fridge) if possible, else null",
            },
            uncertain_fields: {
              type: "array",
              items: { type: "string" },
              description:
                "Plain-language notes on what you had to guess for this item, e.g. 'pack size not visible', 'amount remaining unclear'. Empty array if confident.",
            },
          },
          required: ["ingredient_name", "uncertain_fields"],
        },
      },
      notes: {
        type: ["string", "null"],
        description: "Anything overall worth flagging, e.g. items with no visible label",
      },
    },
    required: ["items"],
  },
};

export async function extractPantryItemsFromPhotos(photos: PhotoInput[]): Promise<ExtractedPantryScan> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Photo scan isn't configured yet (missing API key).");
  }
  if (photos.length === 0) {
    throw new Error("No photo was received.");
  }

  const client = new Anthropic();

  const imageBlocks: Anthropic.ImageBlockParam[] = photos.map((p) => ({
    type: "image",
    source: { type: "base64", media_type: p.mediaType, data: p.base64Data },
  }));

  const instructionText =
    photos.length > 1
      ? `These ${photos.length} photos are of the same pantry/fridge/shop. List each distinct item once, combining duplicates you see across photos. `
      : "Look at this photo of a cupboard, fridge, freezer, or shopping haul. ";

  const response = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 4000,
    tools: [EXTRACT_PANTRY_TOOL],
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          {
            type: "text",
            text:
              instructionText +
              "Call the extract_pantry_items tool listing every distinct food item you can identify. Always respond with a tool call, never plain text. " +
              "For each item, guess quantity/unit/storage_location where you reasonably can, and flag anything uncertain (like pack size or how much is left) in uncertain_fields so the user can confirm it before saving.",
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "extract_pantry_items",
  );

  if (!toolUse) {
    throw new Error(
      "Couldn't identify any items in that photo. Try a clearer photo or add items manually.",
    );
  }

  return toolUse.input as ExtractedPantryScan;
}
