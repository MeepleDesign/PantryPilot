"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PantryPhotoImport } from "@/components/pantry-photo-import";
import { PantryImportReview } from "@/components/pantry-import-review";
import type { ExtractedPantryScan } from "@/lib/actions/pantry-import";
import type { UnitSystem } from "@/lib/units";

export function PantryPhotoSection({ unitSystem }: { unitSystem: UnitSystem }) {
  const [scan, setScan] = useState<ExtractedPantryScan | null>(null);
  const router = useRouter();

  function handleDone() {
    setScan(null);
    router.refresh();
  }

  return (
    <>
      <PantryPhotoImport onScanned={setScan} />
      {scan && <PantryImportReview scan={scan} unitSystem={unitSystem} onDone={handleDone} />}
    </>
  );
}
