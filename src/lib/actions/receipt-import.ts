import Anthropic from "@anthropic-ai/sdk";

export type PhotoInput = {
  base64Data: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
};

export type ExtractedReceiptItem = {
  ingredient_name: string;
  price: number;
  quantity: number | null;
  uncertain_fields: string[];
};

export type ExtractedReceiptScan = {
  store_name: string | null;
  purchased_at: string | null;
  total: number | null;
  items: ExtractedReceiptItem[];
  notes: string | null;
};

const EXTRACT_RECEIPT_TOOL: Anthropic.Tool = {
  name: "extract_receipt_items",
  description:
    "Record each purchased item and its price from a photo of a supermarket receipt or an online order confirmation screenshot.",
  input_schema: {
    type: "object",
    properties: {
      store_name: {
        type: ["string", "null"],
        description: "The shop/retailer name if visible, else null",
      },
      purchased_at: {
        type: ["string", "null"],
        description: "The purchase date in YYYY-MM-DD format if visible, else null",
      },
      total: {
        type: ["number", "null"],
        description: "The total amount paid, if visible",
      },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            ingredient_name: { type: "string" },
            price: {
              type: "number",
              description: "The final price charged for this item (after any discount shown)",
            },
            quantity: {
              type: ["number", "null"],
              description: "How many units/packs were bought, if shown. Null if unclear.",
            },
            uncertain_fields: {
              type: "array",
              items: { type: "string" },
              description:
                "Plain-language notes on what you had to guess, e.g. 'name abbreviated on receipt'. Empty array if confident.",
            },
          },
          required: ["ingredient_name", "price", "uncertain_fields"],
        },
      },
      notes: {
        type: ["string", "null"],
        description: "Anything overall worth flagging, e.g. receipt partly cut off",
      },
    },
    required: ["items"],
  },
};

export async function extractReceiptItemsFromPhotos(
  photos: PhotoInput[],
): Promise<ExtractedReceiptScan> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Receipt scan isn't configured yet (missing API key).");
  }
  if (photos.length === 0) {
    throw new Error("No photo was received.");
  }

  const client = new Anthropic();

  const contentBlocks: (Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam)[] = photos.map(
    (p) =>
      p.mediaType === "application/pdf"
        ? {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: p.base64Data },
          }
        : {
            type: "image",
            source: { type: "base64", media_type: p.mediaType, data: p.base64Data },
          },
  );

  const instructionText =
    photos.length > 1
      ? `These ${photos.length} files are of the same receipt or order. `
      : "Look at this photo or PDF of a supermarket receipt or online order confirmation. ";

  const response = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 4000,
    tools: [EXTRACT_RECEIPT_TOOL],
    messages: [
      {
        role: "user",
        content: [
          ...contentBlocks,
          {
            type: "text",
            text:
              instructionText +
              "Call the extract_receipt_items tool listing every purchased item with its price. " +
              "Skip subtotal, VAT, loyalty-points, delivery-fee and total-summary lines — only list actual " +
              "purchased items, each with its own price. If a line shows a discount (e.g. 'was £3.00, now " +
              "£2.00'), use the final price charged. Always respond with a tool call, never plain text. " +
              "Flag anything uncertain (like an abbreviated item name) in uncertain_fields so the user can " +
              "confirm it before saving.",
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "extract_receipt_items",
  );

  if (!toolUse) {
    throw new Error(
      "Couldn't read any items on that receipt. Try a clearer photo or add spend manually.",
    );
  }

  return toolUse.input as ExtractedReceiptScan;
}
