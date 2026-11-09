"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { generateWeekPlan, type GenerateWeekResult } from "@/lib/actions/plan-generator";

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
  const [result, setResult] = useState<GenerateWeekResult | null>(null);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleGenerate() {
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await generateWeekPlan({
        dates: dates.map((d) => d.date),
        skipDates,
        specialDates,
        cuisines,
        wellnessTags,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't generate a plan.");
    } finally {
      setPending(false);
    }
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
          onClick={() => setOpen(false)}
          className="text-xs text-muted hover:text-foreground"
        >
          Close
        </button>
      </div>
      <p className="mb-3 text-xs text-muted">
        Fills empty dinner slots from your own saved recipes. Days you&apos;ve already planned are
        left alone.
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
        onClick={handleGenerate}
        disabled={pending}
        className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
      >
        {pending && <Spinner className="h-4 w-4" />}
        {pending ? "Generating…" : "Generate"}
      </button>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {result && (
        <div className="mt-3 text-sm">
          {result.usedFallbackPool && (
            <p className="mb-1 text-xs text-warn">
              No recipes matched your cuisine/preference filters, so we picked from all your
              recipes instead.
            </p>
          )}
          {result.planned.length > 0 && (
            <p className="text-success">Planned {result.planned.length} dinner(s).</p>
          )}
          {result.skipped.length > 0 && (
            <p className="text-muted">
              Couldn&apos;t plan: {result.skipped.map((s) => s.date).join(", ")} (no matching
              recipes).
            </p>
          )}
          {result.planned.length === 0 && result.skipped.length === 0 && (
            <p className="text-muted">Nothing to plan, every day already has a dinner.</p>
          )}
        </div>
      )}
    </div>
  );
}
