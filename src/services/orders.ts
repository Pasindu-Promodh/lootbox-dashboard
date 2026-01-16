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

export async function fetchOrdersByFinanceBuckets() {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Categorize
  const buckets = {
    pendingOrders: [] as Order[], // A
    toReceive: [] as Order[],     // B
    submitted: [] as Order[],     // C
    completed: [] as Order[],     // D
  };

  orders?.forEach((o) => {
    if (o.status !== "delivered" && o.status !== "cancelled") buckets.pendingOrders.push(o);
    else if (o.status === "delivered" && o.payment_status === "pending") buckets.toReceive.push(o);
    else if (o.payment_status === "submitted") buckets.submitted.push(o);
    else if (o.payment_status === "received") buckets.completed.push(o);
  });

  return buckets;
}