import { getCurrentHousehold } from "@/lib/current-household";
import { ProfileSettingsForm } from "@/components/settings-forms";
import { AvatarUpload } from "@/components/avatar-upload";

export default async function ProfilePage() {
  const { profile, household } = await getCurrentHousehold();
  const name = profile.display_name ?? "You";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : (parts[0]?.[0] ?? "?").toUpperCase();

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="flex items-center gap-4">
        <AvatarUpload
          userId={profile.user_id}
          avatarUrl={profile.avatar_url}
          initials={initials}
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
          <p className="truncate text-sm text-muted">
            {name} · {household.name}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <ProfileSettingsForm profile={profile} />
      </section>
    </div>
  );
}
