import { createClient } from "@/lib/supabase/server";

export async function getCommunityRatings(
  originIds: string[],
): Promise<Record<string, { avg: number; count: number }>> {
  if (!originIds.length) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("community_recipe_ratings", {
    origin_ids: originIds,
  });
  if (error || !data) return {};

  const map: Record<string, { avg: number; count: number }> = {};
  for (const row of data as { community_origin_id: string; avg_rating: number; rating_count: number }[]) {
    map[row.community_origin_id] = { avg: Number(row.avg_rating), count: Number(row.rating_count) };
  }
  return map;
}

export async function getCommunityHouseholdNames(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("community_household_names", { ids });
  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const row of data as { id: string; name: string }[]) map[row.id] = row.name;
  return map;
}
