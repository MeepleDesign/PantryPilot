import type { AdminPlatformStats, AdminHouseholdRow } from "@/lib/actions/admin-stats";

function money(n: number) {
  return `£${n.toFixed(2)}`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3 text-center">
      <p className="text-xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

export function PlatformStatsTiles({ stats }: { stats: AdminPlatformStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Households" value={stats.households} />
      <Stat label="Users" value={stats.users} />
      <Stat label="Household recipes" value={stats.household_recipes} />
      <Stat label="Shared to community" value={stats.shared_recipes} />
      <Stat label="Open reports" value={stats.open_reports} />
      <Stat label="Pantry items tracked" value={stats.pantry_items} />
      <Stat label="Receipts scanned" value={stats.receipt_scans} />
      <Stat label="Tracked spend" value={money(stats.receipt_spend_total)} />
    </div>
  );
}

export function ClaudeApiUsage({ stats }: { stats: AdminPlatformStats }) {
  return (
    <div>
      {stats.ai_first_logged_at && (
        <p className="mb-3 text-xs text-muted">
          Tracked in-app since {new Date(stats.ai_first_logged_at).toLocaleDateString("en-GB")} —
          usage before that date, and any call that failed to log, won&apos;t appear here. For
          actual billed spend, check the{" "}
          <a
            href="https://console.anthropic.com/settings/cost"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand hover:text-brand-dark"
          >
            Anthropic console
          </a>
          .
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Calls (30d)" value={stats.ai_calls_30d} />
        <Stat
          label="Tokens in/out (30d)"
          value={`${stats.ai_input_tokens_30d.toLocaleString()} / ${stats.ai_output_tokens_30d.toLocaleString()}`}
        />
        <Stat label="Calls (all time)" value={stats.ai_calls_all_time} />
      </div>
      {stats.ai_by_feature.length > 0 && (
        <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-background">
          {stats.ai_by_feature.map((f) => (
            <div key={f.feature} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="capitalize">{f.feature.replace(/_/g, " ")}</span>
              <span className="text-muted">
                {f.calls} calls · {Number(f.input_tokens).toLocaleString()} in /{" "}
                {Number(f.output_tokens).toLocaleString()} out
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopSupermarkets({ stats }: { stats: AdminPlatformStats }) {
  if (!stats.top_stores.length) {
    return <p className="text-sm text-muted">No tracked spend yet.</p>;
  }
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-background">
      {stats.top_stores.map((s) => (
        <div key={s.store_name} className="flex items-center justify-between px-3 py-2 text-sm">
          <span>{s.store_name}</span>
          <span className="text-muted">
            {s.scan_count} receipt{s.scan_count === 1 ? "" : "s"} · {money(Number(s.total_spend))}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HouseholdsTable({ households }: { households: AdminHouseholdRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-background text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-3 py-2">Household</th>
            <th className="px-3 py-2">Plan</th>
            <th className="px-3 py-2">Members</th>
            <th className="px-3 py-2">Recipes</th>
            <th className="px-3 py-2">Pantry items</th>
            <th className="px-3 py-2">Receipts</th>
            <th className="px-3 py-2">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {households.map((h) => (
            <tr key={h.household_id}>
              <td className="px-3 py-2 font-medium">{h.household_name}</td>
              <td className="px-3 py-2 capitalize text-muted">{h.plan}</td>
              <td className="px-3 py-2">{h.member_count}</td>
              <td className="px-3 py-2">{h.recipe_count}</td>
              <td className="px-3 py-2">{h.pantry_item_count}</td>
              <td className="px-3 py-2">{h.receipt_scan_count}</td>
              <td className="px-3 py-2 text-muted">
                {new Date(h.created_at).toLocaleDateString("en-GB")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CommunityRecipeStats({ stats }: { stats: AdminPlatformStats["community"] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Community recipes" value={stats.total_recipes} />
        <Stat label="Shared by other users" value={stats.shared_by_others} />
        <Stat label="Imported by households" value={stats.total_imports} />
        <Stat
          label="Average rating"
          value={stats.avg_rating != null ? `${stats.avg_rating} ★ (${stats.rating_count})` : "No ratings yet"}
        />
      </div>
      {stats.top_imported.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Most imported
          </h3>
          <div className="divide-y divide-border rounded-lg border border-border bg-background">
            {stats.top_imported.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{r.name}</span>
                <span className="text-muted">
                  {r.import_count} import{r.import_count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
