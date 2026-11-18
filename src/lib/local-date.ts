import type { Region } from "@/lib/types";

/**
 * A single representative IANA zone per region — an approximation (the US
 * spans several zones), but far closer to the user's actual "today" than
 * treating every household as UTC.
 */
export function regionTimeZone(region: Region | null | undefined): string {
  if (region === "us") return "America/New_York";
  return "Europe/London";
}

/** YYYY-MM-DD for the given instant, as a calendar date in that time zone. */
export function isoDateInZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

export function todayIsoForRegion(region: Region | null | undefined): string {
  return isoDateInZone(new Date(), regionTimeZone(region));
}
