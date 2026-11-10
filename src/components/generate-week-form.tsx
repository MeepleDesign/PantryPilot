"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, X } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { MultiSelectChips } from "@/components/multi-select-chips";
import {
  previewWeekPlan,
  regenerateDayPick,
  confirmWeekPlan,
  type PlanProposal,
  type PreviewWeekResult,
  type ConfirmWeekResult,
} from "@/lib/actions/plan-generator";

export function GenerateWeekForm({
  dates,
  cuisineOptions,
  wellnessTagOptions,
}: {
  dates: { date: string; label: string }[];
  cuisineOptions: string[];
  wellnessTagOptions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [wellnessTags, setWellnessTags] = useState<string[]>([]);
  const [skipDates, setSkipDates] = useState<string[]>([]);
  const [specialDates, setSpecialDates] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preview, setPreview] = useState<PreviewWeekResult | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmWeekResult | null>(null);

  const labelByDate = new Map(dates.map((d) => [d.date, d.label]));

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handlePreview() {
    setPending(true);
    setError(null);
    setConfirmResult(null);
    try {
      const res = await previewWeekPlan({
        dates: dates.map((d) => d.date),
        skipDates,
        specialDates,
        cuisines,
        wellnessTags,
      });
      setPreview(res);
      setExcluded(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't generate a plan.");
    } finally {
      setPending(false);
    }
  }

  async function handleRegenerateDay(proposal: PlanProposal) {
    if (!preview) return;
    setRegenerating(proposal.date);
    try {
      const excludeIds = preview.proposals.map((p) => p.recipeId);
      const next = await regenerateDayPick({
        date: proposal.date,
        excludeRecipeIds: excludeIds,
        special: specialDates.includes(proposal.date),
        cuisines,
        wellnessTags,
      });
      if (next) {
        setPreview((prev) =>
          prev
            ? {
                ...prev,
                proposals: prev.proposals.map((p) => (p.date === proposal.date ? next : p)),
              }
            : prev,
        );
      }
    } catch {
      // leave the existing pick in place on failure
    } finally {
      setRegenerating(null);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setPending(true);
    setError(null);
    try {
      const toConfirm = preview.proposals.filter((p) => !excluded.has(p.date));
      const res = await confirmWeekPlan(toConfirm);
      setConfirmResult(res);
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the plan.");
    } finally {
      setPending(false);
    }
  }

  function handleDiscard() {
    setPreview(null);
    setExcluded(new Set());
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark"
      >
        <Sparkles className="h-4 w-4" />
        Generate this week
      </button>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-dashed border-brand/40 bg-brand/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-brand" />
          Generate this week
        </p>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            handleDiscard();
          }}
          className="text-xs text-muted hover:text-foreground"
        >
          Close
        </button>
      </div>

      {!preview && (
        <>
          <p className="mb-3 text-xs text-muted">
            Proposes dinners for empty days from your own saved recipes. You&apos;ll review the
            picks before anything is saved to the planner.
          </p>

          {cuisineOptions.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium text-muted">Cuisine (optional)</p>
              <MultiSelectChips values={cuisines} onChange={setCuisines} options={cuisineOptions} placeholder="Add a cuisine" />
            </div>
          )}

          {wellnessTagOptions.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium text-muted">Preferences (optional)</p>
              <MultiSelectChips
                values={wellnessTags}
                onChange={setWellnessTags}
                options={wellnessTagOptions}
                placeholder="e.g. High protein, Quick"
              />
            </div>
          )}

          <div className="mb-4">
            <p className="mb-1 text-xs font-medium text-muted">Days</p>
            <div className="divide-y divide-border rounded-lg border border-border bg-background">
              {dates.map((d) => (
                <div key={d.date} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span>{d.label}</span>
                  <div className="flex gap-3 text-xs">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={skipDates.includes(d.date)}
                        onChange={() => toggle(skipDates, setSkipDates, d.date)}
                        className="h-3.5 w-3.5 accent-brand"
                      />
                      Skip
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={specialDates.includes(d.date)}
                        onChange={() => toggle(specialDates, setSpecialDates, d.date)}
                        className="h-3.5 w-3.5 accent-brand"
                      />
                      Make it special
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handlePreview}
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
          >
            {pending && <Spinner className="h-4 w-4" />}
            {pending ? "Thinking…" : "Preview plan"}
          </button>
        </>
      )}

      {preview && (
        <>
          {preview.usedFallbackPool && (
            <p className="mb-2 text-xs text-warn">
              No recipes matched your cuisine/preference filters, so picks are from all your
              recipes instead.
            </p>
          )}
          {preview.proposals.length === 0 ? (
            <p className="mb-3 text-sm text-muted">
              Nothing to propose, every day already has a dinner (or was skipped).
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs font-medium text-muted">Review before saving</p>
              <div className="mb-3 divide-y divide-border rounded-lg border border-border bg-background">
                {preview.proposals.map((p) => (
                  <div key={p.date} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <label className="flex min-w-0 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!excluded.has(p.date)}
                        onChange={() =>
                          setExcluded((prev) => {
                            const next = new Set(prev);
                            if (next.has(p.date)) next.delete(p.date);
                            else next.add(p.date);
                            return next;
                          })
                        }
                        className="h-3.5 w-3.5 shrink-0 accent-brand"
                      />
                      <span className="shrink-0 text-muted">{labelByDate.get(p.date)}:</span>
                      <span className="min-w-0 truncate font-medium">{p.recipeName}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRegenerateDay(p)}
                      disabled={regenerating === p.date}
                      className="flex shrink-0 items-center gap-1 text-xs text-brand hover:text-brand-dark disabled:opacity-60"
                    >
                      {regenerating === p.date ? (
                        <Spinner className="h-3.5 w-3.5" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Swap
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          {preview.skipped.length > 0 && (
            <p className="mb-3 text-xs text-muted">
              Couldn&apos;t propose: {preview.skipped.map((s) => labelByDate.get(s.date) ?? s.date).join(", ")} (no
              matching recipes).
            </p>
          )}

          <div className="flex items-center gap-2">
            {preview.proposals.length > 0 && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending || excluded.size === preview.proposals.length}
                className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
              >
                {pending && <Spinner className="h-4 w-4" />}
                {pending ? "Saving…" : "Confirm & save to planner"}
              </button>
            )}
            <button
              type="button"
              onClick={handleDiscard}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-background"
            >
              <X className="h-4 w-4" />
              Discard
            </button>
          </div>
        </>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {confirmResult && (
        <div className="mt-3 text-sm">
          {confirmResult.confirmed.length > 0 && (
            <p className="text-success">Saved {confirmResult.confirmed.length} dinner(s) to the planner.</p>
          )}
          {confirmResult.conflicted.length > 0 && (
            <p className="text-muted">
              Skipped (already filled since preview): {confirmResult.conflicted.map((c) => labelByDate.get(c.date) ?? c.date).join(", ")}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
