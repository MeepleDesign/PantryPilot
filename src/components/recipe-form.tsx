"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/spinner";
import type { RecipeFormInput, RecipeIngredientInput } from "@/lib/actions/recipes";
import type { RecipeCourse, RecipeWithIngredients } from "@/lib/types";

type Props = {
  initial?: RecipeWithIngredients;
  onSubmit: (input: RecipeFormInput) => Promise<void>;
  submitLabel: string;
};

const SUGGESTED_TAGS = ["Freezer-friendly", "OmniCook", "Manual cook"];

function parseMethodToSteps(method: string | null | undefined): string[] {
  if (!method?.trim()) return [""];
  const lines = method.split("\n").map((l) => l.trim()).filter(Boolean);
  const steps = lines.map((l) => l.replace(/^\d+\.\s*/, ""));
  return steps.length ? steps : [""];
}

function serialiseStepsToMethod(steps: string[]): string {
  return steps
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s, i) => `${i + 1}. ${s}`)
    .join("\n");
}

export function RecipeForm({ initial, onSubmit, submitLabel }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initial?.image_url ?? null,
  );

  const [steps, setSteps] = useState<string[]>(parseMethodToSteps(initial?.method));

  function updateStep(i: number, value: string) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? value : s)));
  }

  function handleStepKeyDown(i: number, e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setSteps((prev) => {
        const next = [...prev];
        next.splice(i + 1, 0, "");
        return next;
      });
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLTextAreaElement>(
          `textarea[data-step-index="${i + 1}"]`,
        );
        el?.focus();
      });
    }
  }

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

  function addTag(tag: string) {
    const clean = tag.trim();
    if (!clean || tags.includes(clean)) return;
    setTags((prev) => [...prev, clean]);
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleFileChange(file: File | null) {
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(imageUrl);
    }
  }

  function removeImage() {
    setImageFile(null);
    setImageUrl(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        const supabase = createClient();
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("recipe-images")
          .upload(path, imageFile, { upsert: true });
        if (uploadError) throw new Error(uploadError.message);
        const { data: publicUrlData } = supabase.storage
          .from("recipe-images")
          .getPublicUrl(path);
        finalImageUrl = publicUrlData.publicUrl;
      }

      const input: RecipeFormInput = {
        name: String(formData.get("name")),
        description: (formData.get("description") as string) || null,
        cuisine: (formData.get("cuisine") as string) || null,
        diet: (formData.get("diet") as string) || "Vegetarian",
        protein_tag: (formData.get("protein_tag") as string) || null,
        main_protein_source: (formData.get("main_protein_source") as string) || null,
        total_time_minutes: numOrNull(formData.get("total_time_minutes")),
        servings: Number(formData.get("servings")) || 6,
        course: (formData.get("course") as RecipeCourse) || "main",
        equipment: (formData.get("equipment") as string) || null,
        method: serialiseStepsToMethod(steps) || null,
        prep_note: (formData.get("prep_note") as string) || null,
        calories: numOrNull(formData.get("calories")),
        protein_g: numOrNull(formData.get("protein_g")),
        carbs_g: numOrNull(formData.get("carbs_g")),
        fat_g: numOrNull(formData.get("fat_g")),
        fibre_g: numOrNull(formData.get("fibre_g")),
        tags,
        image_url: finalImageUrl,
        ingredients: ingredients.filter((i) => i.ingredient_name.trim() !== ""),
      };

      await onSubmit(input);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <Section title="Photo">
        <div className="flex items-center gap-4">
          {imagePreview ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
              <Image
                src={imagePreview}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-border text-2xl text-muted">
              🍲
            </div>
          )}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            {imagePreview && (
              <button
                type="button"
                onClick={removeImage}
                className="block text-sm text-danger"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
      </Section>

      <Section title="Tags">
        <div className="mb-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand-dark"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-brand-dark/60 hover:text-danger"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="mb-2 flex flex-wrap gap-2">
          {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-brand hover:text-brand-dark"
            >
              + {tag}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(tagInput);
                setTagInput("");
              }
            }}
            placeholder="Add a custom tag and press Enter"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
      </Section>

      <Section title="Prep ahead">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Anything to prep in advance?
          </span>
          <textarea
            name="prep_note"
            defaultValue={initial?.prep_note ?? ""}
            rows={2}
            placeholder="e.g. Soak lentils overnight (at least 8 hours) before cooking"
            className="w-full rounded-lg border border-warn/40 bg-warn/5 px-3 py-2 text-sm outline-none focus:border-warn"
          />
          <span className="mt-1 block text-xs text-muted">
            Shown at the top of the recipe so you don&apos;t miss it on the day.
          </span>
        </label>
      </Section>

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
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Course</span>
            <select
              name="course"
              defaultValue={initial?.course ?? "main"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="main">Main</option>
              <option value="side">Side</option>
              <option value="snack">Snack</option>
              <option value="dessert">Dessert</option>
            </select>
          </label>
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
        <span className="mb-1.5 block text-sm font-medium">Steps</span>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-sm font-medium text-muted">
                Step {i + 1}
              </span>
              <textarea
                data-step-index={i}
                value={step}
                onChange={(e) => updateStep(i, e.target.value)}
                onKeyDown={(e) => handleStepKeyDown(i, e)}
                rows={2}
                placeholder="Describe this step… press Enter for the next step"
                className="flex-1 resize-none rounded-lg border-2 border-foreground/70 bg-background px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={() =>
                  setSteps((prev) =>
                    prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev,
                  )
                }
                className="shrink-0 text-sm text-danger"
                aria-label={`Remove step ${i + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSteps((prev) => [...prev, ""])}
          className="mt-2 text-sm font-medium text-brand"
        >
          + Add step
        </button>
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
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-6"
      >
        {pending && <Spinner className="h-4 w-4" />}
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
