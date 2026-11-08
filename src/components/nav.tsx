"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/recipes", label: "Recipes", icon: "📖" },
  { href: "/planner", label: "Planner", icon: "🗓️" },
  { href: "/pantry", label: "Pantry", icon: "🧺" },
  { href: "/shopping-list", label: "Shopping", icon: "🛒" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Nav({ householdName }: { householdName: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-lg text-brand-foreground">
            🥘
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">PantryPilot</p>
            <p className="text-xs text-muted leading-tight">{householdName}</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {ITEMS.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-brand/10 text-brand-dark"
                    : "text-muted hover:bg-background hover:text-foreground"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-background hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface md:hidden">
        {ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                active ? "text-brand-dark" : "text-muted"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
