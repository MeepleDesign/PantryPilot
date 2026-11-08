import { createClient } from "@/lib/supabase/server";
import type { Household, Profile } from "@/lib/types";

export async function getCurrentHousehold(): Promise<{
  profile: Profile;
  household: Household;
}> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", auth.user.id)
    .single();

  if (profileError || !profile?.default_household_id) {
    throw new Error("No household found for this user");
  }

  const { data: household, error: householdError } = await supabase
    .from("households")
    .select("*")
    .eq("id", profile.default_household_id)
    .single();

  if (householdError || !household) {
    throw new Error("Household not found");
  }

  return { profile, household };
}
