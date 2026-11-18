import Link from "next/link";
import { Check, Minus, CreditCard, Sparkles, CheckCircle2 } from "lucide-react";
import { getCurrentHousehold } from "@/lib/current-household";
import { UpgradeButtons, ManageBillingButton } from "@/components/billing-buttons";
import { isPro } from "@/lib/plan";

const FEATURES: { label: string; free: boolean; pro: boolean }[] = [
  { label: "Unlimited recipes, pantry & shopping list", free: true, pro: true },
  { label: "Meal planner & batch-cook portion tracking", free: true, pro: true },
  { label: "Import recipes from any website", free: true, pro: true },
  { label: "AI recipe photo import", free: false, pro: true },
  { label: "AI pantry photo scan", free: false, pro: true },
  { label: "AI receipt scan & spend tracking", free: false, pro: true },
  { label: "Community recipe library (coming soon)", free: false, pro: true },
];

export default async function BillingPage({
  searchParams,
}: PageProps<"/billing">) {
  const params = await searchParams;
  const justUpgraded = params.success === "1";
  const { household } = await getCurrentHousehold();
  const pro = isPro(household);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/settings" className="text-sm text-muted hover:text-foreground">
        ← Settings
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-semibold tracking-tight">Plans & billing</h1>
      <p className="mb-6 text-sm text-muted">
        {household.pro_override ? (
          <>Pro features are unlocked on this household regardless of billing status.</>
        ) : (
          <>
            You&apos;re currently on the{" "}
            <span className="font-medium capitalize text-foreground">{household.plan}</span> plan
            {pro && household.plan_interval && ` (billed ${household.plan_interval}ly)`}
            {household.plan_status === "past_due" && (
              <span className="text-warn"> — payment past due</span>
            )}
            .
          </>
        )}
      </p>

      {justUpgraded && (
        <p className="mb-6 flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Thanks for upgrading! It can take a few seconds for your Pro features to unlock.
        </p>
      )}

      <div className="mb-8 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium">Feature</th>
              <th className="px-4 py-3 text-center font-medium">Free</th>
              <th className="bg-brand/5 px-4 py-3 text-center font-medium text-brand-dark">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Pro
                </span>
              </th>
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
                <td className="bg-brand/5 px-4 py-3 text-center">
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

      {!pro && (
        <div className="mb-8 rounded-xl border border-dashed border-border bg-background p-5 text-center">
          <p className="mb-3 text-sm text-muted">Upgrade to Pro to unlock AI import and scanning.</p>
          <UpgradeButtons />
        </div>
      )}

      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-medium">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand-dark">
            <CreditCard className="h-4 w-4" />
          </span>
          Payment method
        </h2>
        {household.stripe_customer_id ? (
          <div className="flex flex-col items-center gap-3 px-4 py-6 text-center text-sm text-muted">
            <p>Manage your card, invoices and subscription with Stripe.</p>
            <ManageBillingButton />
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted">
            No payment method on file. Upgrade to Pro above to add one.
          </p>
        )}
      </section>
    </div>
  );
}
