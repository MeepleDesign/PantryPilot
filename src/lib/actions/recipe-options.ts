import { createClient } from "@/lib/supabase/server";

export async function getLearnedRecipeOptions(householdId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("cuisine, diet")
    .eq("household_id", householdId);

  if (error || !data) return { cuisineOptions: [], dietOptions: [] };

  const cuisineOptions = Array.from(
    new Set(data.map((r) => r.cuisine).filter((v): v is string => !!v)),
  );
  const dietOptions = Array.from(
    new Set(data.flatMap((r) => r.diet ?? []).filter((v): v is string => !!v)),
  );

  return { cuisineOptions, dietOptions };
}
