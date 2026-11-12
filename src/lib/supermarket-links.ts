type LinkBuilder = (query: string) => string;

const SUPERMARKET_SEARCH: { label: string; match: RegExp; build: LinkBuilder }[] = [
  {
    label: "Tesco",
    match: /tesco/i,
    build: (q) => `https://www.tesco.com/groceries/en-GB/search?query=${encodeURIComponent(q)}`,
  },
  {
    label: "Sainsbury's",
    match: /sainsbury/i,
    build: (q) => `https://www.sainsburys.co.uk/gol-ui/SearchResults/${encodeURIComponent(q)}`,
  },
  {
    label: "Asda",
    match: /asda/i,
    build: (q) => `https://groceries.asda.com/search/${encodeURIComponent(q)}`,
  },
  {
    label: "Waitrose",
    match: /waitrose/i,
    build: (q) => `https://www.waitrose.com/ecom/shop/search?&searchTerm=${encodeURIComponent(q)}`,
  },
  {
    label: "Ocado",
    match: /ocado/i,
    build: (q) => `https://www.ocado.com/search?q=${encodeURIComponent(q)}`,
  },
];

/** Display names of supermarkets with a confirmed direct search-URL pattern. */
export const DIRECT_SEARCH_SUPERMARKETS = SUPERMARKET_SEARCH.map((s) => s.label);

/** Whether this supermarket name resolves to a direct search link rather than the web-search fallback. */
export function hasDirectSearch(supermarketName: string | null | undefined): boolean {
  const name = (supermarketName ?? "").trim();
  return SUPERMARKET_SEARCH.some((s) => s.match.test(name));
}

/**
 * We only have confirmed search-URL patterns for a handful of retailers; anything else
 * (Morrisons, Aldi, Lidl, Co-op, Iceland, a custom name) falls back to a plain web search
 * scoped to that store's name, which is always correct even if less direct.
 */
export function buildSupermarketSearchUrl(
  supermarketName: string | null | undefined,
  itemName: string,
): string {
  const name = (supermarketName ?? "").trim();
  const matched = SUPERMARKET_SEARCH.find((s) => s.match.test(name));
  if (matched) return matched.build(itemName);

  const query = name ? `${name} ${itemName}` : itemName;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
