"use client";

import { useState } from "react";
import { allKnownUnits, unitGroups, type UnitSystem } from "@/lib/units";

const OTHER = "__other__";

export function UnitSelect({
  name,
  value,
  onChange,
  unitSystem,
  className,
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  unitSystem: UnitSystem;
  className?: string;
}) {
  const known = allKnownUnits(unitSystem);
  const [customMode, setCustomMode] = useState(value !== "" && !known.includes(value));

  const selectValue = customMode ? OTHER : value || "";

  if (customMode) {
    return (
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          if (value === "") setCustomMode(false);
        }}
        placeholder="Custom unit"
        className={className}
      />
    );
  }

  return (
    <select
      name={name}
      value={selectValue}
      onChange={(e) => {
        if (e.target.value === OTHER) {
          setCustomMode(true);
          onChange("");
        } else {
          onChange(e.target.value);
        }
      }}
      className={className}
    >
      <option value="">Unit</option>
      {unitGroups(unitSystem).map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </optgroup>
      ))}
      <option value={OTHER}>Other…</option>
    </select>
  );
}
