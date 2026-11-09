"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, Sparkles, X } from "lucide-react";
import { Spinner } from "@/components/spinner";
import type { ExtractedRecipe } from "@/lib/actions/recipe-import";

const MAX_DIMENSION = 1568;
const MAX_PHOTOS = 4;

type StagedPhoto = { id: string; base64: string; mediaType: "image/jpeg"; previewUrl: string };

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
  const [photos, setPhotos] = useState<StagedPhoto[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const files = Array.from(fileList).slice(0, MAX_PHOTOS - photos.length);
    try {
      const staged = await Promise.all(
        files.map(async (file) => {
          const { base64, mediaType } = await fileToResizedBase64(file);
          return {
            id: crypto.randomUUID(),
            base64,
            mediaType,
            previewUrl: `data:${mediaType};base64,${base64}`,
          };
        }),
      );
      setPhotos((prev) => [...prev, ...staged].slice(0, MAX_PHOTOS));
    } catch {
      setError("Couldn't process one of those photos.");
    }
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleImport() {
    if (photos.length === 0) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: photos.map((p) => ({ base64: p.base64, mediaType: p.mediaType })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong reading those photos.");
      onImported(data as ExtractedRecipe, photos[0].previewUrl);
      setPhotos([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong reading those photos.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-dashed border-brand/40 bg-brand/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand" />
        <div>
          <p className="text-sm font-medium">Import from a photo</p>
          <p className="text-xs text-muted">
            Take a picture of a recipe — add more than one if ingredients and method are on
            different sides — and we&apos;ll pre-fill the form below for you to review.
          </p>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
              <Image src={p.previewUrl} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
                className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-background/80 text-foreground"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {photos.length < MAX_PHOTOS && (
          <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-background">
            <Camera className="h-4 w-4" />
            {photos.length === 0 ? "Choose photo(s)" : "Add another"}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={pending}
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </label>
        )}
        {photos.length > 0 && (
          <button
            type="button"
            onClick={handleImport}
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
          >
            {pending && <Spinner className="h-4 w-4" />}
            {pending ? "Reading…" : `Import ${photos.length} photo${photos.length > 1 ? "s" : ""}`}
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
