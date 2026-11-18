import { format, parseISO } from "date-fns";

/**
 * Display helper for ISO dates ("2026-11-13") — e.g. "13 Nov", or
 * "Fri 13 Nov" with the weekday. Falls back to the raw string if it
 * can't be parsed. Presentation only; never use the result for logic.
 */
export function formatShortDate(iso: string | null | undefined, withDay = false) {
  if (!iso) return "";
  try {
    return format(parseISO(iso), withDay ? "EEE d MMM" : "d MMM");
  } catch {
    return iso;
  }
}
