"use client";

import { useTransition } from "react";
import { confirmCooked } from "@/lib/actions/planner";
import { Spinner } from "@/components/spinner";

export function MarkCookedButton({ entryId, cooked }: { entryId: string; cooked: boolean }) {
  const [pending, startTransition] = useTransition();

  if (cooked) {
    return <span className="text-sm font-medium text-success">Cooked ✓</span>;
  }

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => confirmCooked(entryId))}
      className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-sm font-medium text-success disabled:cursor-wait disabled:opacity-60"
    >
      {pending && <Spinner className="h-3.5 w-3.5" />}
      {pending ? "Marking…" : "Mark cooked"}
    </button>
  );
}
