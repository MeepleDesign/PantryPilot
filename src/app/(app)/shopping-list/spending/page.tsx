import Link from "next/link";
import { Receipt } from "lucide-react";
import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import { ReceiptScanSection } from "@/components/receipt-scan-section";
import { EmptyState } from "@/components/empty-state";

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
  receipt_items: { id: string; ingredient_name: string; price: number; quantity: number | null }[];
};

export default async function SpendingPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data: scans, error } = await supabase
    .from("receipt_scans")
    .select("id, store_name, purchased_at, total, receipt_items(id, ingredient_name, price, quantity)")
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
        Scan a receipt or order confirmation to track what you&apos;re actually spending.
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

      <ReceiptScanSection />

      {allScans.length > 0 ? (
        <div className="space-y-4">
          {allScans.map((scan) => {
            const scanTotal = scan.receipt_items.reduce((sum, i) => sum + Number(i.price), 0);
            return (
              <div key={scan.id} className="rounded-xl border border-border bg-surface shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{scan.store_name ?? "Receipt"}</p>
                    <p className="text-xs text-muted">{scan.purchased_at}</p>
                  </div>
                  <p className="text-sm font-medium">{money(scanTotal)}</p>
                </div>
                <div className="divide-y divide-border">
                  {scan.receipt_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span>{item.ingredient_name}</span>
                      <span className="text-muted">{money(Number(item.price))}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState icon={Receipt} title="No receipts scanned yet" body="Scan one above to start tracking your spend." />
        </div>
      )}
    </div>
  );
}
