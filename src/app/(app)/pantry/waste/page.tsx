import Link from "next/link";
import { Trash2 } from "lucide-react";
import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";

function startOfMonthIso() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function WasteTrackerPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data: wasteRows, error } = await supabase
    .from("pantry_stock_history")
    .select("ingredient_name, created_at")
    .eq("household_id", household.id)
    .eq("change_type", "waste")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const monthStart = startOfMonthIso();
  const thisMonth = (wasteRows ?? []).filter((r) => r.created_at >= monthStart);

  const countByIngredient = new Map<string, number>();
  for (const r of thisMonth) {
    countByIngredient.set(r.ingredient_name, (countByIngredient.get(r.ingredient_name) ?? 0) + 1);
  }
  const topWasted = [...countByIngredient.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/pantry" className="text-sm text-muted hover:text-foreground">
        ← Pantry
      </Link>
      <h1 className="mb-1 mt-3 flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <Trash2 className="h-6 w-6 text-danger" />
        Food waste
      </h1>
      <p className="mb-6 text-sm text-muted">Based on items you&apos;ve marked as wasted when removing them from the pantry.</p>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm text-center">
          <p className="text-3xl font-semibold tracking-tight">{thisMonth.length}</p>
          <p className="text-xs text-muted">items wasted this month</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm text-center">
          <p className="text-3xl font-semibold tracking-tight">{(wasteRows ?? []).length}</p>
          <p className="text-xs text-muted">all time</p>
        </div>
      </div>

      {topWasted.length > 0 ? (
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <h2 className="border-b border-border px-4 py-2.5 text-sm font-medium">
            Most wasted this month
          </h2>
          <div className="divide-y divide-border">
            {topWasted.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span>{name}</span>
                <span className="text-muted">
                  {count} time{count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState icon={Trash2} title="No waste logged this month" body="Nice work." />
        </div>
      )}
    </div>
  );
}
