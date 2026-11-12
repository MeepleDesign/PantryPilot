"use client";

import { useState } from "react";
import { Camera, Images } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { useToast } from "@/components/toast";
import { createClient } from "@/lib/supabase/client";
import { updateRecipePhoto } from "@/lib/actions/recipes";

export function RecipePhotoPrompt({
  recipeId,
  isStockPhoto,
}: {
  recipeId: string;
  isStockPhoto: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showToast = useToast();

  if (!isStockPhoto || dismissed || done) return null;

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(path, file, { upsert: true });
      if (uploadError) throw new Error(uploadError.message);
      const { data: publicUrlData } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(path);

      await updateRecipePhoto(recipeId, publicUrlData.publicUrl);
      showToast("Photo added — thanks!");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't upload that photo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-brand/40 bg-brand/5 px-3 py-2">
      <span className="text-xs text-muted">Got a photo of what you made? Add it:</span>
      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium shadow-sm transition-colors hover:bg-background">
        <Camera className="h-3.5 w-3.5" />
        Take photo
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={pending}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </label>
      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium shadow-sm transition-colors hover:bg-background">
        <Images className="h-3.5 w-3.5" />
        Choose photo
        <input
          type="file"
          accept="image/*"
          disabled={pending}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </label>
      {pending && <Spinner className="h-3.5 w-3.5" />}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-xs text-muted hover:text-foreground"
      >
        No thanks
      </button>
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </div>
  );
}
