import { supabase } from "../lib/supabase";
import { fetchAllOrders } from "./orders";
import type { Customer } from "../types/customer";
import type { Order } from "../types/order";

interface AuthUserRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

/**
 * Calls the "list-customers" edge function to get signed-up (Google OAuth)
 * auth users. Requires the service_role key server-side, so this can't be
 * done with a direct supabase-js call from the browser.
 */
async function fetchAuthUsers(): Promise<AuthUserRow[]> {
  const { data, error } = await supabase.functions.invoke("list-customers");

  if (error) {
    console.error("Fetch auth users failed:", error);
    throw error;
  }

  return (data?.users ?? []) as AuthUserRow[];
}

/**
 * Builds the Customers list by joining every signed-up auth user with their
 * orders (matched by orders.user_id). Users with zero orders still show up
 * (with orders_count: 0). Legacy orders placed before user_id existed (or by
 * a user who has since been deleted from auth) fall back to a phone/name
 * grouping key and are flagged is_guest.
 */
export async function fetchCustomers(): Promise<Customer[]> {
  const [authUsers, orders] = await Promise.all([
    fetchAuthUsers(),
    fetchAllOrders(),
  ]);

  return mergeCustomers(authUsers, orders);
}

function mergeCustomers(authUsers: AuthUserRow[], orders: Order[]): Customer[] {
  const map = new Map<string, Customer>();

  // Seed with every signed-up user first, so accounts with no orders yet
  // still appear in the list.
  authUsers.forEach((u) => {
    map.set(u.user_id, {
      key: u.user_id,
      user_id: u.user_id,
      email: u.email,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      is_guest: false,
      customer_name: u.full_name ?? u.email ?? "—",
      phone1: "",
      phone2: "",
      address: "",
      district: "",
      orders_count: 0,
      total_spent: 0,
      total_profit: 0,
      first_order_at: null,
      last_order_at: null,
      signed_up_at: u.created_at,
      order_ids: [],
    });
  });

  orders.forEach((o) => {
    const key = o.user_id ?? `guest:${(o.phone1 || o.customer_name || o.id).trim()}`;
    let entry = map.get(key);

    if (!entry) {
      entry = {
        key,
        user_id: o.user_id,
        email: null,
        full_name: null,
        avatar_url: null,
        is_guest: !o.user_id,
        customer_name: o.customer_name,
        phone1: o.phone1,
        phone2: o.phone2,
        address: o.address,
        district: o.district,
        orders_count: 0,
        total_spent: 0,
        total_profit: 0,
        first_order_at: o.created_at,
        last_order_at: o.created_at,
        signed_up_at: null,
        order_ids: [],
      };
      map.set(key, entry);
    }

    entry.orders_count += 1;
    entry.total_spent += o.total ?? 0;
    entry.total_profit += o.profit ?? 0;
    entry.order_ids.push(o.id);

    if (!entry.first_order_at || new Date(o.created_at) < new Date(entry.first_order_at)) {
      entry.first_order_at = o.created_at;
    }
    if (!entry.last_order_at || new Date(o.created_at) > new Date(entry.last_order_at)) {
      entry.last_order_at = o.created_at;
      // Keep the most recent order's shipping details as the customer's "current" info
      entry.customer_name = entry.full_name ?? o.customer_name;
      entry.phone1 = o.phone1;
      entry.phone2 = o.phone2;
      entry.address = o.address;
      entry.district = o.district;
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const aTime = a.last_order_at ?? a.signed_up_at ?? "";
    const bTime = b.last_order_at ?? b.signed_up_at ?? "";
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}
