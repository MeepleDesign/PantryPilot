"use client";

import { useState, useTransition } from "react";
import type { RecipeFormInput, RecipeIngredientInput } from "@/lib/actions/recipes";
import type { RecipeWithIngredients } from "@/lib/types";

type Props = {
  initial?: RecipeWithIngredients;
  onSubmit: (input: RecipeFormInput) => Promise<void>;
  submitLabel: string;
};

export function RecipeForm({ initial, onSubmit, submitLabel }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredientInput[]>(
    initial?.recipe_ingredients?.length
      ? initial.recipe_ingredients
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((i) => ({
            ingredient_name: i.ingredient_name,
            quantity: i.quantity,
            unit: i.unit,
            category: i.category,
            notes: i.notes,
          }))
      : [{ ingredient_name: "", quantity: null, unit: "", category: "", notes: "" }],
  );

  function updateIngredient(i: number, patch: Partial<RecipeIngredientInput>) {
    setIngredients((prev) =>
      prev.map((ing, idx) => (idx === i ? { ...ing, ...patch } : ing)),
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    const input: RecipeFormInput = {
      name: String(formData.get("name")),
      description: (formData.get("description") as string) || null,
      cuisine: (formData.get("cuisine") as string) || null,
      diet: (formData.get("diet") as string) || "Vegetarian",
      protein_tag: (formData.get("protein_tag") as string) || null,
      main_protein_source: (formData.get("main_protein_source") as string) || null,
      total_time_minutes: numOrNull(formData.get("total_time_minutes")),
      servings: Number(formData.get("servings")) || 6,
      equipment: (formData.get("equipment") as string) || null,
      method: (formData.get("method") as string) || null,
      calories: numOrNull(formData.get("calories")),
      protein_g: numOrNull(formData.get("protein_g")),
      carbs_g: numOrNull(formData.get("carbs_g")),
      fat_g: numOrNull(formData.get("fat_g")),
      fibre_g: numOrNull(formData.get("fibre_g")),
      ingredients: ingredients.filter((i) => i.ingredient_name.trim() !== ""),
    };
    startTransition(async () => {
      try {
        await onSubmit(input);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <Section title="Basics">
        <Field label="Recipe name" name="name" defaultValue={initial?.name} required />
        <Field
          label="Description"
          name="description"
          defaultValue={initial?.description ?? ""}
          textarea
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Cuisine" name="cuisine" defaultValue={initial?.cuisine ?? ""} />
          <Field label="Diet" name="diet" defaultValue={initial?.diet ?? "Vegetarian"} />
          <Field
            label="Protein tag"
            name="protein_tag"
            defaultValue={initial?.protein_tag ?? ""}
            placeholder="e.g. High protein"
          />
          <Field
            label="Main protein source"
            name="main_protein_source"
            defaultValue={initial?.main_protein_source ?? ""}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field
            label="Total time (min)"
            name="total_time_minutes"
            type="number"
            defaultValue={initial?.total_time_minutes ?? ""}
          />
          <Field
            label="Servings"
            name="servings"
            type="number"
            defaultValue={initial?.servings ?? 6}
            required
          />
        </div>
        <Field
          label="Equipment / appliance settings"
          name="equipment"
          defaultValue={initial?.equipment ?? ""}
          textarea
          placeholder="e.g. TOKIT Omni Cook: 10 min, 100°C, Speed 2, Reverse"
        />
      </Section>

      <Section title="Ingredients">
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                placeholder="Ingredient"
                value={ing.ingredient_name}
                onChange={(e) => updateIngredient(i, { ingredient_name: e.target.value })}
                className="min-w-[160px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <input
                placeholder="Qty"
                type="number"
                step="any"
                value={ing.quantity ?? ""}
                onChange={(e) =>
                  updateIngredient(i, {
                    quantity: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <input
                placeholder="Unit"
                value={ing.unit ?? ""}
                onChange={(e) => updateIngredient(i, { unit: e.target.value })}
                className="w-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={() =>
                  setIngredients((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="text-sm text-danger"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setIngredients((prev) => [
              ...prev,
              { ingredient_name: "", quantity: null, unit: "", category: "", notes: "" },
            ])
          }
          className="text-sm font-medium text-brand"
        >
          + Add ingredient
        </button>
      </Section>

      <Section title="Method">
        <Field
          label="Step-by-step method"
          name="method"
          defaultValue={initial?.method ?? ""}
          textarea
          rows={8}
        />
      </Section>

      <Section title="Nutrition (estimated, per serving)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Field label="Calories" name="calories" type="number" defaultValue={initial?.calories ?? ""} />
          <Field label="Protein (g)" name="protein_g" type="number" defaultValue={initial?.protein_g ?? ""} />
          <Field label="Carbs (g)" name="carbs_g" type="number" defaultValue={initial?.carbs_g ?? ""} />
          <Field label="Fat (g)" name="fat_g" type="number" defaultValue={initial?.fat_g ?? ""} />
          <Field label="Fibre (g)" name="fibre_g" type="number" defaultValue={initial?.fibre_g ?? ""} />
        </div>
      </Section>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:opacity-60 sm:w-auto sm:px-6"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-4 font-medium">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  textarea,
  rows,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={rows ?? 3}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
        />
      )}
    </label>
  );
}

function numOrNull(v: FormDataEntryValue | null) {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}
