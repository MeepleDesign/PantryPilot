"use client";

import { useState } from "react";

export function MultiSelectChips({
  values,
  onChange,
  options,
  placeholder = "Add…",
}: {
  values: string[];
  onChange: (values: string[]) => void;
  options: string[];
  placeholder?: string;
}) {
  const [customInput, setCustomInput] = useState("");

  function add(value: string) {
    const clean = value.trim();
    if (!clean || values.includes(clean)) return;
    onChange([...values, clean]);
  }

  function remove(value: string) {
    onChange(values.filter((v) => v !== value));
  }

  return (
    <div>
      {values.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {values.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand-dark"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                className="text-brand-dark/60 hover:text-danger"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="mb-2 flex flex-wrap gap-2">
        {options
          .filter((o) => !values.includes(o))
          .map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => add(o)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-brand hover:text-brand-dark"
            >
              + {o}
            </button>
          ))}
      </div>
      <input
        value={customInput}
        onChange={(e) => setCustomInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(customInput);
            setCustomInput("");
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </div>
  );
}
