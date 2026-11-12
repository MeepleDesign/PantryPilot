import { THEME_MODE_KEY, THEME_ACCENT_KEY } from "@/lib/theme";

const script = `
(function () {
  try {
    var mode = localStorage.getItem(${JSON.stringify(THEME_MODE_KEY)});
    var accent = localStorage.getItem(${JSON.stringify(THEME_ACCENT_KEY)});
    if (mode === "light" || mode === "dark") document.documentElement.dataset.theme = mode;
    if (accent && accent !== "green") document.documentElement.dataset.accent = accent;
  } catch {}
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
