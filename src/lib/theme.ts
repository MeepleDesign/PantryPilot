export type ThemeMode = "light" | "dark" | "system";
export type ThemeAccent = "green" | "blue" | "purple" | "terracotta";

export const THEME_MODES: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export const THEME_ACCENTS: { value: ThemeAccent; label: string; swatch: string }[] = [
  { value: "green", label: "Green", swatch: "#2f7a4f" },
  { value: "blue", label: "Blue", swatch: "#2563a8" },
  { value: "purple", label: "Purple", swatch: "#6d4fa0" },
  { value: "terracotta", label: "Terracotta", swatch: "#b2531f" },
];

export const THEME_MODE_KEY = "pp-theme-mode";
export const THEME_ACCENT_KEY = "pp-theme-accent";

export function applyTheme(mode: ThemeMode, accent: ThemeAccent) {
  const root = document.documentElement;
  if (mode === "system") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = mode;
  }
  if (accent === "green") {
    delete root.dataset.accent;
  } else {
    root.dataset.accent = accent;
  }
}
