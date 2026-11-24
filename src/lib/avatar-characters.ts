export type AvatarAccessory = "none" | "leaf" | "chefHat" | "steam" | "cap";

export type AvatarCharacter = {
  id: string;
  label: string;
  bodyColor: string;
  accessory: AvatarAccessory;
};

/**
 * Small hand-drawn cartoon mascots, rendered as inline SVG (see
 * AvatarGlyph) rather than fetched images — no external avatar service,
 * so there's nothing to go offline or rate-limit.
 */
export const AVATAR_CHARACTERS: AvatarCharacter[] = [
  { id: "tomato", label: "Tomato", bodyColor: "#e5533d", accessory: "leaf" },
  { id: "avocado", label: "Avocado", bodyColor: "#7ba05b", accessory: "none" },
  { id: "strawberry", label: "Strawberry", bodyColor: "#e0355b", accessory: "leaf" },
  { id: "lemon", label: "Lemon", bodyColor: "#f4c430", accessory: "none" },
  { id: "carrot", label: "Carrot", bodyColor: "#ed8936", accessory: "leaf" },
  { id: "eggplant", label: "Eggplant", bodyColor: "#6b4079", accessory: "leaf" },
  { id: "potato", label: "Potato", bodyColor: "#c89b6e", accessory: "none" },
  { id: "chef", label: "Chef", bodyColor: "#f0c99a", accessory: "chefHat" },
  { id: "coffee", label: "Coffee", bodyColor: "#8a5a3c", accessory: "steam" },
  { id: "toast", label: "Toast", bodyColor: "#e3a857", accessory: "none" },
  { id: "pea", label: "Pea pod", bodyColor: "#8fc76b", accessory: "none" },
  { id: "mushroom", label: "Mushroom", bodyColor: "#c0533e", accessory: "cap" },
];
