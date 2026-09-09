export interface Customer {
  /** Unique grouping key — phone1 when available, otherwise falls back to name/order id */
  key: string;
  customer_name: string;
  phone1: string;
  phone2: string;
  address: string;
  district: string;
  orders_count: number;
  total_spent: number;
  total_profit: number;
  first_order_at: string;
  last_order_at: string;
  order_ids: string[];
}
