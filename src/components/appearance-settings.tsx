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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEME_ACCENTS.map((a) => {
            const selected = accent === a.value;
            return (
              <button
                key={a.value}
                type="button"
                onClick={() => updateAccent(a.value)}
                aria-label={a.label}
                aria-pressed={selected}
                data-accent-preview={a.value}
                className={`group overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  selected ? "border-brand ring-2 ring-brand/25" : "border-border"
                }`}
              >
                {/* mini dashboard header */}
                <div className="bg-gradient-to-br from-brand/15 via-surface to-accent/15 p-2.5">
                  <div className="mb-1.5 h-1.5 w-10 rounded-full bg-brand-dark/70" />
                  <div className="mb-2 h-2.5 w-16 rounded-full bg-foreground/70" />
                  <div className="flex items-end gap-1">
                    <span className="h-3 w-6 rounded bg-brand" />
                    <span className="h-3 w-3 rounded bg-accent" />
                    <span className="ml-auto h-4 w-4 rounded-full bg-brand/20" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border bg-surface px-2.5 py-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <span className="h-3 w-3 rounded-full bg-brand" aria-hidden />
                    {a.label}
                  </span>
                  {selected && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-brand-foreground">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
