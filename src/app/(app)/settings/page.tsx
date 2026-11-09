import { LogOut } from "lucide-react";
import { getCurrentHousehold } from "@/lib/current-household";
import {
  HouseholdSettingsForm,
  ProfileSettingsForm,
  JoinHouseholdForm,
} from "@/components/settings-forms";
import { signOut } from "@/app/login/actions";

export default async function SettingsPage() {
  const { profile, household } = await getCurrentHousehold();

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 font-medium">Your profile</h2>
        <ProfileSettingsForm profile={profile} />
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

      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-danger shadow-sm transition-colors hover:bg-danger/10"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Sign out
        </button>
      </form>
    </div>
  );
}
