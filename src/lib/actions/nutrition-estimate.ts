import Anthropic from "@anthropic-ai/sdk";
import { logAiUsage } from "@/lib/ai-usage";

export type NutritionEstimate = {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fibre_g: number | null;
  note: string;
};

const ESTIMATE_TOOL: Anthropic.Tool = {
  name: "estimate_nutrition",
  description: "Record an estimated per-serving nutrition breakdown for a recipe.",
  input_schema: {
    type: "object",
    properties: {
      calories: { type: ["number", "null"], description: "Estimated calories per serving" },
      protein_g: { type: ["number", "null"], description: "Estimated protein grams per serving" },
      carbs_g: { type: ["number", "null"], description: "Estimated carbohydrate grams per serving" },
      fat_g: { type: ["number", "null"], description: "Estimated fat grams per serving" },
      fibre_g: { type: ["number", "null"], description: "Estimated fibre grams per serving" },
      note: {
        type: "string",
        description: "One short sentence noting this is an AI estimate, not a lab measurement",
      },
    },
    required: ["calories", "protein_g", "carbs_g", "fat_g", "fibre_g", "note"],
  },
};

export async function estimateNutrition(input: {
  name: string;
  servings: number;
  ingredients: { ingredient_name: string; quantity: number | null; unit: string | null }[];
}): Promise<NutritionEstimate> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Nutrition estimation isn't configured yet (missing API key).");
  }
  if (!input.ingredients.length) {
    throw new Error("Add some ingredients first so there's something to estimate from.");
  }

  const client = new Anthropic();

  const ingredientLines = input.ingredients
    .map((i) => `- ${i.quantity ?? ""} ${i.unit ?? ""} ${i.ingredient_name}`.replace(/\s+/g, " ").trim())
    .join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 1000,
    tools: [ESTIMATE_TOOL],
    messages: [
      {
        role: "user",
        content:
          `Recipe: ${input.name}\nServings: ${input.servings}\nIngredients:\n${ingredientLines}\n\n` +
          "Estimate the nutrition per serving for this recipe and call the estimate_nutrition tool with your best estimate. " +
          "Always respond with a tool call, never plain text.",
      },
    ],
  });

  await logAiUsage("nutrition_estimate", response.model, response.usage);

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "estimate_nutrition",
  );

  if (!toolUse) {
    throw new Error("Couldn't estimate nutrition for this recipe. Try again or enter it manually.");
  }

  return toolUse.input as NutritionEstimate;
}
