"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark print:hidden"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
