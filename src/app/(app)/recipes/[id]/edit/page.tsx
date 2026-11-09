import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { getLearnedRecipeOptions } from "@/lib/actions/recipe-options";
import { EditRecipeClient } from "./edit-client";
import type { UnitSystem } from "@/lib/units";

export default async function EditRecipePage({ params }: PageProps<"/recipes/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .eq("id", id)
    .single();

  if (error || !recipe) notFound();

  const { household, profile } = await getCurrentHousehold();
  const unitSystem: UnitSystem = profile.units === "imperial" ? "imperial" : "metric";
  const { cuisineOptions, dietOptions } = await getLearnedRecipeOptions(household.id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/recipes/${id}`} className="text-sm text-muted hover:text-foreground">
        ← Back
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-semibold tracking-tight">Edit recipe</h1>
      <EditRecipeClient
        recipeId={id}
        recipe={recipe}
        unitSystem={unitSystem}
        cuisineOptions={cuisineOptions}
        dietOptions={dietOptions}
      />
    </div>
  );
}
