import { getCurrentHousehold } from "@/lib/current-household";
import { ProfileSettingsForm } from "@/components/settings-forms";

export default async function ProfilePage() {
  const { profile } = await getCurrentHousehold();

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <ProfileSettingsForm profile={profile} />
      </section>
    </div>
  );
}
