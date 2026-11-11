import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { AdminReportsList, type AdminReportRow } from "@/components/admin-reports-list";

export default async function AdminReportsPage() {
  const { profile } = await getCurrentHousehold();
  if (!profile.is_admin) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted">
        You don&apos;t have access to this page.
      </div>
    );
  }

  const supabase = await createClient();

  const { data: reports, error } = await supabase
    .from("community_recipe_reports")
    .select("id, recipe_id, reason, created_at")
    .eq("resolved", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const recipeIds = Array.from(new Set((reports ?? []).map((r) => r.recipe_id)));
  const { data: recipes } = recipeIds.length
    ? await supabase.from("recipes").select("id, name").in("id", recipeIds)
    : { data: [] };
  const recipeNames = Object.fromEntries((recipes ?? []).map((r) => [r.id, r.name]));

  const rows: AdminReportRow[] = (reports ?? []).map((r) => ({
    id: r.id,
    recipeId: r.recipe_id,
    recipeName: recipeNames[r.recipe_id] ?? "(recipe no longer available)",
    reason: r.reason,
    createdAt: r.created_at,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Community recipe reports</h1>
        <p className="text-sm text-muted">
          {rows.length} open report{rows.length === 1 ? "" : "s"}
        </p>
      </div>

      <AdminReportsList reports={rows} />
    </div>
  );
}
