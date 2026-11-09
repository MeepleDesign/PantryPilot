import { getCurrentHousehold } from "@/lib/current-household";
import { Nav } from "@/components/nav";
import { AccountMenu } from "@/components/account-menu";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { household, profile } = await getCurrentHousehold();

  return (
    <div className="flex min-h-screen">
      <Nav householdName={household.name} />
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
