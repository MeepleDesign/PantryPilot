"use client";

import { useState } from "react";

const OTHER = "__other__";

export function SelectWithOther({
  name,
  value,
  onChange,
  options,
  placeholder = "Select…",
  className,
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}) {
  const [customMode, setCustomMode] = useState(value !== "" && !options.includes(value));

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
        placeholder="Type your own"
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
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
      <option value={OTHER}>Other…</option>
    </select>
  );
}
