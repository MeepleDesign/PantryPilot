export function normaliseIngredient(s: string) {
  return s.trim().toLowerCase();
}

export function ingredientKey(name: string, unit: string | null) {
  return `${normaliseIngredient(name)}|${normaliseIngredient(unit ?? "")}`;
}
