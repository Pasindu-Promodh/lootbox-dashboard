export interface OrderItem {
  product_id: string;
  qty: number;
  original_price: number;
  pre_discount_price: number;
  price: number;
  profit: number;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderStatusLog {
  status: OrderStatus;
  at?: string;
  note?: string;
}

export interface Order {
  id: string;
  created_at: string;

  pre_discount_subtotal: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  profit: number;
  status: string;
  status_log: OrderStatusLog[];
  items: OrderItem[];
  payment_status: "pending" | "submitted" | "received";

  customer_name: string;
  address: string;
  district: string;
  phone1: string;
  phone2: string;
  payment_method: string;
}
