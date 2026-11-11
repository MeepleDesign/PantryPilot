"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { revalidatePath } from "next/cache";

export type SaveReceiptItemInput = {
  ingredient_name: string;
  price: number;
  quantity: number | null;
};

export type SaveReceiptScanInput = {
  store_name: string | null;
  purchased_at: string | null;
  total: number | null;
  items: SaveReceiptItemInput[];
};

export async function saveReceiptScan(input: SaveReceiptScanInput) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  if (!input.items.length) throw new Error("No items to save.");

  const { data: scan, error: scanError } = await supabase
    .from("receipt_scans")
    .insert({
      household_id: household.id,
      store_name: input.store_name,
      purchased_at: input.purchased_at ?? new Date().toISOString().slice(0, 10),
      total: input.total,
      created_by: auth.user?.id,
    })
    .select()
    .single();
  if (scanError || !scan) throw new Error(scanError?.message ?? "Couldn't save that receipt.");

  const rows = input.items.map((item, i) => ({
    receipt_scan_id: scan.id,
    ingredient_name: item.ingredient_name,
    price: item.price,
    quantity: item.quantity,
    sort_order: i,
  }));
  const { error: itemsError } = await supabase.from("receipt_items").insert(rows);
  if (itemsError) throw new Error(itemsError.message);

  revalidatePath("/shopping-list/spending");
  revalidatePath("/dashboard");
}
