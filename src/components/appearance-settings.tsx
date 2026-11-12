"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  applyTheme,
  THEME_ACCENTS,
  THEME_ACCENT_KEY,
  THEME_MODE_KEY,
  THEME_MODES,
  type ThemeAccent,
  type ThemeMode,
} from "@/lib/theme";

function readStored<T extends string>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return (localStorage.getItem(key) as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}

export function AppearanceSettings() {
  const [mode, setMode] = useState<ThemeMode>(() => readStored(THEME_MODE_KEY, "system"));
  const [accent, setAccent] = useState<ThemeAccent>(() => readStored(THEME_ACCENT_KEY, "green"));

  function updateMode(next: ThemeMode) {
    setMode(next);
    applyTheme(next, accent);
    try {
      localStorage.setItem(THEME_MODE_KEY, next);
    } catch {
      // ignore
    }
  }

  function updateAccent(next: ThemeAccent) {
    setAccent(next);
    applyTheme(mode, next);
    try {
      localStorage.setItem(THEME_ACCENT_KEY, next);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">Mode</p>
        <div className="flex gap-2">
          {THEME_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => updateMode(m.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === m.value
                  ? "border-brand bg-brand/10 text-brand-dark"
                  : "border-border text-muted hover:bg-background"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Accent colour</p>
        <div className="flex gap-3">
          {THEME_ACCENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => updateAccent(a.value)}
              title={a.label}
              aria-label={a.label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border shadow-sm transition-transform hover:scale-105"
              style={{ backgroundColor: a.swatch }}
            >
              {accent === a.value && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
