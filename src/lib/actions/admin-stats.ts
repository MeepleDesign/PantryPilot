"use server";

import { createClient } from "@/lib/supabase/server";

export type AdminPlatformStats = {
  households: number;
  users: number;
  household_recipes: number;
  shared_recipes: number;
  open_reports: number;
  receipt_scans: number;
  receipt_spend_total: number;
  pantry_items: number;
  ai_calls_30d: number;
  ai_input_tokens_30d: number;
  ai_output_tokens_30d: number;
  ai_calls_all_time: number;
  ai_input_tokens_all_time: number;
  ai_output_tokens_all_time: number;
  ai_by_feature: { feature: string; calls: number; input_tokens: number; output_tokens: number }[];
  top_stores: { store_name: string; scan_count: number; total_spend: number }[];
};

export type AdminHouseholdRow = {
  household_id: string;
  household_name: string;
  plan: string;
  created_at: string;
  member_count: number;
  recipe_count: number;
  pantry_item_count: number;
  receipt_scan_count: number;
};

export async function getAdminPlatformStats(): Promise<AdminPlatformStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_platform_stats");
  if (error) throw new Error(error.message);
  return data as AdminPlatformStats;
}

export async function getAdminHouseholdList(): Promise<AdminHouseholdRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_household_list");
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminHouseholdRow[];
}
