import { fetchAllOrders } from "./orders";
import type { Customer } from "../types/customer";
import type { Order } from "../types/order";

/**
 * There is no dedicated "customers" table in the schema — customer info
 * (name, phone, address, district) lives on each order row. This fetches all
 * orders and groups them by phone number to produce a customer list.
 */
export async function fetchCustomers(): Promise<Customer[]> {
  const orders = await fetchAllOrders();
  return groupOrdersByCustomer(orders);
}

export function groupOrdersByCustomer(orders: Order[]): Customer[] {
  const map = new Map<string, Customer>();

  orders.forEach((o) => {
    const key = (o.phone1 || o.customer_name || o.id).trim();
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        key,
        customer_name: o.customer_name,
        phone1: o.phone1,
        phone2: o.phone2,
        address: o.address,
        district: o.district,
        orders_count: 1,
        total_spent: o.total ?? 0,
        total_profit: o.profit ?? 0,
        first_order_at: o.created_at,
        last_order_at: o.created_at,
        order_ids: [o.id],
      });
      return;
    }

    existing.orders_count += 1;
    existing.total_spent += o.total ?? 0;
    existing.total_profit += o.profit ?? 0;
    existing.order_ids.push(o.id);

    if (new Date(o.created_at) < new Date(existing.first_order_at)) {
      existing.first_order_at = o.created_at;
    }
    if (new Date(o.created_at) > new Date(existing.last_order_at)) {
      // Keep the most recent details in case the customer's info changed
      existing.last_order_at = o.created_at;
      existing.customer_name = o.customer_name;
      existing.address = o.address;
      existing.district = o.district;
      existing.phone2 = o.phone2;
    }
  });

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.last_order_at).getTime() - new Date(a.last_order_at).getTime()
  );
}
