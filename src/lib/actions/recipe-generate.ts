"use server";

import Anthropic from "@anthropic-ai/sdk";
import { getCurrentHousehold } from "@/lib/current-household";
import { isPro } from "@/lib/plan";
import { logAiUsage } from "@/lib/ai-usage";
import type { ExtractedRecipe } from "@/lib/recipe-extraction-types";
import type { RecipeCourse } from "@/lib/types";

const GENERATE_RECIPE_TOOL: Anthropic.Tool = {
  name: "generate_recipe",
  description: "Record a newly invented recipe that matches the requested criteria.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Recipe title" },
      description: { type: ["string", "null"], description: "Short one-line description" },
      cuisine: { type: ["string", "null"] },
      total_time_minutes: { type: ["number", "null"] },
      servings: { type: "number" },
      course: { type: "string", enum: ["main", "side", "snack", "dessert"] },
      equipment: { type: ["string", "null"], description: "Any specific equipment or appliance settings this recipe needs" },
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
    },
    required: ["name", "servings", "course", "steps", "ingredients"],
  },
};

export type RecipeGenerateInput = {
  cuisine: string | null;
  diet: string | null;
  course: RecipeCourse;
  cookingMethod: "any" | "multicooker" | "manual";
  servings: number;
  useItUp: boolean;
  pantryHints: string[];
  notes: string | null;
};

export async function generateRecipe(input: RecipeGenerateInput): Promise<ExtractedRecipe> {
  const { household } = await getCurrentHousehold();
  if (!isPro(household)) {
    throw new Error("AI recipe generation is a Pro feature — upgrade on the Billing page to use it.");
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Recipe generation isn't configured yet (missing API key).");
  }

  const client = new Anthropic();

  const criteria = [
    input.cuisine ? `Cuisine: ${input.cuisine}` : null,
    input.diet ? `Dietary requirement: ${input.diet}` : null,
    `Course: ${input.course}`,
    input.cookingMethod === "multicooker"
      ? `Cooking method: designed for a ${household.cooking_machine} multicooker, with equipment notes for it`
      : input.cookingMethod === "manual"
        ? "Cooking method: manual / stovetop, no multicooker"
        : null,
    `Servings: ${input.servings}`,
    input.useItUp && input.pantryHints.length
      ? `Prioritize using these ingredients the household already has, to help use them up before they go to waste: ${input.pantryHints.join(", ")}. It's fine to need a few extra ingredients too — just favor recipes that use several of these.`
      : null,
    input.notes ? `Other requirements: ${input.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 4000,
    tools: [GENERATE_RECIPE_TOOL],
    messages: [
      {
        role: "user",
        content:
          `Invent an original recipe matching these criteria:\n${criteria}\n\n` +
          "Call the generate_recipe tool with its structured data. Always respond with a tool call, never plain text. " +
          "Estimate nutrition per serving as best you can from the ingredients.",
      },
    ],
  });

  await logAiUsage("recipe_generate", response.model, response.usage);

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "generate_recipe",
  );

  if (!toolUse) {
    throw new Error("Couldn't generate a recipe from those criteria — try again.");
  }

  const generated = toolUse.input as Omit<ExtractedRecipe, "image_url" | "low_confidence_fields">;
  return {
    ...generated,
    image_url: null,
    low_confidence_fields: ["calories", "protein_g", "carbs_g", "fat_g", "fibre_g"],
  };
}
