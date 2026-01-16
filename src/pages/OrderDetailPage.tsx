// import {
//   Box,
//   Typography,
//   Divider,
//   Chip,
//   Button,
//   Paper,
//   Stack,
//   Avatar,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
// } from "@mui/material";
// import { useEffect, useState } from "react";
// import { supabase } from "../lib/supabase";
// import type { Order, OrderItem, OrderStatus } from "../types/order";
// import { Link } from "react-router-dom";
// import type { ProductImage } from "../services/products";

// interface OrderItemWithProduct extends OrderItem {
//   product?: { id: string; name: string; images: ProductImage[] };
// }

// const STATUS_COLORS: Record<OrderStatus, "default" | "warning" | "info" | "success" | "error"> = {
//   pending: "warning",
//   processing: "info",
//   shipped: "info",
//   delivered: "success",
//   cancelled: "error",
// };

// const ORDER_FLOW: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];
// const DEFAULT_STATUS_NOTES: Record<OrderStatus, string> = {
//   pending: "Order received, awaiting processing.",
//   processing: "Order is being prepared.",
//   shipped: "Order has been shipped.",
//   delivered: "Order delivered to customer.",
//   cancelled: "Order has been cancelled.",
// };

// export default function OrderDetailPage({ open, onClose, orderId }: { open: boolean; onClose: () => void; orderId: string }) {
//   const [order, setOrder] = useState<Order | null>(null);
//   const [items, setItems] = useState<OrderItemWithProduct[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [statusDialogOpen, setStatusDialogOpen] = useState(false);
//   const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);
//   const [note, setNote] = useState("");

//   useEffect(() => {
//     if (!orderId) return;
//     loadOrder();
//   }, [orderId]);

//   const loadOrder = async () => {
//     setLoading(true);
//     const { data: orderData, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
//     if (error || !orderData) return onClose();

//     const productIds = orderData.items.map((i: OrderItem) => i.product_id);
//     const { data: products } = await supabase.from("products").select("id, name, images").in("id", productIds);

//     const mergedItems: OrderItemWithProduct[] = orderData.items.map((item: OrderItem) => ({
//       ...item,
//       product: products?.find((p) => p.id === item.product_id),
//     }));

//     setOrder(orderData as Order);
//     setItems(mergedItems);
//     setLoading(false);
//   };

//   const getNextStatuses = (current: OrderStatus) =>
//     current === "cancelled" || current === "delivered" ? [] : ORDER_FLOW.filter(s => s === "cancelled" || ORDER_FLOW.indexOf(s) > ORDER_FLOW.indexOf(current));

//   const updateStatus = async (newStatus: OrderStatus, note?: string) => {
//     if (!order) return;
//     const newLogEntry = { status: newStatus, note, at: new Date().toISOString() };
//     const updatedStatusLog = [...order.status_log, newLogEntry];

//     const { error } = await supabase.from("orders").update({ status: newStatus, status_log: updatedStatusLog }).eq("id", order.id);
//     if (error) return console.error(error);

//     setOrder({ ...order, status: newStatus, status_log: updatedStatusLog });
//   };

//   if (loading || !order) return <Dialog open={open} fullScreen><DialogContent>Loading…</DialogContent></Dialog>;

//   return (
//     <Dialog open={open} fullScreen onClose={onClose}>
//       <DialogTitle>
//         Order #{order.id.slice(0, 8)}
//         <Button onClick={onClose} sx={{ float: "right" }}>Back</Button>
//       </DialogTitle>

//       <DialogContent>
//         <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
//           {/* LEFT */}
//           <Stack spacing={3} flex={2}>
//             <Paper sx={{ p: 3 }}>
//               <Typography fontWeight={600} mb={2}>Items</Typography>
//               <Stack spacing={2}>
//                 {items.map((item, i) => (
//                   <Box key={i} display="flex" justifyContent="space-between" alignItems="center">
//                     <Box display="flex" alignItems="center" gap={2}>
//                       <Avatar variant="rounded" src={item.product?.images?.[0]?.thumb ?? `https://placehold.co/56x56?text=${item.product?.name}`} sx={{ width: 56, height: 56 }} />
//                       <Box>
//                         <Typography component={Link} to={`/products/${item.product_id}`} sx={{ fontWeight: 500, textDecoration: "none", color: "inherit" }}>
//                           {item.product?.name ?? "Product removed"}
//                         </Typography>
//                         <Typography variant="caption" color="text.secondary">Qty: {item.qty}</Typography>
//                       </Box>
//                     </Box>
//                     <Box textAlign="right">
//                       <Typography fontWeight={600}>Rs. {(item.price - item.discount) * item.qty}</Typography>
//                       <Typography variant="caption" color="text.secondary" sx={{ textDecoration: item.discount > 0 ? "line-through" : "none" }}>
//                         Rs. {item.price} × {item.qty}
//                       </Typography>
//                       {item.discount > 0 && <Typography variant="caption" color="error">Discount: Rs. {item.discount} / item</Typography>}
//                     </Box>
//                   </Box>
//                 ))}
//               </Stack>
//               <Divider sx={{ my: 2 }} />
//               <Box display="flex" justifyContent="space-between"><Typography>Subtotal</Typography><Typography>Rs. {order.subtotal}</Typography></Box>
//               <Box display="flex" justifyContent="space-between"><Typography>Discount</Typography><Typography>- Rs. {order.discount}</Typography></Box>
//               <Box display="flex" justifyContent="space-between"><Typography>Shipping</Typography><Typography>Rs. {order.shipping}</Typography></Box>
//               <Divider sx={{ my: 1 }} />
//               <Box display="flex" justifyContent="space-between"><Typography fontWeight={600}>Total</Typography><Typography fontWeight={600}>Rs. {order.total}</Typography></Box>
//             </Paper>

//             {/* STATUS HISTORY */}
//             <Paper sx={{ p: 3 }}>
//               <Typography fontWeight={600} mb={2}>Status History</Typography>
//               <Stack spacing={1}>
//                 {order.status_log.map((log, i) => (
//                   <Box key={i}>
//                     <Chip size="small" label={log.status} color={STATUS_COLORS[log.status]} sx={{ mr: 1 }} />
//                     <Typography variant="caption" color="text.secondary">{log.at ? new Date(log.at).toLocaleString() : "—"}</Typography>
//                     {log.note && <Typography variant="body2">{log.note}</Typography>}
//                   </Box>
//                 ))}
//               </Stack>
//             </Paper>
//           </Stack>

//           {/* RIGHT */}
//           <Stack spacing={3} flex={1}>
//             <Paper sx={{ p: 3 }}>
//               <Typography fontWeight={600} mb={1}>Status</Typography>
//               <Chip label={order.status} color={STATUS_COLORS[order.status as OrderStatus]} sx={{ mb: 2 }} />
//               <Stack spacing={1}>
//                 {getNextStatuses(order.status as OrderStatus).map((status) => (
//                   <Button key={status} size="small" variant="outlined" onClick={() => { setNextStatus(status); setNote(DEFAULT_STATUS_NOTES[status] || ""); setStatusDialogOpen(true); }}>
//                     Mark as {status}
//                   </Button>
//                 ))}
//               </Stack>
//             </Paper>

//             <Paper sx={{ p: 3 }}>
//               <Typography fontWeight={600} mb={2}>Customer</Typography>
//               <Typography>{order.customer_name}</Typography>
//               <Typography variant="body2">{order.phone1}{order.phone2 && ` / ${order.phone2}`}</Typography>
//               <Divider sx={{ my: 2 }} />
//               <Typography variant="body2">{order.address}</Typography>
//               <Typography variant="body2">{order.district}</Typography>
//             </Paper>

//             <Paper sx={{ p: 3 }}>
//               <Typography fontWeight={600} mb={1}>Payment</Typography>
//               <Typography>{order.payment_method}</Typography>
//             </Paper>
//           </Stack>
//         </Stack>

//         {/* STATUS UPDATE DIALOG */}
//         <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
//           <DialogTitle>Update status to "{nextStatus}"</DialogTitle>
//           <DialogContent>
//             <TextField autoFocus fullWidth multiline minRows={3} label="Note (optional)" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} />
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
//             <Button variant="contained" disabled={!nextStatus} onClick={async () => { if (!nextStatus) return; await updateStatus(nextStatus, note || undefined); setStatusDialogOpen(false); }}>
//               Confirm
//             </Button>
//           </DialogActions>
//         </Dialog>
//       </DialogContent>
//     </Dialog>
//   );
// }

import {
  Box,
  Typography,
  Divider,
  Chip,
  Button,
  Paper,
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  IconButton,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Order, OrderItem, OrderStatus } from "../types/order";
import { Link } from "react-router-dom";
import type { ProductImage } from "../services/products";

interface OrderItemWithProduct extends OrderItem {
  product?: { id: string; name: string; images: ProductImage[] };
}

const STATUS_COLORS: Record<
  OrderStatus,
  "default" | "warning" | "info" | "success" | "error"
> = {
  pending: "warning",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "error",
};

const ORDER_FLOW: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
const DEFAULT_STATUS_NOTES: Record<OrderStatus, string> = {
  pending: "Order received, awaiting processing.",
  processing: "Order is being prepared.",
  shipped: "Order has been shipped.",
  delivered: "Order delivered to customer.",
  cancelled: "Order has been cancelled.",
};

const Row = ({ label, value, bold, type, minus }: any) => (
  <Box display="flex" justifyContent="space-between" mb={1}>
    <Typography fontWeight={bold ? 700 : 500} color={type}>
      {label}
    </Typography>
    <Box display="flex" justifyContent="space-between">
      {/* <Typography fontWeight={bold ? 700 : 500} color={type}>
        {minus ? "-" : ""} Rs {value}
      </Typography> */}
      <Typography fontWeight={bold ? 700 : 500} color={type}>
        {minus ? "-" : ""} Rs
      </Typography>
      <Typography
        fontWeight={bold ? 700 : 500}
        color={type}
        width={50}
        sx={{ textAlign: "right" }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

export default function OrderDetailPage({
  open,
  onClose,
  orderId,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!orderId) return;
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    const { data: orderData, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
    if (error || !orderData) return onClose();

    const productIds = orderData.items.map((i: OrderItem) => i.product_id);
    const { data: products } = await supabase
      .from("products")
      .select("id, name, images")
      .in("id", productIds);

    const mergedItems: OrderItemWithProduct[] = orderData.items.map(
      (item: OrderItem) => ({
        ...item,
        product: products?.find((p) => p.id === item.product_id),
      })
    );

    setOrder(orderData as Order);
    setItems(mergedItems);
    setLoading(false);
  };

  const getNextStatuses = (current: OrderStatus) =>
    current === "cancelled" || current === "delivered"
      ? []
      : ORDER_FLOW.filter(
          (s) =>
            s === "cancelled" ||
            ORDER_FLOW.indexOf(s) > ORDER_FLOW.indexOf(current)
        );

  const updateStatus = async (newStatus: OrderStatus, note?: string) => {
    if (!order) return;
    const newLogEntry = {
      status: newStatus,
      note,
      at: new Date().toISOString(),
    };
    const updatedStatusLog = [...order.status_log, newLogEntry];

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, status_log: updatedStatusLog })
      .eq("id", order.id);
    if (error) return console.error(error);

    setOrder({ ...order, status: newStatus, status_log: updatedStatusLog });
  };

  const updatePaymentStatus = async (newStatus: "submitted" | "received") => {
    if (!order) return;

    const { error } = await supabase
      .from("orders")
      .update({ payment_status: newStatus })
      .eq("id", order.id);

    if (error) {
      console.error(error);
      return;
    }

    setOrder({ ...order, payment_status: newStatus });
  };

  const copyOrderDetails = () => {
    if (!order) return;
    const details = [
      `Customer: ${order.customer_name}`,
      `Address: ${order.address}`,
      `District: ${order.district}`,
      `Phone 1: ${order.phone1}`,
      `Phone 2: ${order.phone2 || "—"}`,
      `Total: Rs. ${order.total}`,
      "Items:",
      ...items.map(
        (i) =>
          `• ${i.product?.name ?? "Product removed"} (Qty: ${i.qty}) - ${
            i.product?.images?.[0]?.thumb ?? "No image"
          }`
      ),
    ].join("\n");
    navigator.clipboard.writeText(details);
    alert("Order details copied!");
  };

  if (loading || !order)
    return (
      <Dialog open={open} fullScreen>
        <DialogContent>Loading…</DialogContent>
      </Dialog>
    );

  return (
    <Dialog open={open} fullScreen onClose={onClose}>
      <DialogTitle>
        Order #{order.id.slice(0, 8)}
        <Box sx={{ float: "right" }}>
          <Tooltip title="Copy Order Details">
            <IconButton onClick={copyOrderDetails}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Button onClick={onClose} sx={{ ml: 1 }}>
            Back
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          {/* LEFT */}
          <Stack spacing={3} flex={2}>
            <Paper sx={{ p: 3 }}>
              <Typography fontWeight={600} mb={2}>
                Items
              </Typography>
              <Stack spacing={2}>
                {items.map((item, i) => (
                  <Paper
                    key={i}
                    sx={{
                      p: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      "&:hover": { boxShadow: 6 },
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        variant="rounded"
                        src={
                          item.product?.images?.[0]?.thumb ??
                          `https://placehold.co/56x56?text=${item.product?.name}`
                        }
                        sx={{ width: 56, height: 56 }}
                      />
                      <Box>
                        <Typography
                          component={Link}
                          to={`/products/${item.product_id}`}
                          sx={{
                            fontWeight: 500,
                            textDecoration: "none",
                            color: "inherit",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {item.product?.name ?? "Product removed"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {" "}
                          | Qty: {item.qty}
                        </Typography>
                      </Box>
                    </Box>

                    <Box textAlign="right">
                      <Typography fontWeight={600}>Rs {item.price}</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          textDecoration:
                            item.pre_discount_price > item.price
                              ? "line-through"
                              : "none",
                        }}
                      >
                        Rs {item.pre_discount_price}
                      </Typography>
                      {item.pre_discount_price > item.price && (
                        <Typography variant="caption" color="error">
                          {" "}
                          | Discount:{" "}
                          {Math.round(
                            ((item.pre_discount_price - item.price) /
                              item.pre_discount_price) *
                              100
                          )}
                          % / Rs.{" "}
                          {item.pre_discount_price - item.price} per
                          item
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {" "}
                        | Original Price: Rs {item.original_price} /
                      </Typography>
                      <Typography variant="caption" color="success">
                        {" "}
                        Profit: Rs {item.profit}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Row
                label="Subtotal"
                value={order.pre_discount_subtotal}
                type={"text.primary"}
              />
              {order.discount > 0 && (
                <>
                <Row
                  label="Discount"
                  value={order.discount}
                  minus
                  type={"error"}
                />
                <Row
                  label="Discounted Subtotal"
                  value={order.subtotal}
                  type={"text.primary"}
                />
                </>
              )}

              <Row
                label="Shipping"
                value={order.shipping}
                type={"text.primary"}
              />

              <Divider sx={{ my: 1 }} />
              <Row
                label="Total"
                value={order.total}
                type={"text.primary"}
                bold
              />

              <Row
                label="Total Profit"
                value={order.profit}
                type={"success"}
                bold
              />
            </Paper>

            {/* STATUS HISTORY */}
            <Paper sx={{ p: 3 }}>
              <Typography fontWeight={600} mb={2}>
                Status History
              </Typography>
              <Stack spacing={1}>
                {order.status_log.map((log, i) => (
                  <Box
                    key={i}
                    display="flex"
                    alignItems="center" // vertical center
                    gap={1} // horizontal spacing
                    flexWrap="wrap" // optional, allows long notes to wrap
                  >
                    <Chip
                      size="small"
                      label={log.status}
                      color={STATUS_COLORS[log.status]}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ lineHeight: "20px" }} // ensures vertical centering with Chip
                    >
                      {log.at ? new Date(log.at).toLocaleString() : "—"}
                    </Typography>
                    {log.note && (
                      <Typography
                        variant="body2"
                        sx={{ lineHeight: "20px", whiteSpace: "pre-wrap" }}
                      >
                        {log.note}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Stack>

          {/* RIGHT */}
          <Stack spacing={3} flex={1}>
            <Paper sx={{ p: 3 }}>
              <Typography fontWeight={600} mb={1}>
                Status
              </Typography>
              <Chip
                label={order.status}
                color={STATUS_COLORS[order.status as OrderStatus]}
                sx={{ mb: 2 }}
              />
              <Stack spacing={1}>
                {/* {getNextStatuses(order.status as OrderStatus).map((status) => (
                  <Button
                    key={status}
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setNextStatus(status);
                      setNote(DEFAULT_STATUS_NOTES[status] || "");
                      setStatusDialogOpen(true);
                    }}
                  >
                    Mark as {status}
                  </Button>
                ))} */}

                {/* ORDER STATUS ACTIONS */}
                {getNextStatuses(order.status as OrderStatus).map((status) => (
                  <Button
                    key={status}
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setNextStatus(status);
                      setNote(DEFAULT_STATUS_NOTES[status] || "");
                      setStatusDialogOpen(true);
                    }}
                  >
                    Mark as {status}
                  </Button>
                ))}

                {/* PAYMENT STATUS ACTIONS */}
                {order.status === "delivered" &&
                  order.payment_status === "pending" && (
                    <Button
                      size="small"
                      color="warning"
                      variant="contained"
                      onClick={() => updatePaymentStatus("submitted")}
                    >
                      Mark payment as submitted
                    </Button>
                  )}

                {order.payment_status === "submitted" && (
                  <Button
                    size="small"
                    color="success"
                    variant="contained"
                    onClick={() => updatePaymentStatus("received")}
                  >
                    Mark payment as received
                  </Button>
                )}
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography fontWeight={600} mb={2}>
                Customer
              </Typography>
              <Typography>{order.customer_name}</Typography>
              <Typography variant="body2">
                {order.phone1}
                {order.phone2 && ` / ${order.phone2}`}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">{order.address}</Typography>
              <Typography variant="body2">{order.district}</Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography fontWeight={600} mb={1}>
                Payment
              </Typography>
              <Typography>{order.payment_method}</Typography>
            </Paper>
          </Stack>
        </Stack>

        {/* STATUS UPDATE DIALOG */}
        <Dialog
          open={statusDialogOpen}
          onClose={() => setStatusDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Update status to "{nextStatus}"</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={3}
              label="Note (optional)"
              placeholder="Add a note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!nextStatus}
              onClick={async () => {
                if (!nextStatus) return;
                await updateStatus(nextStatus, note || undefined);
                setStatusDialogOpen(false);
              }}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
