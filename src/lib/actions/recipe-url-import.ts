import dns from "dns/promises";
import type { ExtractedRecipe } from "@/lib/recipe-extraction-types";
import type { RecipeCourse } from "@/lib/types";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 5_000_000;
const USER_AGENT = "PantryPilotBot/1.0 (+https://pantrypilot-five.vercel.app; recipe import)";

function isPrivateIp(ip: string): boolean {
  if (ip.includes(":")) {
    // IPv6: loopback, unique local (fc00::/7), link-local (fe80::/10)
    const lower = ip.toLowerCase();
    return (
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb")
    );
  }
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

async function assertSafeUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http/https URLs are supported.");
  }
  const { address } = await dns.lookup(url.hostname);
  if (isPrivateIp(address)) {
    throw new Error("That URL can't be imported.");
  }
}

async function fetchHtml(url: URL): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    });
    if (!res.ok) throw new Error(`The site responded with an error (${res.status}).`);
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) throw new Error("That URL doesn't look like a web page.");

    const reader = res.body?.getReader();
    if (!reader) return await res.text();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_RESPONSE_BYTES) throw new Error("That page is too large to import.");
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf-8");
  } finally {
    clearTimeout(timeout);
  }
}

type JsonLdNode = Record<string, unknown>;

function collectJsonLdNodes(html: string): JsonLdNode[] {
  const nodes: JsonLdNode[] = [];
  const scriptRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html))) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item && typeof item === "object") {
          if (Array.isArray((item as JsonLdNode)["@graph"])) {
            nodes.push(...((item as JsonLdNode)["@graph"] as JsonLdNode[]));
          } else {
            nodes.push(item as JsonLdNode);
          }
        }
      }
    } catch {
      // Malformed JSON-LD block, skip it.
    }
  }
  return nodes;
}

function isRecipeNode(node: JsonLdNode): boolean {
  const type = node["@type"];
  if (typeof type === "string") return type.toLowerCase() === "recipe";
  if (Array.isArray(type)) return type.some((t) => typeof t === "string" && t.toLowerCase() === "recipe");
  return false;
}

function asText(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value)) return asText(value[0]);
  if (value && typeof value === "object" && "name" in (value as JsonLdNode)) {
    return asText((value as JsonLdNode).name);
  }
  return null;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseIsoDurationMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const total = hours * 60 + minutes;
  return total > 0 ? total : null;
}

function parseLeadingNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const match = value.replace(",", ".").match(/[\d.]+/);
  return match ? Number(match[0]) : null;
}

function flattenInstructions(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    const lines = value
      .split(/\r?\n+/)
      .map((l) => stripHtml(l))
      .filter(Boolean);
    return lines.length ? lines : [stripHtml(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === "string") return [stripHtml(item)];
      if (item && typeof item === "object") {
        const node = item as JsonLdNode;
        if (Array.isArray(node.itemListElement)) return flattenInstructions(node.itemListElement);
        if (typeof node.text === "string") return [stripHtml(node.text)];
        if (typeof node.name === "string") return [stripHtml(node.name)];
      }
      return [];
    });
  }
  return [];
}

const UNIT_ALIASES: Record<string, string> = {
  teaspoon: "tsp", teaspoons: "tsp", tsp: "tsp",
  tablespoon: "tbsp", tablespoons: "tbsp", tbsp: "tbsp", tbsps: "tbsp",
  cup: "cup", cups: "cup",
  clove: "clove", cloves: "clove",
  pinch: "pinch", pinches: "pinch",
  slice: "slice", slices: "slice",
  can: "can", cans: "can",
  pack: "pack", packs: "pack", packet: "pack", packets: "pack",
  bunch: "bunch", bunches: "bunch",
  gram: "g", grams: "g", g: "g",
  kilogram: "kg", kilograms: "kg", kg: "kg",
  ounce: "oz", ounces: "oz", oz: "oz",
  pound: "lb", pounds: "lb", lb: "lb", lbs: "lb",
  milliliter: "ml", milliliters: "ml", millilitre: "ml", millilitres: "ml", ml: "ml",
  liter: "l", liters: "l", litre: "l", litres: "l", l: "l",
  pint: "pint", pints: "pint",
};

const VULGAR_FRACTIONS: Record<string, number> = {
  "¼": 0.25, "½": 0.5, "¾": 0.75,
  "⅓": 1 / 3, "⅔": 2 / 3,
  "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

function parseIngredientLine(raw: string): {
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
} {
  let text = raw.trim();

  const fractionChars = Object.keys(VULGAR_FRACTIONS).join("");
  const qtyMatch = text.match(
    new RegExp(`^(\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?\\s*[${fractionChars}]?|[${fractionChars}])\\s*`),
  );

  let quantity: number | null = null;
  if (qtyMatch) {
    const token = qtyMatch[1].trim();
    if (/^\d+\s+\d+\/\d+$/.test(token)) {
      const [whole, frac] = token.split(/\s+/);
      const [n, d] = frac.split("/").map(Number);
      quantity = Number(whole) + n / d;
    } else if (/^\d+\/\d+$/.test(token)) {
      const [n, d] = token.split("/").map(Number);
      quantity = n / d;
    } else if (VULGAR_FRACTIONS[token]) {
      quantity = VULGAR_FRACTIONS[token];
    } else {
      const lastChar = token.slice(-1);
      if (VULGAR_FRACTIONS[lastChar]) {
        quantity = Number(token.slice(0, -1) || 0) + VULGAR_FRACTIONS[lastChar];
      } else {
        quantity = Number(token);
      }
    }
    text = text.slice(qtyMatch[0].length);
  }

  let unit: string | null = null;
  const unitMatch = text.match(/^([a-zA-Z.]+)\.?\s+/);
  if (unitMatch) {
    const candidate = unitMatch[1].toLowerCase().replace(/\.$/, "");
    if (UNIT_ALIASES[candidate]) {
      unit = UNIT_ALIASES[candidate];
      text = text.slice(unitMatch[0].length);
    }
  }

  text = text.replace(/^of\s+/i, "").trim();

  return { ingredient_name: text || raw.trim(), quantity, unit };
}

function mapCourse(category: unknown): RecipeCourse {
  const text = asText(category)?.toLowerCase() ?? "";
  if (text.includes("dessert") || text.includes("sweet")) return "dessert";
  if (text.includes("side")) return "side";
  if (text.includes("snack") || text.includes("appetizer") || text.includes("starter")) return "snack";
  return "main";
}

export async function extractRecipeFromUrl(rawUrl: string): Promise<ExtractedRecipe> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }
  await assertSafeUrl(url);

  const html = await fetchHtml(url);
  const nodes = collectJsonLdNodes(html);
  const recipe = nodes.find(isRecipeNode);

  if (!recipe) {
    throw new Error(
      "Couldn't find a recipe on that page. Some sites don't publish structured recipe data, try a photo of the recipe instead.",
    );
  }

  const rawIngredients = Array.isArray(recipe.recipeIngredient)
    ? (recipe.recipeIngredient as unknown[]).filter((i): i is string => typeof i === "string")
    : [];

  const prepPlusCook =
    (parseIsoDurationMinutes(recipe.prepTime) ?? 0) + (parseIsoDurationMinutes(recipe.cookTime) ?? 0);
  const totalTime = parseIsoDurationMinutes(recipe.totalTime) ?? (prepPlusCook || null);

  const nutrition = (recipe.nutrition as JsonLdNode | undefined) ?? {};

  const yieldText = asText(recipe.recipeYield);
  const servings = yieldText ? parseLeadingNumber(yieldText) ?? 4 : 4;

  const imageNode = recipe.image;
  const imageUrl =
    typeof imageNode === "string"
      ? imageNode
      : Array.isArray(imageNode)
        ? asText(imageNode[0]) ?? (typeof imageNode[0] === "object" ? asText((imageNode[0] as JsonLdNode).url) : null)
        : imageNode && typeof imageNode === "object"
          ? asText((imageNode as JsonLdNode).url) ?? null
          : null;

  const lowConfidence = [
    "Ingredient quantities/units (auto-parsed from the site's text)",
    "Estimated nutrition, if shown",
  ];
  if (!recipe.totalTime && !recipe.prepTime && !recipe.cookTime) lowConfidence.push("Total time");

  return {
    name: asText(recipe.name) ?? "Imported recipe",
    description: asText(recipe.description),
    cuisine: asText(recipe.recipeCuisine),
    total_time_minutes: totalTime,
    servings,
    course: mapCourse(recipe.recipeCategory),
    equipment: null,
    steps: flattenInstructions(recipe.recipeInstructions),
    calories: parseLeadingNumber(nutrition.calories),
    protein_g: parseLeadingNumber(nutrition.proteinContent),
    carbs_g: parseLeadingNumber(nutrition.carbohydrateContent),
    fat_g: parseLeadingNumber(nutrition.fatContent),
    fibre_g: parseLeadingNumber(nutrition.fiberContent),
    tags: [],
    image_url: imageUrl,
    ingredients: rawIngredients.map(parseIngredientLine),
    low_confidence_fields: lowConfidence,
  };
}
