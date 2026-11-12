import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";

export type AiFeature = "receipt_scan" | "pantry_scan" | "recipe_photo_import" | "nutrition_estimate";

export async function logAiUsage(
  feature: AiFeature,
  model: string,
  usage: { input_tokens: number; output_tokens: number },
) {
  try {
    const { household } = await getCurrentHousehold();
    const supabase = await createClient();
    await supabase.from("ai_usage_log").insert({
      household_id: household.id,
      feature,
      model,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
    });
  } catch {
    // Usage logging is best-effort and must never break the feature it's logging.
  }
}
