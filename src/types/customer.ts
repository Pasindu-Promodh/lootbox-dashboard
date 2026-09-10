export interface Customer {
  /** orders.user_id when known, otherwise a synthetic key for legacy/guest orders */
  key: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  /** true if this row has no linked auth account (legacy order predating user_id) */
  is_guest: boolean;

  customer_name: string;
  phone1: string;
  phone2: string;
  address: string;
  district: string;

  orders_count: number;
  total_spent: number;
  total_profit: number;
  first_order_at: string | null;
  last_order_at: string | null;
  /** auth.users.created_at -- when they signed up, not their first order */
  signed_up_at: string | null;
  order_ids: string[];
}
