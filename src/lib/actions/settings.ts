"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { revalidatePath } from "next/cache";

export async function updateHouseholdSettings(input: {
  name: string;
  default_supermarket: string;
}) {
  const supabase = await createClient();
  const { household } = await getCurrentHousehold();

  const { error } = await supabase
    .from("households")
    .update({ name: input.name, default_supermarket: input.default_supermarket })
    .eq("id", household.id);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function updateProfileSettings(input: {
  display_name: string;
  dietary_preference: string;
  units: string;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.display_name,
      dietary_preference: input.dietary_preference,
      units: input.units,
    })
    .eq("user_id", auth.user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function joinHousehold(code: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("join_household_by_code", { code });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/");
}
