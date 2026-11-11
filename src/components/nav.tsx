"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChefHat,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Archive,
  ShoppingCart,
  Snowflake,
  ShieldCheck,
} from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/pantry", label: "Pantry", icon: Archive },
  { href: "/shopping-list", label: "Shopping", icon: ShoppingCart },
  { href: "/batches", label: "Batches", icon: Snowflake },
];

export function Nav({
  householdName,
  expiringCount = 0,
  isAdmin = false,
}: {
  householdName: string;
  expiringCount?: number;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...ITEMS, { href: "/admin/reports", label: "Admin", icon: ShieldCheck }]
    : ITEMS;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-col border-r border-border bg-surface px-4 py-6 md:flex print:hidden">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm">
            <ChefHat className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">PantryPilot</p>
            <p className="truncate text-xs text-muted leading-tight">{householdName}</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            const badge = item.href === "/pantry" ? expiringCount : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand/10 text-brand-dark"
                    : "text-muted hover:bg-background hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {item.label}
                {badge > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold text-white">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface/95 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] backdrop-blur md:hidden print:hidden">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          const badge = item.href === "/pantry" ? expiringCount : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                active ? "text-brand-dark" : "text-muted"
              }`}
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 2} />
                {badge > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[9px] font-semibold text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
