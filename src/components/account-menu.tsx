"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User, Settings, CreditCard, LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AccountMenu({
  displayName,
  householdName,
}: {
  displayName: string;
  householdName: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground shadow-sm transition-opacity hover:opacity-90"
        aria-label="Account menu"
      >
        {initialsOf(displayName)}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-30 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted">{householdName}</p>
          </div>
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-background"
            >
              <User className="h-4 w-4" strokeWidth={2} />
              My Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-background"
            >
              <Settings className="h-4 w-4" strokeWidth={2} />
              Settings
            </Link>
            <Link
              href="/billing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-background"
            >
              <CreditCard className="h-4 w-4" strokeWidth={2} />
              Billing
            </Link>
          </div>
          <div className="border-t border-border py-1">
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-danger hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
