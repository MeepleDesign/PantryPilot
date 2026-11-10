"use client";

import { useState, useTransition } from "react";
import { Share2, Flag, Download } from "lucide-react";
import { Spinner } from "@/components/spinner";
import {
  shareRecipe,
  unshareRecipe,
  importCommunityRecipe,
  reportCommunityRecipe,
} from "@/lib/actions/community-recipes";

export function ShareRecipeControl({
  recipeId,
  isOwner,
  isShared,
}: {
  recipeId: string;
  isOwner: boolean;
  isShared: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [attested, setAttested] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reported, setReported] = useState(false);

  if (isOwner) {
    if (isShared) {
      return (
        <button
          disabled={pending}
          onClick={() => startTransition(() => unshareRecipe(recipeId))}
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground print:hidden"
        >
          {pending && <Spinner className="h-4 w-4" />}
          Shared with community · Unshare
        </button>
      );
    }

    if (confirming) {
      return (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3 text-sm print:hidden">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={attested}
              onChange={(e) => setAttested(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand"
            />
            <span>
              This is my own recipe (not copied from a cookbook, meal-kit box, or other
              copyrighted source).
            </span>
          </label>
          <div className="flex gap-2">
            <button
              disabled={!attested || pending}
              onClick={() =>
                startTransition(async () => {
                  await shareRecipe(recipeId);
                  setConfirming(false);
                })
              }
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending && <Spinner className="h-3.5 w-3.5" />}
              Share to community
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark print:hidden"
      >
        <Share2 className="h-4 w-4" />
        Share to community
      </button>
    );
  }

  if (!isShared) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <button
        disabled={pending}
        onClick={() => startTransition(() => importCommunityRecipe(recipeId))}
        className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? <Spinner className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
        Import to my recipes
      </button>
      {reported ? (
        <span className="text-xs text-muted">Reported, thanks</span>
      ) : reporting ? (
        <div className="flex items-center gap-1.5">
          <input
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Reason"
            className="w-32 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand"
          />
          <button
            disabled={!reportReason.trim() || pending}
            onClick={() =>
              startTransition(async () => {
                await reportCommunityRecipe(recipeId, reportReason.trim());
                setReported(true);
                setReporting(false);
              })
            }
            className="text-xs font-medium text-danger"
          >
            Send
          </button>
          <button
            onClick={() => setReporting(false)}
            className="text-xs text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setReporting(true)}
          className="flex items-center gap-1 text-xs text-muted hover:text-danger"
        >
          <Flag className="h-3.5 w-3.5" />
          Report
        </button>
      )}
    </div>
  );
}
