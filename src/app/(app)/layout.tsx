import { getCurrentHousehold } from "@/lib/current-household";
import { createClient } from "@/lib/supabase/server";
import { expiryStatus } from "@/lib/expiry";
import { Nav, TopBarTitle } from "@/components/nav";
import { AccountMenu } from "@/components/account-menu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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
      <Nav
        householdName={household.name}
        expiringCount={expiringCount}
        isAdmin={profile.is_admin}
      />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 py-2.5 backdrop-blur md:px-8 print:hidden">
          <TopBarTitle householdName={household.name} />
          <AccountMenu
            displayName={profile.display_name ?? "You"}
            householdName={household.name}
            avatarUrl={profile.avatar_url}
            avatarEmoji={profile.avatar_emoji}
          />
        </div>
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
