import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditRecipeClient } from "./edit-client";

export default async function EditRecipePage({ params }: PageProps<"/recipes/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .eq("id", id)
    .single();

  if (error || !recipe) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/recipes/${id}`} className="text-sm text-muted hover:text-foreground">
        ← Back
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-semibold tracking-tight">Edit recipe</h1>
      <EditRecipeClient recipeId={id} recipe={recipe} />
    </div>
  );
}
