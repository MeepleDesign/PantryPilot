type LinkBuilder = (query: string) => string;

const SUPERMARKET_SEARCH: { match: RegExp; build: LinkBuilder }[] = [
  {
    match: /tesco/i,
    build: (q) => `https://www.tesco.com/groceries/en-GB/search?query=${encodeURIComponent(q)}`,
  },
  {
    match: /sainsbury/i,
    build: (q) => `https://www.sainsburys.co.uk/gol-ui/SearchResults/${encodeURIComponent(q)}`,
  },
  {
    match: /asda/i,
    build: (q) => `https://groceries.asda.com/search/${encodeURIComponent(q)}`,
  },
  {
    match: /waitrose/i,
    build: (q) => `https://www.waitrose.com/ecom/shop/search?&searchTerm=${encodeURIComponent(q)}`,
  },
  {
    match: /ocado/i,
    build: (q) => `https://www.ocado.com/search?q=${encodeURIComponent(q)}`,
  },
];

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
