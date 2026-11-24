"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, X, Smile } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { useToast } from "@/components/toast";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarPhoto, updateAvatarEmoji } from "@/lib/actions/settings";
import { AVATAR_EMOJIS } from "@/lib/avatar-emojis";

const MAX_SIZE_MB = 5;

export function AvatarUpload({
  userId,
  avatarUrl,
  avatarEmoji,
  initials,
}: {
  userId: string;
  avatarUrl: string | null;
  avatarEmoji: string | null;
  initials: string;
}) {
  const [url, setUrl] = useState(avatarUrl);
  const [emoji, setEmoji] = useState(avatarEmoji);
  const [pending, setPending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const showToast = useToast();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      showToast(`Image is too large — please pick one under ${MAX_SIZE_MB}MB.`);
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
      await updateAvatarPhoto(publicUrlData.publicUrl);
      setUrl(publicUrlData.publicUrl);
      setEmoji(null);
      showToast("Profile picture updated");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't upload that photo.");
    } finally {
      setPending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePickEmoji(choice: string) {
    setPending(true);
    try {
      await updateAvatarEmoji(choice);
      setEmoji(choice);
      setUrl(null);
      setPickerOpen(false);
      showToast("Profile icon updated");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't set that icon.");
    } finally {
      setPending(false);
    }
  }

  async function handleRemove() {
    setPending(true);
    try {
      await updateAvatarPhoto(null);
      setUrl(null);
      setEmoji(null);
      showToast("Profile picture removed");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't remove that photo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-lg font-semibold text-brand-foreground shadow-sm ring-4 ring-brand/15">
        {url ? (
          <Image src={url} alt="" fill className="object-cover" unoptimized />
        ) : emoji ? (
          <span className="text-2xl">{emoji}</span>
        ) : (
          initials
        )}
        {pending && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Spinner className="h-5 w-5" />
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload a profile photo"
        title="Upload a photo"
        className="absolute -bottom-1 -right-6 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm hover:text-foreground disabled:cursor-wait"
      >
        <Camera className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setPickerOpen((o) => !o)}
        aria-label="Choose a food icon"
        title="Choose an icon"
        className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm hover:text-foreground disabled:cursor-wait"
      >
        <Smile className="h-3.5 w-3.5" />
      </button>
      {(url || emoji) && (
        <button
          type="button"
          disabled={pending}
          onClick={handleRemove}
          aria-label="Remove profile picture"
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm hover:text-danger disabled:cursor-wait"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {pickerOpen && (
        <div className="absolute left-0 top-16 z-30 w-64 rounded-xl border border-border bg-surface p-3 shadow-lg">
          <p className="mb-2 text-xs font-medium text-muted">Pick an icon</p>
          <div className="grid grid-cols-8 gap-1">
            {AVATAR_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                disabled={pending}
                onClick={() => handlePickEmoji(e)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-lg hover:bg-background disabled:cursor-wait"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
