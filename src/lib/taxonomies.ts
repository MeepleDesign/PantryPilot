export const CUISINES = [
  "American",
  "Brazilian",
  "British",
  "Caribbean",
  "Chinese",
  "Ethiopian",
  "French",
  "Fusion",
  "Greek",
  "Indian",
  "Indonesian",
  "Italian",
  "Japanese",
  "Korean",
  "Lebanese",
  "Mexican",
  "Middle Eastern",
  "Moroccan",
  "Spanish",
  "Thai",
  "Turkish",
  "Vietnamese",
];

export const RECIPE_DIETS = [
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Omnivore",
  "Gluten-free",
  "Dairy-free",
  "Flexitarian",
];

export const PROFILE_DIETS = RECIPE_DIETS;

export const PROTEIN_TAGS = ["High protein", "Low protein", "Vegetarian", "Vegan"];

export const UK_SUPERMARKETS = [
  "Tesco",
  "Sainsbury's",
  "Asda",
  "Morrisons",
  "Waitrose",
  "Aldi",
  "Lidl",
  "Co-op",
  "Iceland",
  "Ocado",
  "Marks & Spencer",
];

export const US_SUPERMARKETS = [
  "Walmart",
  "Target",
  "Kroger",
  "Costco",
  "Safeway",
  "Publix",
  "Trader Joe's",
  "Whole Foods",
  "Aldi",
  "Albertsons",
];

/**
 * Default supermarket in each region — the US list differs from the UK list.
 * With no country set we don't know which list applies, so there's nothing
 * sensible to suggest (a merged list would mostly show the wrong country's
 * stores) — the caller should treat the default supermarket as N/A instead.
 */
export function supermarketsForRegion(region: string): string[] {
  if (region === "us") return US_SUPERMARKETS;
  if (region === "uk") return UK_SUPERMARKETS;
  return [];
}
