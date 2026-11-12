"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptScanImport } from "@/components/receipt-scan-import";
import { ReceiptScanReview } from "@/components/receipt-scan-review";
import type { ExtractedReceiptScan } from "@/lib/actions/receipt-import";
import type { UnitSystem } from "@/lib/units";

export function ReceiptScanSection({ unitSystem }: { unitSystem: UnitSystem }) {
  const [scan, setScan] = useState<ExtractedReceiptScan | null>(null);
  const router = useRouter();

  function handleDone() {
    setScan(null);
    router.refresh();
  }

  return (
    <>
      <ReceiptScanImport onScanned={setScan} />
      {scan && <ReceiptScanReview scan={scan} unitSystem={unitSystem} onDone={handleDone} />}
    </>
  );
}
