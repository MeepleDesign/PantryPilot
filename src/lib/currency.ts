import type { Region } from "@/lib/types";

export function currencySymbol(region: Region | null | undefined): string {
  if (region === "us") return "$";
  return "£";
}

export function formatMoney(amount: number, region: Region | null | undefined): string {
  return `${currencySymbol(region)}${amount.toFixed(2)}`;
}
