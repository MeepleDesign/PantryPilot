import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import { MealEntryRow } from "@/components/meal-entry-row";
import { QuickAddMealForm } from "@/components/quick-add-meal-form";
import { GenerateWeekForm } from "@/components/generate-week-form";
import { PROTEIN_TAGS } from "@/lib/taxonomies";
import { todayIsoForRegion } from "@/lib/local-date";
import type { MealPlanEntry, Region } from "@/lib/types";

function dateRange(days: number, region: Region | null | undefined) {
  const todayStr = todayIsoForRegion(region);
  const [y, m, d] = todayStr.split("-").map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d, 12));
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(anchor);
    day.setUTCDate(day.getUTCDate() + i);
    dates.push(day.toISOString().slice(0, 10));
  }
  return dates;
}

export default async function PlannerPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const dates = dateRange(7, household.region);

  const { data: entries, error } = await supabase
    .from("meal_plan_entries")
    .select(
      "*, recipes(name, servings, course), batch:meal_batches!meal_plan_entries_batch_id_fkey(recipe_name, portions_remaining)",
    )
    .eq("household_id", household.id)
    .gte("plan_date", dates[0])
    .lte("plan_date", dates[dates.length - 1])
    .order("plan_date");
  if (error) throw new Error(error.message);

  const { data: recipes, error: recipesError } = await supabase
    .from("recipes")
    .select("*")
    .or(`household_id.is.null,household_id.eq.${household.id}`)
    .order("name");
  if (recipesError) throw new Error(recipesError.message);

  const { data: availableBatches, error: batchesError } = await supabase
    .from("meal_batches")
    .select("id, recipe_name, portions_remaining, storage_location")
    .eq("household_id", household.id)
    .gt("portions_remaining", 0)
    .order("recipe_name");
  if (batchesError) throw new Error(batchesError.message);

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
        {dates.map((date, dayIndex) => {
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
          const d = new Date(date);
          const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
          const dayNum = d.toLocaleDateString("en-GB", { day: "numeric" });
          const month = d.toLocaleDateString("en-GB", { month: "short" });
          const isToday = dayIndex === 0;
          const relative = isToday ? "Today" : dayIndex === 1 ? "Tomorrow" : null;
          return (
            <div
              key={date}
              className={`animate-fade-in-up overflow-hidden rounded-xl border bg-surface shadow-sm ${
                isToday ? "border-brand/50 ring-2 ring-brand/10" : "border-border"
              }`}
            >
              <div
                className={`flex items-center gap-3 border-b border-border px-3 py-2 ${
                  isToday ? "bg-brand/5" : ""
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg leading-none ${
                    isToday
                      ? "bg-brand text-brand-foreground"
                      : "border border-border bg-background text-foreground"
                  }`}
                >
                  <span className="text-[9px] font-semibold uppercase tracking-wider opacity-80">
                    {month}
                  </span>
                  <span className="text-base font-semibold">{dayNum}</span>
                </span>
                <span className="text-sm font-medium">{weekday}</span>
                {relative && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      isToday ? "bg-brand/15 text-brand-dark" : "bg-background text-muted"
                    }`}
                  >
                    {relative}
                  </span>
                )}
                <span className="ml-auto text-xs text-muted">
                  {mains.length > 0
                    ? `${mains.length} meal${mains.length === 1 ? "" : "s"}`
                    : "Nothing planned"}
                </span>
              </div>
              {mains.length > 0 && (
                <div className="divide-y divide-border border-b border-border">
                  {mains.map((entry) => (
                    <MealEntryRow
                      key={entry.id}
                      entry={entry}
                      sides={sidesByParent.get(entry.id) ?? []}
                      sideRecipes={sideRecipes}
                      cookingMachine={household.cooking_machine}
                    />
                  ))}
                </div>
              )}
              <div>
                <QuickAddMealForm
                  date={date}
                  recipes={recipes ?? []}
                  batches={availableBatches ?? []}
                  cookingMachine={household.cooking_machine}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
