import type { Household } from "@/lib/types";

/** True if Pro features should be unlocked — a real subscription, or a manual override. */
export function isPro(household: Pick<Household, "plan" | "pro_override">): boolean {
  return household.plan === "pro" || household.pro_override;
}
