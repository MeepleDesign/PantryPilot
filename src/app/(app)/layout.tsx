import { getCurrentHousehold } from "@/lib/current-household";
import { Nav } from "@/components/nav";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { household } = await getCurrentHousehold();

  return (
    <div className="flex min-h-screen">
      <Nav householdName={household.name} />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
