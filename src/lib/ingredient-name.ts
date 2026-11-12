export function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * True when two ingredient names share enough words to plausibly be the same
 * thing (e.g. "Baby Spinach" vs "Spinach") but are NOT an exact normalized
 * match — callers should check equality separately and treat that as a
 * stronger signal than this.
 */
export function similarIngredientNames(a: string, b: string): boolean {
  const na = normalizeIngredientName(a);
  const nb = normalizeIngredientName(b);
  if (na === nb) return false;
  if (!na || !nb) return false;

  const wordsOf = (s: string) => new Set(s.split(/\s+/).filter(Boolean));
  const wa = wordsOf(na);
  const wb = wordsOf(nb);
  if (wa.size === 0 || wb.size === 0) return false;

  const shared = [...wa].filter((w) => wb.has(w));
  const overlapRatio = shared.length / Math.min(wa.size, wb.size);
  return overlapRatio >= 0.5 || na.includes(nb) || nb.includes(na);
}
