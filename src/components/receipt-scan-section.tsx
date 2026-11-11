"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptScanImport } from "@/components/receipt-scan-import";
import { ReceiptScanReview } from "@/components/receipt-scan-review";
import type { ExtractedReceiptScan } from "@/lib/actions/receipt-import";

export function ReceiptScanSection() {
  const [scan, setScan] = useState<ExtractedReceiptScan | null>(null);
  const router = useRouter();

  function handleDone() {
    setScan(null);
    router.refresh();
  }

  return (
    <>
      <ReceiptScanImport onScanned={setScan} />
      {scan && <ReceiptScanReview scan={scan} onDone={handleDone} />}
    </>
  );
}
