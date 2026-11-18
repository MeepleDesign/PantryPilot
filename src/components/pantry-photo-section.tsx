"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Receipt, Sparkles } from "lucide-react";
import { PantryPhotoImport } from "@/components/pantry-photo-import";
import { PantryImportReview } from "@/components/pantry-import-review";
import type { ExtractedPantryScan } from "@/lib/actions/pantry-import";
import type { UnitSystem } from "@/lib/units";

const TILE =
  "flex min-w-0 items-center gap-3 rounded-xl border border-dashed border-brand/40 bg-brand/5 p-3 text-left transition-colors hover:bg-brand/10";
const ICON =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-surface text-brand shadow-sm";

export function PantryPhotoSection({ unitSystem }: { unitSystem: UnitSystem }) {
  const [scan, setScan] = useState<ExtractedPantryScan | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const router = useRouter();

  function handleDone() {
    setScan(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setPhotoOpen((o) => !o)}
          aria-expanded={photoOpen}
          className={`${TILE} order-1`}
        >
          <span className={ICON}>
            <Sparkles className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Scan a shelf or fridge</span>
            <span className="block truncate text-xs text-muted">
              Photograph what you have and review before adding
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-transform ${photoOpen ? "rotate-180" : ""}`}
          />
        </button>
        <Link href="/shopping-list/spending" className={`${TILE} order-3 sm:order-2`}>
          <span className={ICON}>
            <Receipt className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Just did a shop?</span>
            <span className="block truncate text-xs text-muted">
              Scan the receipt to add it to your pantry
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
        </Link>
        {(photoOpen || scan) && (
          <div className="animate-fade-in-up order-2 sm:order-3 sm:col-span-2 [&>div]:mb-0">
            <PantryPhotoImport onScanned={setScan} />
          </div>
        )}
      </div>
      {scan && <PantryImportReview scan={scan} unitSystem={unitSystem} onDone={handleDone} />}
    </>
  );
}
