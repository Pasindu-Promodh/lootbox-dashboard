import type { Order, OrderStatus } from "../types/order";

/**
 * Always returns the latest status of an order.
 * Falls back to "pending" if log is empty.
 */
export function getLatestOrderStatus1(order: Order): OrderStatus {
  if (!order.status_log || order.status_log.length === 0) {
    return "pending";
  }

  return order.status_log[order.status_log.length - 1].status;
}