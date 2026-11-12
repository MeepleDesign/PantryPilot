"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Info } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { SelectWithOther } from "@/components/select-with-other";
import { useToast } from "@/components/toast";
import { DIRECT_SEARCH_SUPERMARKETS, hasDirectSearch } from "@/lib/supermarket-links";
import { PROFILE_DIETS, SUPERMARKETS } from "@/lib/taxonomies";
import {
  updateHouseholdSettings,
  updateProfileSettings,
  joinHousehold,
} from "@/lib/actions/settings";
import type { Household, Profile } from "@/lib/types";

export function HouseholdSettingsForm({ household }: { household: Household }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [defaultSupermarket, setDefaultSupermarket] = useState(household.default_supermarket ?? "");
  const showToast = useToast();

  return (
    <form
      action={(formData) => {
        setSaved(false);
        startTransition(async () => {
          await updateHouseholdSettings({
            name: String(formData.get("name")),
            default_supermarket: defaultSupermarket,
          });
          setSaved(true);
          showToast("Household settings saved");
        });
      }}
      className="space-y-4"
    >
      <Field label="Household name" name="name" defaultValue={household.name} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Default supermarket</span>
        <SelectWithOther
          name="default_supermarket"
          value={defaultSupermarket}
          onChange={setDefaultSupermarket}
          options={SUPERMARKETS}
          placeholder="Select…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
        />
        {defaultSupermarket ? (
          hasDirectSearch(defaultSupermarket) ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Shopping list search icons jump straight to {defaultSupermarket} results.
            </p>
          ) : (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
              <Info className="h-3.5 w-3.5 shrink-0" />
              No direct search for {defaultSupermarket} yet — search icons open a general web
              search instead. Direct search works for {DIRECT_SEARCH_SUPERMARKETS.join(", ")}.
            </p>
          )
        ) : (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Direct search is available for {DIRECT_SEARCH_SUPERMARKETS.join(", ")}. Other stores
            fall back to a general web search.
          </p>
        )}
      </label>
      <SaveButton pending={pending} saved={saved} />
    </form>
  );
}

export function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [dietaryPreference, setDietaryPreference] = useState(
    profile.dietary_preference ?? "Vegetarian",
  );
  const showToast = useToast();

  return (
    <form
      action={(formData) => {
        setSaved(false);
        startTransition(async () => {
          await updateProfileSettings({
            display_name: String(formData.get("display_name")),
            dietary_preference: dietaryPreference,
            units: String(formData.get("units")),
          });
          setSaved(true);
          showToast("Profile saved");
        });
      }}
      className="space-y-4"
    >
      <Field label="Your name" name="display_name" defaultValue={profile.display_name ?? ""} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Dietary preference</span>
        <SelectWithOther
          value={dietaryPreference}
          onChange={setDietaryPreference}
          options={PROFILE_DIETS}
          placeholder="Select…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Units</span>
        <select
          name="units"
          defaultValue={profile.units}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="metric">Metric</option>
          <option value="imperial">Imperial</option>
        </select>
      </label>
      <SaveButton pending={pending} saved={saved} />
    </form>
  );
}

export function JoinHouseholdForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const showToast = useToast();

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await joinHousehold(String(formData.get("code")).trim());
            showToast("Joined household");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not join household");
          }
        });
      }}
      className="flex gap-2"
    >
      <input
        name="code"
        placeholder="Partner's invite code"
        required
        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-60"
      >
        {pending ? "Joining…" : "Join"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}

function SaveButton({ pending, saved }: { pending: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
    >
      {pending && <Spinner className="h-4 w-4" />}
      {pending ? "Saving…" : saved ? "Saved ✓" : "Save"}
    </button>
  );
}
