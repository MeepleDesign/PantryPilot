import Link from "next/link";
import { Receipt } from "lucide-react";
import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import { ReceiptScanSection } from "@/components/receipt-scan-section";
import { ReceiptHistory } from "@/components/receipt-history";
import type { UnitSystem } from "@/lib/units";

function startOfMonthIso() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function money(n: number) {
  return `£${n.toFixed(2)}`;
}

type ReceiptScanWithItems = {
  id: string;
  store_name: string | null;
  purchased_at: string;
  total: number | null;
  receipt_items: {
    id: string;
    ingredient_name: string;
    price: number;
    quantity: number | null;
    unit: string | null;
  }[];
};

export default async function SpendingPage() {
  const { household, profile } = await getCurrentHousehold();
  const unitSystem: UnitSystem = profile.units === "imperial" ? "imperial" : "metric";
  const supabase = await createClient();

  const { data: scans, error } = await supabase
    .from("receipt_scans")
    .select(
      "id, store_name, purchased_at, total, receipt_items(id, ingredient_name, price, quantity, unit)",
    )
    .eq("household_id", household.id)
    .order("purchased_at", { ascending: false });
  if (error) throw new Error(error.message);

  const allScans = (scans ?? []) as ReceiptScanWithItems[];
  const monthStart = startOfMonthIso();
  const thisMonthScans = allScans.filter((s) => s.purchased_at >= monthStart);

  const spentThisMonth = thisMonthScans.reduce(
    (sum, s) => sum + s.receipt_items.reduce((isum, i) => isum + Number(i.price), 0),
    0,
  );
  const spentAllTime = allScans.reduce(
    (sum, s) => sum + s.receipt_items.reduce((isum, i) => isum + Number(i.price), 0),
    0,
  );

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/shopping-list" className="text-sm text-muted hover:text-foreground">
        ← Shopping list
      </Link>
      <h1 className="mb-1 mt-3 flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <Receipt className="h-6 w-6 text-brand" />
        Spending
      </h1>
      <p className="mb-6 text-sm text-muted">
        This tracks what you&apos;ve actually spent at the till — separate from your shopping list,
        which is what you still need to buy. Scan a receipt or order confirmation below each time
        you shop, and it&apos;ll total up your spend here and (optionally) add the items to your
        pantry.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 text-center shadow-sm">
          <p className="text-3xl font-semibold tracking-tight">{money(spentThisMonth)}</p>
          <p className="text-xs text-muted">spent this month</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center shadow-sm">
          <p className="text-3xl font-semibold tracking-tight">{money(spentAllTime)}</p>
          <p className="text-xs text-muted">all time</p>
        </div>
      </div>

      <ReceiptScanSection unitSystem={unitSystem} />

      <ReceiptHistory scans={allScans} unitSystem={unitSystem} />
    </div>
  );
}
