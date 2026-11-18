/**
 * The multicooker-capacity warning used to be hardcoded to "the Omni Cook" everywhere.
 * It's now keyed off the household's own `cooking_machine` setting, so a Thermomix
 * household sees its own appliance name and bowl limit instead of someone else's.
 */
export const COOKING_MACHINES = [
  "OmniCook",
  "Thermomix",
  "Instant Pot",
  "Ninja Foodi",
  "None / cook manually",
];

/** Recipe tags that flag a recipe as designed for a multicooker, regardless of brand. */
export const MULTICOOKER_TAGS = ["OmniCook", "Thermomix", "Multicooker"];

const MAX_SERVINGS_BY_MACHINE: Record<string, number> = {
  OmniCook: 6,
  Thermomix: 6,
  "Instant Pot": 8,
  "Ninja Foodi": 8,
};

const DEFAULT_MAX_SERVINGS = 6;

export function isMulticookerRecipe(tags: string[]): boolean {
  return tags.some((t) => MULTICOOKER_TAGS.includes(t));
}

export function maxServingsForMachine(machine: string | null | undefined): number {
  if (!machine) return DEFAULT_MAX_SERVINGS;
  return MAX_SERVINGS_BY_MACHINE[machine] ?? DEFAULT_MAX_SERVINGS;
}

/** Whether to show a capacity warning at all — not for households cooking manually. */
export function machineHasCapacityLimit(machine: string | null | undefined): boolean {
  return !!machine && machine !== "None / cook manually";
}
