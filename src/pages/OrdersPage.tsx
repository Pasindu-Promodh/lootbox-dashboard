import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
  Select,
  MenuItem,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "../types/order";
import { supabase } from "../lib/supabase";

const statusColors: Record<
  OrderStatus,
  "default" | "warning" | "info" | "success" | "error"
> = {
  pending: "warning",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "error",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productMap, setProductMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);

    const { data: ordersData, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setLoading(false);
      return;
    }

    setOrders(ordersData || []);

    const productIds = Array.from(
      new Set(ordersData?.flatMap((o) => o.items.map((i: any) => i.product_id)))
    );

    if (productIds.length) {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, images")
        .in("id", productIds);

      const map: Record<string, any> = {};
      products?.forEach((p) => (map[p.id] = p));
      setProductMap(map);
    }

    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const newLog = [
      ...order.status_log,
      { status, at: new Date().toISOString() },
    ];

    await supabase
      .from("orders")
      .update({
        status_log: newLog,
      })
      .eq("id", orderId);

    loadOrders();
  };

  if (loading) {
    return (
      <Box py={6} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box px={3} py={4} width="100%">
      <Typography variant="h5" mb={3}>
        Orders
      </Typography>

      <Box display="flex" flexDirection="column" gap={2}>
        {orders.map((order) => {
          const currentStatus: OrderStatus =
            order.status_log.length > 0
              ? order.status_log[order.status_log.length - 1].status
              : "pending";

          return (
            <Card key={order.id} variant="outlined">
              <CardContent>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography fontWeight={600}>
                    Order #{order.id.slice(0, 8)}
                  </Typography>

                  <Chip
                    label={currentStatus}
                    color={statusColors[currentStatus]}
                    size="small"
                  />
                </Box>

                {/* Customer */}
                <Typography variant="body2" color="text.secondary">
                  {order.customer_name} · {order.phone1}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Items */}
                <Box display="flex" flexDirection="column" gap={1}>
                  {order.items.map((item) => {
                    const product = productMap[item.product_id];

                    return (
                      <Box
                        key={item.product_id}
                        display="flex"
                        alignItems="center"
                        gap={2}
                      >
                        {product?.images?.[0] && (
                          <img
                            src={product.images[0]}
                            width={48}
                            height={48}
                            style={{ objectFit: "cover", borderRadius: 6 }}
                          />
                        )}
                        <Box flex={1}>
                          <Typography fontSize={14}>
                            {product?.name || "Unknown product"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Qty: {item.qty}
                          </Typography>
                        </Box>
                        <Typography fontSize={14}>
                          Rs. {item.price * item.qty}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Footer */}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography fontWeight={600}>
                    Total: Rs. {order.total}
                  </Typography>

                  <Select
                    size="small"
                    value={currentStatus}
                    onChange={(e) =>
                      updateStatus(order.id, e.target.value as OrderStatus)
                    }
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="processing">Processing</MenuItem>
                    <MenuItem value="shipped">Shipped</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
