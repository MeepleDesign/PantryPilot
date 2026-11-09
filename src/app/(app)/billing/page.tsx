import Link from "next/link";
import { Check, Minus, CreditCard } from "lucide-react";
import { getCurrentHousehold } from "@/lib/current-household";

const FEATURES: { label: string; free: boolean; pro: boolean }[] = [
  { label: "Unlimited recipes, pantry & shopping list", free: true, pro: true },
  { label: "Meal planner & batch-cook portion tracking", free: true, pro: true },
  { label: "Import recipes from any website", free: true, pro: true },
  { label: "AI recipe photo import", free: false, pro: true },
  { label: "AI pantry photo scan", free: false, pro: true },
  { label: "Community recipe library (coming soon)", free: false, pro: true },
];

export default async function BillingPage() {
  const { household } = await getCurrentHousehold();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/settings" className="text-sm text-muted hover:text-foreground">
        ← Settings
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-semibold tracking-tight">Plans & billing</h1>
      <p className="mb-6 text-sm text-muted">
        You&apos;re currently on the{" "}
        <span className="font-medium capitalize text-foreground">{household.plan}</span> plan.
      </p>

      <div className="mb-8 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium">Feature</th>
              <th className="px-4 py-3 text-center font-medium">Free</th>
              <th className="px-4 py-3 text-center font-medium">Pro</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f) => (
              <tr key={f.label} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{f.label}</td>
                <td className="px-4 py-3 text-center">
                  {f.free ? (
                    <Check className="mx-auto h-4 w-4 text-success" />
                  ) : (
                    <Minus className="mx-auto h-4 w-4 text-muted" />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {f.pro ? (
                    <Check className="mx-auto h-4 w-4 text-success" />
                  ) : (
                    <Minus className="mx-auto h-4 w-4 text-muted" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-8 rounded-xl border border-dashed border-border bg-background p-5 text-center">
        <p className="mb-3 text-sm text-muted">
          Pro plan pricing and upgrades are coming soon.
        </p>
        <button
          type="button"
          disabled
          className="rounded-lg bg-brand px-5 py-2 text-sm font-medium text-brand-foreground opacity-50"
        >
          Upgrade to Pro
        </button>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-medium">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand-dark">
            <CreditCard className="h-4 w-4" />
          </span>
          Payment method
        </h2>
        <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted">
          No payment method on file — this app is currently free to use. Payment details will
          appear here once paid plans launch.
        </p>
      </section>
    </div>
  );
}
