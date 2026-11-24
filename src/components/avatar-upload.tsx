"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { useToast } from "@/components/toast";
import { createClient } from "@/lib/supabase/client";
import { updateAvatar } from "@/lib/actions/settings";

const MAX_SIZE_MB = 5;

export function AvatarUpload({
  userId,
  avatarUrl,
  initials,
}: {
  userId: string;
  avatarUrl: string | null;
  initials: string;
}) {
  const [url, setUrl] = useState(avatarUrl);
  const [pending, setPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showToast = useToast();

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
      await updateAvatar(publicUrlData.publicUrl);
      setUrl(publicUrlData.publicUrl);
      showToast("Profile picture updated");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't upload that photo.");
    } finally {
      setPending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setPending(true);
    try {
      await updateAvatar(null);
      setUrl(null);
      showToast("Profile picture removed");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't remove that photo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-lg font-semibold text-brand-foreground shadow-sm ring-4 ring-brand/15">
        {url ? (
          <Image src={url} alt="" fill className="object-cover" unoptimized />
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
        aria-label="Change profile picture"
        className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm hover:text-foreground disabled:cursor-wait"
      >
        <Camera className="h-3.5 w-3.5" />
      </button>
      {url && (
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
    </div>
  );
}
