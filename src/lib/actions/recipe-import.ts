import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedRecipe } from "@/lib/recipe-extraction-types";

export type { ExtractedRecipe };

const EXTRACT_RECIPE_TOOL: Anthropic.Tool = {
  name: "extract_recipe",
  description:
    "Record structured recipe data read from a photo of a recipe (cookbook page, printed recipe, handwritten card, or recipe website screenshot).",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Recipe title" },
      description: { type: ["string", "null"], description: "Short one-line description, or null if none is evident" },
      cuisine: { type: ["string", "null"] },
      total_time_minutes: { type: ["number", "null"] },
      servings: { type: "number", description: "Number of servings the recipe makes; default to 4 if not stated" },
      course: { type: "string", enum: ["main", "side", "snack", "dessert"] },
      equipment: { type: ["string", "null"], description: "Any specific equipment or appliance settings mentioned" },
      steps: {
        type: "array",
        items: { type: "string" },
        description: "Method steps, in order, one instruction per entry",
      },
      calories: { type: ["number", "null"], description: "Estimated calories per serving" },
      protein_g: { type: ["number", "null"], description: "Estimated protein grams per serving" },
      carbs_g: { type: ["number", "null"], description: "Estimated carbohydrate grams per serving" },
      fat_g: { type: ["number", "null"], description: "Estimated fat grams per serving" },
      fibre_g: { type: ["number", "null"], description: "Estimated fibre grams per serving" },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Short descriptive tags, e.g. 'Freezer-friendly', 'Vegetarian', 'Quick'",
      },
      ingredients: {
        type: "array",
        items: {
          type: "object",
          properties: {
            ingredient_name: { type: "string" },
            quantity: { type: ["number", "null"] },
            unit: { type: ["string", "null"] },
          },
          required: ["ingredient_name"],
        },
      },
      low_confidence_fields: {
        type: "array",
        items: { type: "string" },
        description:
          "Names of fields you had to guess or estimate (e.g. because the photo was cropped, blurry, or didn't state nutrition) so the user knows to double-check them",
      },
    },
    required: ["name", "servings", "course", "steps", "ingredients", "low_confidence_fields"],
  },
};

export type PhotoInput = { base64Data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" };

export async function extractRecipeFromPhotos(photos: PhotoInput[]): Promise<ExtractedRecipe> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Photo import isn't configured yet (missing API key).");
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
      ? `These ${photos.length} photos are all of the same recipe (e.g. one side shows ingredients, another shows the method) — combine them into a single recipe. `
      : "Read this recipe photo. ";

  const response = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 4000,
    tools: [EXTRACT_RECIPE_TOOL],
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          {
            type: "text",
            text:
              instructionText +
              "Call the extract_recipe tool with its structured data — always respond with a tool call, never plain text. " +
              "Estimate nutrition per serving as best you can from the ingredients if it isn't printed on the photo(s). " +
              "List anything you guessed or estimated in low_confidence_fields.",
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "extract_recipe",
  );

  if (!toolUse) {
    throw new Error(
      "Couldn't read a recipe from that photo. Try a clearer photo or enter it manually.",
    );
  }

  return { ...(toolUse.input as Omit<ExtractedRecipe, "image_url">), image_url: null };
}
