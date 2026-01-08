// import {
//   Box,
//   Typography,
//   Divider,
//   Chip,
//   Button,
//   Paper,
//   Stack,
// } from "@mui/material";
// import { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { supabase } from "../lib/supabase";
// import type { Order, OrderStatus } from "../types/order";

// const STATUS_COLORS: Record<
//   OrderStatus,
//   "default" | "warning" | "info" | "success" | "error"
// > = {
//   pending: "warning",
//   processing: "info",
//   shipped: "info",
//   delivered: "success",
//   cancelled: "error",
// };

// export default function OrderDetailPage() {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState<Order | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadOrder();
//   }, [id]);

//   const loadOrder = async () => {
//     setLoading(true);

//     const { data, error } = await supabase
//       .from("orders")
//       .select("*")
//       .eq("id", id)
//       .single();

//     if (error) {
//       console.error(error);
//       navigate("/orders");
//       return;
//     }

//     setOrder(data as Order);
//     setLoading(false);
//   };

//   if (loading || !order) {
//     return (
//       <Box p={4}>
//         <Typography>Loading order...</Typography>
//       </Box>
//     );
//   }

//   return (
//     <Box width="100%" minHeight="100vh" bgcolor="#f8fafc" p={{ xs: 2, sm: 4 }}>
//       {/* Header */}
//       <Box
//         display="flex"
//         justifyContent="space-between"
//         alignItems="center"
//         mb={3}
//       >
//         <Box>
//           <Typography fontSize={20} fontWeight={600}>
//             Order #{order.id.slice(0, 8)}
//           </Typography>
//           <Typography variant="body2" color="text.secondary">
//             Placed on {new Date(order.created_at).toLocaleString()}
//           </Typography>
//         </Box>

//         <Button variant="outlined" onClick={() => navigate("/orders")}>
//           Back to Orders
//         </Button>
//       </Box>

//       <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
//         {/* LEFT COLUMN */}
//         <Stack spacing={3} flex={2}>
//           {/* Items */}
//           <Paper sx={{ p: 3 }}>
//             <Typography fontWeight={600} mb={2}>
//               Items
//             </Typography>

//             <Stack spacing={1}>
//               {order.items.map((item, i) => (
//                 <Box
//                   key={i}
//                   display="flex"
//                   justifyContent="space-between"
//                 >
//                   <Typography>
//                     {item.product_id.slice(0, 8)} × {item.qty}
//                   </Typography>
//                   <Typography fontWeight={500}>
//                     Rs. {item.price * item.qty}
//                   </Typography>
//                 </Box>
//               ))}
//             </Stack>

//             <Divider sx={{ my: 2 }} />

//             <Box display="flex" justifyContent="space-between">
//               <Typography>Subtotal</Typography>
//               <Typography>Rs. {order.subtotal}</Typography>
//             </Box>

//             <Box display="flex" justifyContent="space-between">
//               <Typography>Discount</Typography>
//               <Typography>- Rs. {order.discount}</Typography>
//             </Box>

//             <Box display="flex" justifyContent="space-between">
//               <Typography>Shipping</Typography>
//               <Typography>Rs. {order.shipping}</Typography>
//             </Box>

//             <Divider sx={{ my: 1 }} />

//             <Box display="flex" justifyContent="space-between">
//               <Typography fontWeight={600}>Total</Typography>
//               <Typography fontWeight={600}>
//                 Rs. {order.total}
//               </Typography>
//             </Box>
//           </Paper>

//           {/* Status Log */}
//           <Paper sx={{ p: 3 }}>
//             <Typography fontWeight={600} mb={2}>
//               Status History
//             </Typography>

//             <Stack spacing={1}>
//               {order.status_log.map((log, i) => (
//                 <Box key={i}>
//                   <Chip
//                     size="small"
//                     label={log.status}
//                     color={STATUS_COLORS[log.status]}
//                     sx={{ mr: 1 }}
//                   />
//                   <Typography variant="caption" color="text.secondary">
//                     {log.at
//                       ? new Date(log.at).toLocaleString()
//                       : "—"}
//                   </Typography>
//                   {log.note && (
//                     <Typography variant="body2">
//                       {log.note}
//                     </Typography>
//                   )}
//                 </Box>
//               ))}
//             </Stack>
//           </Paper>
//         </Stack>

//         {/* RIGHT COLUMN */}
//         <Stack spacing={3} flex={1}>
//           {/* Status */}
//           <Paper sx={{ p: 3 }}>
//             <Typography fontWeight={600} mb={1}>
//               Current Status
//             </Typography>
//             <Chip
//               label={order.status}
//               color={STATUS_COLORS[order.status as OrderStatus]}
//             />
//           </Paper>

//           {/* Customer */}
//           <Paper sx={{ p: 3 }}>
//             <Typography fontWeight={600} mb={2}>
//               Customer
//             </Typography>

//             <Typography>{order.customer_name}</Typography>
//             <Typography variant="body2">
//               {order.phone1}
//               {order.phone2 && ` / ${order.phone2}`}
//             </Typography>

//             <Divider sx={{ my: 2 }} />

//             <Typography variant="body2">{order.address}</Typography>
//             <Typography variant="body2">
//               {order.district}
//             </Typography>
//           </Paper>

//           {/* Payment */}
//           <Paper sx={{ p: 3 }}>
//             <Typography fontWeight={600} mb={1}>
//               Payment Method
//             </Typography>
//             <Typography>{order.payment_method}</Typography>
//           </Paper>
//         </Stack>
//       </Stack>
//     </Box>
//   );
// }

// import {
//   Box,
//   Typography,
//   Divider,
//   Chip,
//   Button,
//   Paper,
//   Stack,
//   Avatar,
// } from "@mui/material";
// import { useEffect, useState } from "react";
// import { useNavigate, useParams, Link } from "react-router-dom";
// import { supabase } from "../lib/supabase";
// import type { Order, OrderItem, OrderStatus } from "../types/order";
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
// } from "@mui/material";

// interface OrderItemWithProduct extends OrderItem {
//   product?: {
//     id: string;
//     name: string;
//     images: string[];
//   };
// }

// const STATUS_COLORS: Record<
//   OrderStatus,
//   "default" | "warning" | "info" | "success" | "error"
// > = {
//   pending: "warning",
//   processing: "info",
//   shipped: "info",
//   delivered: "success",
//   cancelled: "error",
// };

// const ORDER_FLOW: OrderStatus[] = [
//   "pending",
//   "processing",
//   "shipped",
//   "delivered",
//   "cancelled",
// ];

// const DEFAULT_STATUS_NOTES: Record<OrderStatus, string> = {
//   pending: "Order received, awaiting processing.",
//   processing: "Order is being prepared.",
//   shipped: "Order has been shipped.",
//   delivered: "Order delivered to customer.",
//   cancelled: "Order has been cancelled.",
// };

// export default function OrderDetailPage() {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState<Order | null>(null);
//   const [items, setItems] = useState<OrderItemWithProduct[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [statusDialogOpen, setStatusDialogOpen] = useState(false);
//   const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);
//   const [note, setNote] = useState("");

//   useEffect(() => {
//     loadOrder();
//   }, [id]);

//   const loadOrder = async () => {
//     setLoading(true);

//     /* 1️⃣ Fetch order */
//     const { data: orderData, error } = await supabase
//       .from("orders")
//       .select("*")
//       .eq("id", id)
//       .single();

//     if (error || !orderData) {
//       navigate("/orders");
//       return;
//     }

//     /* 2️⃣ Fetch products used in order */
//     const productIds = orderData.items.map((i: OrderItem) => i.product_id);

//     const { data: products } = await supabase
//       .from("products")
//       .select("id, name, images")
//       .in("id", productIds);

//     /* 3️⃣ Merge product info into items */
//     const mergedItems: OrderItemWithProduct[] = orderData.items.map(
//       (item: OrderItem) => ({
//         ...item,
//         product: products?.find((p) => p.id === item.product_id),
//       })
//     );

//     setOrder(orderData as Order);
//     setItems(mergedItems);
//     setLoading(false);
//   };

//   if (loading || !order) {
//     return (
//       <Box p={4}>
//         <Typography>Loading order…</Typography>
//       </Box>
//     );
//   }

//   const getNextStatuses = (current: OrderStatus): OrderStatus[] => {
//     if (current === "cancelled" || current === "delivered") return [];

//     return ORDER_FLOW.filter((s) => {
//       if (s === "cancelled") return true;
//       return ORDER_FLOW.indexOf(s) > ORDER_FLOW.indexOf(current);
//     });
//   };

//   const updateStatus = async (newStatus: OrderStatus, note?: string) => {
//     if (!order) return;

//     const newLogEntry = {
//       status: newStatus,
//       at: new Date().toISOString(),
//       note,
//     };

//     const updatedStatusLog = [...order.status_log, newLogEntry];

//     const { error } = await supabase
//       .from("orders")
//       .update({
//         status: newStatus,
//         status_log: updatedStatusLog,
//       })
//       .eq("id", order.id);

//     if (error) {
//       console.error(error);
//       return;
//     }

//     // optimistic update
//     setOrder({
//       ...order,
//       status: newStatus,
//       status_log: updatedStatusLog,
//     });
//   };

//   return (
//     <Box width="100%" minHeight="100vh" bgcolor="#f8fafc" p={{ xs: 2, sm: 4 }}>
//       {/* HEADER */}
//       <Box
//         display="flex"
//         justifyContent="space-between"
//         alignItems="center"
//         mb={3}
//       >
//         <Box>
//           <Typography fontSize={20} fontWeight={600}>
//             Order #{order.id.slice(0, 8)}
//           </Typography>
//           <Typography variant="body2" color="text.secondary">
//             {new Date(order.created_at).toLocaleString()}
//           </Typography>
//         </Box>

//         <Button variant="outlined" onClick={() => navigate("/orders")}>
//           Back to Orders
//         </Button>
//       </Box>

//       <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
//         {/* LEFT */}
//         <Stack spacing={3} flex={2}>
//           {/* ITEMS */}
//           <Paper sx={{ p: 3 }}>
//             <Typography fontWeight={600} mb={2}>
//               Items
//             </Typography>

//             <Stack spacing={2}>
//               {items.map((item, i) => (
//                 <Box
//                   key={i}
//                   display="flex"
//                   justifyContent="space-between"
//                   alignItems="center"
//                 >
//                   {/* Product */}
//                   <Box display="flex" alignItems="center" gap={2}>
//                     <Avatar
//                       variant="rounded"
//                       src={
//                         item.product?.images?.[0] ??
//                         `https://placehold.co/56x56?text=${item.product?.name}`
//                       }
//                       sx={{ width: 56, height: 56 }}
//                     />

//                     <Box>
//                       <Typography
//                         component={Link}
//                         to={`/products/${item.product_id}`}
//                         sx={{
//                           fontWeight: 500,
//                           textDecoration: "none",
//                           color: "inherit",
//                         }}
//                       >
//                         {item.product?.name ?? "Product removed"}
//                       </Typography>

//                       <Typography variant="caption" color="text.secondary">
//                         Qty: {item.qty}
//                       </Typography>
//                     </Box>
//                   </Box>

//                   {/* Price breakdown */}
//                   <Box textAlign="right">
//                     {/* Final line total */}
//                     <Typography fontWeight={600}>
//                       Rs. {(item.price - item.discount) * item.qty}
//                     </Typography>

//                     {/* Original unit price */}
//                     <Typography
//                       variant="caption"
//                       color="text.secondary"
//                       sx={{
//                         textDecoration:
//                           item.discount > 0 ? "line-through" : "none",
//                       }}
//                     >
//                       Rs. {item.price} × {item.qty}
//                     </Typography>

//                     {/* Discount */}
//                     {item.discount > 0 && (
//                       <Typography variant="caption" color="error">
//                         Discount: Rs. {item.discount} / item
//                       </Typography>
//                     )}
//                   </Box>
//                 </Box>
//               ))}
//             </Stack>

//             <Divider sx={{ my: 2 }} />

//             {/* TOTALS */}
//             <Box display="flex" justifyContent="space-between">
//               <Typography>Subtotal</Typography>
//               <Typography>Rs. {order.subtotal}</Typography>
//             </Box>

//             <Box display="flex" justifyContent="space-between">
//               <Typography>Discount</Typography>
//               <Typography>- Rs. {order.discount}</Typography>
//             </Box>

//             <Box display="flex" justifyContent="space-between">
//               <Typography>Shipping</Typography>
//               <Typography>Rs. {order.shipping}</Typography>
//             </Box>

//             <Divider sx={{ my: 1 }} />

//             <Box display="flex" justifyContent="space-between">
//               <Typography fontWeight={600}>Total</Typography>
//               <Typography fontWeight={600}>Rs. {order.total}</Typography>
//             </Box>
//           </Paper>

//           {/* STATUS HISTORY */}
//           <Paper sx={{ p: 3 }}>
//             <Typography fontWeight={600} mb={2}>
//               Status History
//             </Typography>

//             <Stack spacing={1}>
//               {order.status_log.map((log, i) => (
//                 <Box key={i}>
//                   <Chip
//                     size="small"
//                     label={log.status}
//                     color={STATUS_COLORS[log.status]}
//                     sx={{ mr: 1 }}
//                   />
//                   <Typography variant="caption" color="text.secondary">
//                     {log.at ? new Date(log.at).toLocaleString() : "—"}
//                   </Typography>
//                   {log.note && (
//                     <Typography variant="body2">{log.note}</Typography>
//                   )}
//                 </Box>
//               ))}
//             </Stack>
//           </Paper>
//         </Stack>

//         {/* RIGHT */}
//         <Stack spacing={3} flex={1}>
//           <Paper sx={{ p: 3 }}>
//             <Typography fontWeight={600} mb={1}>
//               Status
//             </Typography>

//             <Chip
//               label={order.status}
//               color={STATUS_COLORS[order.status as OrderStatus]}
//               sx={{ mb: 2 }}
//             />

//             <Stack spacing={1}>
//               {getNextStatuses(order.status as OrderStatus).map((status) => (
//                 <Button
//                   size="small"
//                   variant="outlined"
//                   onClick={() => {
//                     setNextStatus(status);
//                     setNote(DEFAULT_STATUS_NOTES[status] || "");
//                     setStatusDialogOpen(true);
//                   }}
//                 >
//                   Mark as {status}
//                 </Button>
//               ))}
//             </Stack>
//           </Paper>

//           <Paper sx={{ p: 3 }}>
//             <Typography fontWeight={600} mb={2}>
//               Customer
//             </Typography>

//             <Typography>{order.customer_name}</Typography>
//             <Typography variant="body2">
//               {order.phone1}
//               {order.phone2 && ` / ${order.phone2}`}
//             </Typography>

//             <Divider sx={{ my: 2 }} />

//             <Typography variant="body2">{order.address}</Typography>
//             <Typography variant="body2">{order.district}</Typography>
//           </Paper>

//           <Paper sx={{ p: 3 }}>
//             <Typography fontWeight={600} mb={1}>
//               Payment
//             </Typography>
//             <Typography>{order.payment_method}</Typography>
//           </Paper>
//         </Stack>
//       </Stack>
//       <Dialog
//         open={statusDialogOpen}
//         onClose={() => setStatusDialogOpen(false)}
//         maxWidth="sm"
//         fullWidth
//       >
//         <DialogTitle>Update status to "{nextStatus}"</DialogTitle>

//         <DialogContent>
//           <TextField
//             autoFocus
//             fullWidth
//             multiline
//             minRows={3}
//             label="Note (optional)"
//             placeholder="Add a note for this status change…"
//             value={note}
//             onChange={(e) => setNote(e.target.value)}
//           />
//         </DialogContent>

//         <DialogActions>
//           <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
//           <Button
//             variant="contained"
//             disabled={!nextStatus}
//             onClick={async () => {
//               if (!nextStatus) return;
//               await updateStatus(nextStatus, note || undefined);
//               setStatusDialogOpen(false);
//             }}
//           >
//             Confirm
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
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
} from "@mui/material";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Order, OrderItem, OrderStatus } from "../types/order";
import { Link } from "react-router-dom";

interface OrderItemWithProduct extends OrderItem {
  product?: { id: string; name: string; images: string[] };
}

const STATUS_COLORS: Record<OrderStatus, "default" | "warning" | "info" | "success" | "error"> = {
  pending: "warning",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "error",
};

const ORDER_FLOW: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];
const DEFAULT_STATUS_NOTES: Record<OrderStatus, string> = {
  pending: "Order received, awaiting processing.",
  processing: "Order is being prepared.",
  shipped: "Order has been shipped.",
  delivered: "Order delivered to customer.",
  cancelled: "Order has been cancelled.",
};

export default function OrderDetailPage({ open, onClose, orderId }: { open: boolean; onClose: () => void; orderId: string }) {
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
    const { data: orderData, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
    if (error || !orderData) return onClose();

    const productIds = orderData.items.map((i: OrderItem) => i.product_id);
    const { data: products } = await supabase.from("products").select("id, name, images").in("id", productIds);

    const mergedItems: OrderItemWithProduct[] = orderData.items.map((item: OrderItem) => ({
      ...item,
      product: products?.find((p) => p.id === item.product_id),
    }));

    setOrder(orderData as Order);
    setItems(mergedItems);
    setLoading(false);
  };

  const getNextStatuses = (current: OrderStatus) =>
    current === "cancelled" || current === "delivered" ? [] : ORDER_FLOW.filter(s => s === "cancelled" || ORDER_FLOW.indexOf(s) > ORDER_FLOW.indexOf(current));

  const updateStatus = async (newStatus: OrderStatus, note?: string) => {
    if (!order) return;
    const newLogEntry = { status: newStatus, at: new Date().toISOString(), note };
    const updatedStatusLog = [...order.status_log, newLogEntry];

    const { error } = await supabase.from("orders").update({ status: newStatus, status_log: updatedStatusLog }).eq("id", order.id);
    if (error) return console.error(error);

    setOrder({ ...order, status: newStatus, status_log: updatedStatusLog });
  };

  if (loading || !order) return <Dialog open={open} fullScreen><DialogContent>Loading…</DialogContent></Dialog>;

  return (
    <Dialog open={open} fullScreen onClose={onClose}>
      <DialogTitle>
        Order #{order.id.slice(0, 8)}
        <Button onClick={onClose} sx={{ float: "right" }}>Back</Button>
      </DialogTitle>

      <DialogContent>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          {/* LEFT */}
          <Stack spacing={3} flex={2}>
            <Paper sx={{ p: 3 }}>
              <Typography fontWeight={600} mb={2}>Items</Typography>
              <Stack spacing={2}>
                {items.map((item, i) => (
                  <Box key={i} display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar variant="rounded" src={item.product?.images?.[0] ?? `https://placehold.co/56x56?text=${item.product?.name}`} sx={{ width: 56, height: 56 }} />
                      <Box>
                        <Typography component={Link} to={`/products/${item.product_id}`} sx={{ fontWeight: 500, textDecoration: "none", color: "inherit" }}>
                          {item.product?.name ?? "Product removed"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Qty: {item.qty}</Typography>
                      </Box>
                    </Box>
                    <Box textAlign="right">
                      <Typography fontWeight={600}>Rs. {(item.price - item.discount) * item.qty}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ textDecoration: item.discount > 0 ? "line-through" : "none" }}>
                        Rs. {item.price} × {item.qty}
                      </Typography>
                      {item.discount > 0 && <Typography variant="caption" color="error">Discount: Rs. {item.discount} / item</Typography>}
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between"><Typography>Subtotal</Typography><Typography>Rs. {order.subtotal}</Typography></Box>
              <Box display="flex" justifyContent="space-between"><Typography>Discount</Typography><Typography>- Rs. {order.discount}</Typography></Box>
              <Box display="flex" justifyContent="space-between"><Typography>Shipping</Typography><Typography>Rs. {order.shipping}</Typography></Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between"><Typography fontWeight={600}>Total</Typography><Typography fontWeight={600}>Rs. {order.total}</Typography></Box>
            </Paper>

            {/* STATUS HISTORY */}
            <Paper sx={{ p: 3 }}>
              <Typography fontWeight={600} mb={2}>Status History</Typography>
              <Stack spacing={1}>
                {order.status_log.map((log, i) => (
                  <Box key={i}>
                    <Chip size="small" label={log.status} color={STATUS_COLORS[log.status]} sx={{ mr: 1 }} />
                    <Typography variant="caption" color="text.secondary">{log.at ? new Date(log.at).toLocaleString() : "—"}</Typography>
                    {log.note && <Typography variant="body2">{log.note}</Typography>}
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Stack>

          {/* RIGHT */}
          <Stack spacing={3} flex={1}>
            <Paper sx={{ p: 3 }}>
              <Typography fontWeight={600} mb={1}>Status</Typography>
              <Chip label={order.status} color={STATUS_COLORS[order.status as OrderStatus]} sx={{ mb: 2 }} />
              <Stack spacing={1}>
                {getNextStatuses(order.status as OrderStatus).map((status) => (
                  <Button key={status} size="small" variant="outlined" onClick={() => { setNextStatus(status); setNote(DEFAULT_STATUS_NOTES[status] || ""); setStatusDialogOpen(true); }}>
                    Mark as {status}
                  </Button>
                ))}
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography fontWeight={600} mb={2}>Customer</Typography>
              <Typography>{order.customer_name}</Typography>
              <Typography variant="body2">{order.phone1}{order.phone2 && ` / ${order.phone2}`}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">{order.address}</Typography>
              <Typography variant="body2">{order.district}</Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography fontWeight={600} mb={1}>Payment</Typography>
              <Typography>{order.payment_method}</Typography>
            </Paper>
          </Stack>
        </Stack>

        {/* STATUS UPDATE DIALOG */}
        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Update status to "{nextStatus}"</DialogTitle>
          <DialogContent>
            <TextField autoFocus fullWidth multiline minRows={3} label="Note (optional)" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" disabled={!nextStatus} onClick={async () => { if (!nextStatus) return; await updateStatus(nextStatus, note || undefined); setStatusDialogOpen(false); }}>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

