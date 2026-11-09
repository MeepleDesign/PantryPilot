export type UnitSystem = "metric" | "imperial";

export const COMMON_UNITS = [
  "tsp",
  "tbsp",
  "cup",
  "clove",
  "pinch",
  "slice",
  "can",
  "pack",
  "bunch",
  "each",
];

export const WEIGHT_UNITS: Record<UnitSystem, string[]> = {
  metric: ["g", "kg"],
  imperial: ["oz", "lb"],
};

export const VOLUME_UNITS: Record<UnitSystem, string[]> = {
  metric: ["ml", "l"],
  imperial: ["fl oz", "pint"],
};

export function unitGroups(system: UnitSystem) {
  return [
    { label: "Weight", options: WEIGHT_UNITS[system] },
    { label: "Volume", options: VOLUME_UNITS[system] },
    { label: "Common measures", options: COMMON_UNITS },
  ];
}

export function allKnownUnits(system: UnitSystem): string[] {
  return [...WEIGHT_UNITS[system], ...VOLUME_UNITS[system], ...COMMON_UNITS];
}
