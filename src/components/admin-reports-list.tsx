"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { EmptyState } from "@/components/empty-state";
import { adminDismissReport, adminUnshareRecipe } from "@/lib/actions/community-recipes";

export type AdminReportRow = {
  id: string;
  recipeId: string;
  recipeName: string;
  reason: string;
  createdAt: string;
};

export function AdminReportsList({ reports }: { reports: AdminReportRow[] }) {
  if (!reports.length) {
    return (
      <div className="rounded-xl border border-dashed border-border">
        <EmptyState icon={ShieldCheck} title="No open reports" body="All clear." />
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface shadow-sm">
      {reports.map((report) => (
        <ReportRow key={report.id} report={report} />
      ))}
    </div>
  );
}

function ReportRow({ report }: { report: AdminReportRow }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
      <div className="min-w-0">
        <Link href={`/recipes/${report.recipeId}`} className="font-medium hover:text-brand">
          {report.recipeName}
        </Link>
        <p className="text-xs text-muted">
          &ldquo;{report.reason}&rdquo; · {new Date(report.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex shrink-0 gap-3 text-xs">
        <button
          disabled={pending}
          onClick={() => startTransition(() => adminUnshareRecipe(report.recipeId))}
          className="flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 font-medium text-white disabled:cursor-wait disabled:opacity-60"
        >
          {pending && <Spinner className="h-3.5 w-3.5" />}
          Unshare recipe
        </button>
        <button
          disabled={pending}
          onClick={() => startTransition(() => adminDismissReport(report.id))}
          className="rounded-lg border border-border px-3 py-1.5 font-medium disabled:cursor-wait disabled:opacity-60"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
