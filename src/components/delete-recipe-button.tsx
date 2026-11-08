"use client";

import { useTransition } from "react";
import { deleteRecipe } from "@/lib/actions/recipes";

export function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this recipe? This cannot be undone.")) return;
        startTransition(() => deleteRecipe(recipeId));
      }}
      className="font-medium text-danger disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
