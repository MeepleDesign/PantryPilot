export type ExpiryStatus = "expired" | "soon" | null;

const SOON_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export function expiryStatus(expiryDate: string | null, now: number = Date.now()): ExpiryStatus {
  if (!expiryDate) return null;
  const time = new Date(expiryDate).getTime();
  if (time < now) return "expired";
  if (time <= now + SOON_WINDOW_MS) return "soon";
  return null;
}
