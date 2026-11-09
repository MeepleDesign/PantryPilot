"use client";

import { useRef, useState } from "react";
import { Camera, Sparkles } from "lucide-react";
import { Spinner } from "@/components/spinner";
import type { ExtractedRecipe } from "@/lib/actions/recipe-import";

const MAX_DIMENSION = 1568;

async function fileToResizedBase64(
  file: File,
): Promise<{ base64: string; mediaType: "image/jpeg" }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process that image.");
  ctx.drawImage(img, 0, 0, width, height);

  const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { base64: resizedDataUrl.split(",")[1], mediaType: "image/jpeg" };
}

export function RecipePhotoImport({
  onImported,
}: {
  onImported: (data: ExtractedRecipe, previewUrl: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    setPending(true);
    try {
      const { base64, mediaType } = await fileToResizedBase64(file);
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mediaType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong reading that photo.");
      onImported(data as ExtractedRecipe, `data:${mediaType};base64,${base64}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong reading that photo.");
    } finally {
      setPending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-dashed border-brand/40 bg-brand/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand" />
          <div>
            <p className="text-sm font-medium">Import from a photo</p>
            <p className="text-xs text-muted">
              Take a picture of a recipe and we&apos;ll pre-fill the form below for you to review.
            </p>
          </div>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark">
          {pending ? <Spinner className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          {pending ? "Reading photo…" : "Choose photo"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            disabled={pending}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
