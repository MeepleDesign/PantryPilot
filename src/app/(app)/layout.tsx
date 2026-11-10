import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import { expiryStatus } from "@/lib/expiry";
import { Nav } from "@/components/nav";
import { AccountMenu } from "@/components/account-menu";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { household, profile } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data: pantryItems } = await supabase
    .from("pantry_items")
    .select("expiry_date")
    .eq("household_id", household.id);
  const expiringCount = (pantryItems ?? []).filter(
    (p) => expiryStatus(p.expiry_date) !== null,
  ).length;

  return (
    <div className="flex min-h-screen">
      <Nav householdName={household.name} expiringCount={expiringCount} />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        <div className="flex items-center justify-end border-b border-border bg-surface px-4 py-3 md:px-8">
          <AccountMenu
            displayName={profile.display_name ?? "You"}
            householdName={household.name}
          />
        </div>
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
