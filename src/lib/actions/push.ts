"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function subscribeToPush(input: PushSubscriptionInput) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in.");
  const { household } = await getCurrentHousehold();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: auth.user.id,
      household_id: household.id,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth_key: input.keys.auth,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw new Error(error.message);
}

export async function unsubscribeFromPush(endpoint: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}
