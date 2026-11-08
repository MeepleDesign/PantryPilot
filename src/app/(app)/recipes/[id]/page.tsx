import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScaledIngredients } from "@/components/scaled-ingredients";
import { AddToPlanForm } from "@/components/add-to-plan-form";
import { DeleteRecipeButton } from "@/components/delete-recipe-button";

export default async function RecipeDetailPage({ params }: PageProps<"/recipes/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .eq("id", id)
    .single();

  if (error || !recipe) notFound();

  const ingredients = [...recipe.recipe_ingredients].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-1 flex items-center justify-between">
        <Link href="/recipes" className="text-sm text-muted hover:text-foreground">
          ← Recipes
        </Link>
        <div className="flex gap-3 text-sm">
          <Link href={`/recipes/${id}/edit`} className="font-medium text-brand">
            Edit
          </Link>
          <DeleteRecipeButton recipeId={id} />
        </div>
      </div>

      <h1 className="mb-1 mt-3 text-2xl font-semibold tracking-tight">{recipe.name}</h1>
      <p className="mb-4 text-sm text-muted">
        {[recipe.cuisine, recipe.diet, recipe.protein_tag].filter(Boolean).join(" · ")}
      </p>

      {recipe.description && <p className="mb-6 text-sm">{recipe.description}</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Time" value={recipe.total_time_minutes ? `${recipe.total_time_minutes} min` : "—"} />
        <Stat label="Servings" value={String(recipe.servings)} />
        <Stat label="Calories" value={recipe.calories ? `${recipe.calories} kcal` : "—"} />
        <Stat label="Protein" value={recipe.protein_g ? `${recipe.protein_g} g` : "—"} />
      </div>

      <div className="mb-6">
        <AddToPlanForm recipeId={id} />
      </div>

      <div className="mb-8">
        <ScaledIngredients ingredients={ingredients} baseServings={recipe.servings} />
      </div>

      {recipe.method && (
        <div className="mb-8">
          <h2 className="mb-3 font-medium">Method</h2>
          <div className="whitespace-pre-line rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed">
            {recipe.method}
          </div>
        </div>
      )}

      {recipe.equipment && (
        <div className="mb-8">
          <h2 className="mb-2 font-medium">Equipment / settings</h2>
          <p className="text-sm text-muted">{recipe.equipment}</p>
        </div>
      )}

      {(recipe.calories || recipe.protein_g) && (
        <div className="mb-4 rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-2 font-medium">Nutrition (estimated per serving)</h2>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
            <NutriStat label="Calories" value={recipe.calories} unit="kcal" />
            <NutriStat label="Protein" value={recipe.protein_g} unit="g" />
            <NutriStat label="Carbs" value={recipe.carbs_g} unit="g" />
            <NutriStat label="Fat" value={recipe.fat_g} unit="g" />
            <NutriStat label="Fibre" value={recipe.fibre_g} unit="g" />
          </div>
          <p className="mt-3 text-xs text-muted">
            {recipe.nutrition_note ?? "Estimates only — not laboratory-tested."}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function NutriStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium">{value != null ? `${value}${unit}` : "—"}</p>
    </div>
  );
}
