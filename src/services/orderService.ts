// import { supabase } from "../lib/supabase";
// import type { Order, OrderStatus } from "../types/order";

// export async function fetchOrdersByStatus(status: OrderStatus) {
//   const { data, error } = await supabase
//     .from("orders")
//     .select("*")
//     .eq("status", status)
//     .order("created_at", { ascending: false });

//   if (error) throw error;
//   return data as Order[];
// }
