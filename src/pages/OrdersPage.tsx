import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { fetchAllOrders } from "../services/orders";
import type { Order, OrderStatus } from "../types/order";
import OrderDetailPage from "./OrderDetailPage";
import { useNavigate } from "react-router-dom";

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const SELECTED_STATUSES: OrderStatus[] = ["pending"];

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

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] =
    useState<OrderStatus[]>(SELECTED_STATUSES);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const allSelected = selectedStatuses.length === ALL_STATUSES.length;

const toggleSelectAll = (checked: boolean) => {
  setSelectedStatuses(checked ? ALL_STATUSES : []);
};

const totalCount = orders.length;


  const statusCounts = useMemo(() => {
  const counts: Record<OrderStatus, number> = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  orders.forEach((o) => {
    counts[o.status as OrderStatus]++;
  });

  return counts;
}, [orders]);


  const loadOrders = async () => {
    setLoading(true);
    const data = await fetchAllOrders();
    setOrders(data);
    setLoading(false);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        o.phone1.includes(search);

      const matchesStatus = selectedStatuses.includes(o.status as OrderStatus);

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, selectedStatuses]);

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Order ID",
      width: 140,
      renderCell: (params) => (
        <Typography fontWeight={500}>#{params.value.slice(0, 8)}</Typography>
      ),
    },
    { field: "customer_name", headerName: "Customer", flex: 1, minWidth: 180 },
    { field: "district", headerName: "District", width: 120 },
    {
      field: "total",
      headerName: "Total",
      width: 120,
      renderCell: (params) => (
        <Typography fontWeight={600} sx={{ textAlign: "right", flex: 1 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "profit",
      headerName: "Profit",
      width: 120,
      renderCell: (params) => (
        <Typography
          fontWeight={600}
          color="success"
          sx={{ textAlign: "right", flex: 1 }}
        >
          {params.value}
        </Typography>
      ),
    },
    { field: "payment_method", headerName: "Payment", width: 100 },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          color={STATUS_COLORS[params.value as OrderStatus]}
        />
      ),
    },
    {
      field: "created_at",
      headerName: "Date",
      width: 160,
      renderCell: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 70,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="large"
          sx={{ flex: 1 }}
          onClick={() => setSelectedOrderId(params.row.id)}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box width="100%" minHeight="100vh" bgcolor="#f8fafc">
      {/* HEADER */}
      <Box
        px={{ xs: 2, sm: 4 }}
        py={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bgcolor="#fff"
        boxShadow="0 1px 8px rgba(0,0,0,0.05)"
      >
        <Box>
          <Typography fontSize={20} fontWeight={600}>
            Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage customer orders
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Button variant="outlined" onClick={loadOrders}>
            Refresh
          </Button>
          <Button variant="outlined" onClick={() => navigate("/dashboard")}>
            Back
          </Button>
        </Box>
      </Box>

      {/* SEARCH + FILTERS */}
      <Box px={{ xs: 2, sm: 4 }} py={4}>
        <Box
          mb={3}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
        >
          <Box maxWidth={360} flex={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search orders…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Box>
          <FormGroup row>
            <FormControlLabel
    label={`All (${totalCount})`}
    control={
      <Checkbox
        size="small"
        checked={allSelected}
        indeterminate={
          selectedStatuses.length > 0 && !allSelected
        }
        onChange={(e) => toggleSelectAll(e.target.checked)}
      />
    }
  />
            {ALL_STATUSES.map((status) => (
              <FormControlLabel
                key={status}
                label={`${status} (${statusCounts[status]})`}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedStatuses.includes(status)}
                    onChange={(e) =>
                      setSelectedStatuses((prev) =>
                        e.target.checked
                          ? [...prev, status]
                          : prev.filter((s) => s !== status)
                      )
                    }
                  />
                }
              />
            ))}
          </FormGroup>
        </Box>

        <Box height={600}>
          <DataGrid
            rows={filteredOrders}
            columns={columns}
            getRowId={(row) => row.id}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
            }}
            disableRowSelectionOnClick
            sx={{
              backgroundColor: "#fff",
              borderRadius: 2,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f1f5f9",
                fontWeight: 600,
              },
              "& .MuiDataGrid-cell": { display: "flex", alignItems: "center" },
            }}
          />
        </Box>
      </Box>

      {/* FULLSCREEN ORDER DETAIL DIALOG */}
      {selectedOrderId && (
        <OrderDetailPage
          open={Boolean(selectedOrderId)}
          onClose={() => setSelectedOrderId(null)}
          orderId={selectedOrderId}
        />
      )}
    </Box>
  );
}
