import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import { MealEntryRow } from "@/components/meal-entry-row";
import { QuickAddMealForm } from "@/components/quick-add-meal-form";
import { GenerateWeekForm } from "@/components/generate-week-form";
import { PROTEIN_TAGS } from "@/lib/taxonomies";
import type { MealPlanEntry, Recipe } from "@/lib/types";

function dateRange(days: number) {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default async function PlannerPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const dates = dateRange(7);

  const { data: entries, error } = await supabase
    .from("meal_plan_entries")
    .select("*, recipes(name, servings, course)")
    .eq("household_id", household.id)
    .gte("plan_date", dates[0])
    .lte("plan_date", dates[dates.length - 1])
    .order("plan_date");
  if (error) throw new Error(error.message);

  const { data: recipes, error: recipesError } = await supabase
    .from("recipes")
    .select("*")
    .order("name");
  if (recipesError) throw new Error(recipesError.message);

  const sideRecipes = (recipes ?? []).filter((r) => r.course === "side");

  const cuisineOptions = Array.from(
    new Set((recipes ?? []).map((r) => r.cuisine).filter((c): c is string => !!c)),
  ).sort();
  const wellnessTagOptions = Array.from(
    new Set([
      ...PROTEIN_TAGS,
      ...(recipes ?? []).flatMap((r) => r.tags ?? []),
    ]),
  ).sort();

  const dateOptions = dates.map((date) => ({
    date,
    label: new Date(date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Meal planner</h1>
        <p className="text-sm text-muted">Next 7 days</p>
      </div>

      <GenerateWeekForm
        dates={dateOptions}
        cuisineOptions={cuisineOptions}
        wellnessTagOptions={wellnessTagOptions}
      />

      <div className="space-y-4">
        {dates.map((date) => {
          const dayEntries = (entries as MealPlanEntry[] | null)?.filter(
            (e) => e.plan_date === date,
          );
          const mains = (dayEntries ?? []).filter((e) => !e.side_of);
          const sidesByParent = new Map<string, MealPlanEntry[]>();
          for (const e of dayEntries ?? []) {
            if (!e.side_of) continue;
            const list = sidesByParent.get(e.side_of) ?? [];
            list.push(e);
            sidesByParent.set(e.side_of, list);
          }
          const label = new Date(date).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "short",
          });
          return (
            <div key={date} className="rounded-xl border border-border bg-surface shadow-sm">
              <div className="border-b border-border px-3 py-2 text-sm font-medium">
                {label}
              </div>
              {mains.length ? (
                <div className="divide-y divide-border">
                  {mains.map((entry) => (
                    <MealEntryRow
                      key={entry.id}
                      entry={entry}
                      sides={sidesByParent.get(entry.id) ?? []}
                      sideRecipes={sideRecipes}
                    />
                  ))}
                </div>
              ) : (
                <p className="px-3 py-2 text-xs text-muted">Nothing planned</p>
              )}
              <div className="border-t border-border">
                <QuickAddMealForm date={date} recipes={recipes ?? []} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
