import { supabase } from "../lib/supabase";
import type { Order } from "../types/order";

export async function fetchAllOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch orders failed:", error);
    throw error;
  }

  return data as Order[];
}
