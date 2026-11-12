"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, Images, Receipt, FileText, X } from "lucide-react";
import { Spinner } from "@/components/spinner";
import type { ExtractedReceiptScan } from "@/lib/actions/receipt-import";

const MAX_DIMENSION = 1568;
const MAX_PHOTOS = 4;

type StagedFile = {
  id: string;
  base64: string;
  mediaType: "image/jpeg" | "application/pdf";
  name: string;
  previewUrl: string | null;
};

async function fileToResizedImageBase64(
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

async function fileToPdfBase64(file: File): Promise<{ base64: string; mediaType: "application/pdf" }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return { base64: dataUrl.split(",")[1], mediaType: "application/pdf" };
}

export function ReceiptScanImport({
  onScanned,
}: {
  onScanned: (scan: ExtractedReceiptScan) => void;
}) {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const picked = Array.from(fileList).slice(0, MAX_PHOTOS - files.length);
    try {
      const staged = await Promise.all(
        picked.map(async (file) => {
          if (file.type === "application/pdf") {
            const { base64, mediaType } = await fileToPdfBase64(file);
            return { id: crypto.randomUUID(), base64, mediaType, name: file.name, previewUrl: null };
          }
          const { base64, mediaType } = await fileToResizedImageBase64(file);
          return {
            id: crypto.randomUUID(),
            base64,
            mediaType,
            name: file.name,
            previewUrl: `data:${mediaType};base64,${base64}`,
          };
        }),
      );
      setFiles((prev) => [...prev, ...staged].slice(0, MAX_PHOTOS));
    } catch {
      setError("Couldn't process one of those files.");
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleScan() {
    if (files.length === 0) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/shopping-list/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: files.map((f) => ({ base64: f.base64, mediaType: f.mediaType })),
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong reading that receipt.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let scan: ExtractedReceiptScan | null = null;
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (!line.trim()) continue;
          const msg = JSON.parse(line);
          if (msg.type === "result") scan = msg.scan;
          else if (msg.type === "error") streamError = msg.error;
        }
      }

      if (streamError) throw new Error(streamError);
      if (!scan) throw new Error("Something went wrong reading that receipt.");
      onScanned(scan);
      setFiles([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong reading that receipt.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-dashed border-brand/40 bg-brand/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Receipt className="h-5 w-5 text-brand" />
        <div>
          <p className="text-sm font-medium">Scan a receipt</p>
          <p className="text-xs text-muted">
            Photograph a till receipt, or add a photo or PDF of an online order confirmation,
            and we&apos;ll list what was bought and for how much, for you to review before
            saving.
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface"
            >
              {f.previewUrl ? (
                <Image src={f.previewUrl} alt="" fill className="object-cover" unoptimized />
              ) : (
                <div className="flex flex-col items-center gap-1 px-1 text-center">
                  <FileText className="h-5 w-5 text-muted" />
                  <span className="w-full truncate text-[9px] text-muted">{f.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-background/80 text-foreground"
                aria-label="Remove file"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {files.length < MAX_PHOTOS && (
          <>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-background">
              <Camera className="h-4 w-4" />
              Take photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                disabled={pending}
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
            </label>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-background">
              <Images className="h-4 w-4" />
              {files.length === 0 ? "Choose file(s)" : "Add another"}
              <input
                type="file"
                accept="image/*,.pdf,application/pdf"
                multiple
                disabled={pending}
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
            </label>
          </>
        )}
        {files.length > 0 && (
          <button
            type="button"
            onClick={handleScan}
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
          >
            {pending && <Spinner className="h-4 w-4" />}
            {pending ? "Reading…" : `Scan ${files.length} file${files.length > 1 ? "s" : ""}`}
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
