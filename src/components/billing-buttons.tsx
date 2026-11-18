"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession, createPortalSession } from "@/lib/actions/billing";
import { Spinner } from "@/components/spinner";
import { useToast } from "@/components/toast";

export function UpgradeButtons() {
  const [pending, startTransition] = useTransition();
  const [loadingInterval, setLoadingInterval] = useState<"month" | "year" | null>(null);
  const showToast = useToast();

  function upgrade(interval: "month" | "year") {
    setLoadingInterval(interval);
    startTransition(async () => {
      try {
        const url = await createCheckoutSession(interval);
        window.location.href = url;
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Couldn't start checkout — try again.");
        setLoadingInterval(null);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => upgrade("month")}
        className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
      >
        {pending && loadingInterval === "month" && <Spinner className="h-4 w-4" />}
        £1.99/month
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => upgrade("year")}
        className="flex items-center gap-2 rounded-lg border border-brand px-5 py-2 text-sm font-medium text-brand-dark hover:bg-brand/10 disabled:cursor-wait disabled:opacity-60"
      >
        {pending && loadingInterval === "year" && <Spinner className="h-4 w-4" />}
        £19.99/year
      </button>
    </div>
  );
}

export function ManageBillingButton() {
  const [pending, startTransition] = useTransition();
  const showToast = useToast();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          try {
            const url = await createPortalSession();
            window.location.href = url;
          } catch (e) {
            showToast(e instanceof Error ? e.message : "Couldn't open billing portal.");
          }
        });
      }}
      className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-background disabled:cursor-wait disabled:opacity-60"
    >
      {pending && <Spinner className="h-4 w-4" />}
      Manage billing
    </button>
  );
}
