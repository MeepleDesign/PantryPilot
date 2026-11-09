import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock, UtensilsCrossed, Flame, Dumbbell, AlarmClock } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScaledIngredients } from "@/components/scaled-ingredients";
import { AddToPlanForm } from "@/components/add-to-plan-form";
import { DeleteRecipeButton } from "@/components/delete-recipe-button";
import { StaticStars, InteractiveStars } from "@/components/star-rating";
import { getCurrentHousehold } from "@/lib/current-household";

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

  const { household } = await getCurrentHousehold();
  const { data: auth } = await supabase.auth.getUser();
  const { data: ratings } = await supabase
    .from("recipe_ratings")
    .select("user_id, rating")
    .eq("recipe_id", id)
    .eq("household_id", household.id);

  const ratingCount = ratings?.length ?? 0;
  const avgRating = ratingCount
    ? ratings!.reduce((sum, r) => sum + r.rating, 0) / ratingCount
    : 0;
  const myRating = ratings?.find((r) => r.user_id === auth.user?.id)?.rating ?? 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-1 flex items-center justify-between">
        <Link
          href="/recipes"
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Recipes
        </Link>
        <div className="flex gap-3 text-sm">
          <Link href={`/recipes/${id}/edit`} className="font-medium text-brand hover:text-brand-dark">
            Edit
          </Link>
          <DeleteRecipeButton recipeId={id} />
        </div>
      </div>

      {recipe.image_url && (
        <div className="relative mt-3 h-56 w-full overflow-hidden rounded-xl border border-border sm:h-72">
          <Image
            src={recipe.image_url}
            alt={recipe.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <h1 className="mb-1 mt-3 text-2xl font-semibold tracking-tight">{recipe.name}</h1>
      <p className="mb-2 text-sm text-muted">
        {[recipe.cuisine, ...(recipe.diet ?? []), recipe.protein_tag].filter(Boolean).join(" · ")}
      </p>

      <div className="mb-3">
        {ratingCount > 0 ? (
          <StaticStars value={avgRating} count={ratingCount} size="md" />
        ) : (
          <span className="text-xs text-muted">No ratings yet</span>
        )}
      </div>

      {recipe.tags?.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {recipe.tags.map((tag: string) => (
            <span
              key={tag}
              className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand-dark"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {recipe.prep_note && (
        <div className="mb-4 flex gap-2 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm">
          <AlarmClock className="h-4 w-4 shrink-0 text-warn" />
          <div>
            <p className="font-medium text-warn">Prep ahead</p>
            <p className="text-foreground">{recipe.prep_note}</p>
          </div>
        </div>
      )}

      {recipe.description && <p className="mb-6 text-sm">{recipe.description}</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          icon={Clock}
          label="Time"
          value={recipe.total_time_minutes ? `${recipe.total_time_minutes} min` : "—"}
        />
        <Stat icon={UtensilsCrossed} label="Servings" value="2" />
        <Stat
          icon={Flame}
          label="Calories"
          value={recipe.calories ? `${recipe.calories} kcal` : "—"}
        />
        <Stat
          icon={Dumbbell}
          label="Protein"
          value={recipe.protein_g ? `${recipe.protein_g} g` : "—"}
        />
      </div>

      <div className="mb-6 rounded-xl border border-border bg-surface p-3 shadow-sm">
        <InteractiveStars recipeId={id} initialRating={myRating} />
      </div>

      <div className="mb-6">
        <AddToPlanForm recipeId={id} baseServings={recipe.servings} tags={recipe.tags} />
      </div>

      <div className="mb-8">
        <ScaledIngredients
          ingredients={ingredients}
          baseServings={recipe.servings}
          tags={recipe.tags}
        />
      </div>

      {recipe.method && (
        <div className="mb-8">
          <h2 className="mb-3 font-medium">Method</h2>
          <ol className="space-y-3 rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed shadow-sm">
            {recipe.method
              .split("\n")
              .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
              .filter(Boolean)
              .map((step: string, i: number) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand-dark">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
          </ol>
        </div>
      )}

      {recipe.equipment && (
        <div className="mb-8 rounded-xl border border-border bg-surface p-4 shadow-sm">
          <h2 className="mb-2 font-medium">Equipment / settings</h2>
          <p className="text-sm text-muted">{recipe.equipment}</p>
        </div>
      )}

      {(recipe.calories || recipe.protein_g) && (
        <div className="mb-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
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

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 text-center shadow-sm">
      <Icon className="mx-auto mb-1 h-4 w-4 text-brand" strokeWidth={1.75} />
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
