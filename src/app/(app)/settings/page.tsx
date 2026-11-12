import { Sparkles } from "lucide-react";
import { getCurrentHousehold } from "@/lib/current-household";
import { HouseholdSettingsForm, JoinHouseholdForm } from "@/components/settings-forms";
import { LinkButton } from "@/components/link-button";
import { AppearanceSettings } from "@/components/appearance-settings";

const FREE_INCLUDES = [
  "Unlimited recipes, pantry & shopping list",
  "Meal planner with batch-cook portion tracking",
  "Import recipes from any website",
];

export default async function SettingsPage() {
  const { household } = await getCurrentHousehold();

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 font-medium">Appearance</h2>
        <AppearanceSettings />
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 font-medium">Household</h2>
        <HouseholdSettingsForm household={household} />
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-1 text-sm font-medium">Invite your partner</p>
          <p className="mb-2 text-xs text-muted">
            Share this code so they can join your household and see the same
            recipes, pantry and shopping list.
          </p>
          <code className="rounded-lg bg-background px-3 py-1.5 text-sm font-semibold tracking-wide">
            {household.invite_code}
          </code>
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 text-sm font-medium">Joined the wrong household?</p>
          <JoinHouseholdForm />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-medium">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand-dark">
              <Sparkles className="h-4 w-4" />
            </span>
            Plan
          </h2>
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium capitalize text-brand-dark">
            {household.plan} plan
          </span>
        </div>
        <p className="mb-2 text-sm font-medium">Includes:</p>
        <ul className="mb-4 space-y-1 text-sm text-muted">
          {FREE_INCLUDES.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
        <LinkButton
          href="/billing"
          className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark"
        >
          See plans & billing
        </LinkButton>
      </section>
    </div>
  );
}
