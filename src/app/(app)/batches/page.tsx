import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import { BatchList } from "@/components/batch-list";
import type { MealBatch } from "@/lib/types";

export default async function BatchesPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const [batches, recipes] = await Promise.all([
    supabase
      .from("meal_batches")
      .select("*")
      .eq("household_id", household.id)
      .gt("portions_remaining", 0)
      .order("cooked_date", { ascending: false }),
    supabase
      .from("recipes")
      .select("id, name")
      .or(`household_id.is.null,household_id.eq.${household.id}`)
      .order("name"),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Batches</h1>
        <p className="text-sm text-muted">Cooked-ahead meals in your freezer and fridge</p>
      </div>
      <BatchList batches={(batches.data as MealBatch[] | null) ?? []} recipes={recipes.data ?? []} />
    </div>
  );
}
