import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Snackbar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import InventoryIcon from "@mui/icons-material/Inventory";
import LoyaltyIcon from "@mui/icons-material/Loyalty";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, type Product } from "../services/products";

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await getProducts({ limit: 50 });
    setProducts(data);
    setLoading(false);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  const columns: GridColDef[] = [
    {
      field: "images",
      headerName: "",
      width: 70,
      sortable: false,
      renderCell: (params) => (
        <Box
          width={40}
          height={40}
          borderRadius={1}
          overflow="hidden"
          bgcolor="#e2e8f0"
        >
          {params.value?.[0] && (
            <img
              src={params.value[0]}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </Box>
      ),
    },
    {
      field: "id",
      headerName: "ID",
      width: 130,
      renderCell: (params) => (
        <Box
          display="flex"
          alignItems="center"
          gap={0.5}
          sx={{ cursor: "pointer" }}
          onClick={() => {
            navigator.clipboard.writeText(params.value);
            setCopied(true);
          }}
        >
          <Typography fontWeight={500} title={params.value}>
            {params.value.slice(0, 8)}
          </Typography>
          <Tooltip title="Copy ID">
            <ContentCopyIcon sx={{ fontSize: 16 }} />
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      minWidth: 220,
      renderCell: (params) => (
        <Typography noWrap title={params.value} fontSize={"0.7rem"}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "category",
      headerName: "Category",
      width: 140,
    },
    {
      field: "original_price",
      headerName: "Original",
      width: 120,
      renderCell: (params) => (
        <Typography
        //   sx={{
        //     textDecoration: params.row.discount > 0 ? "line-through" : "none",
        //   }}
        >
          ${params.value}
        </Typography>
      ),
    },
    {
      field: "price",
      headerName: "Price",
      width: 120,
      renderCell: (params) => (
        <Box flex={1}>
          <Typography fontWeight={600}>${params.value}</Typography>
          {/* {params.row.discount > 0 && (
            <Typography variant="caption" color="error" sx={{m:0, p:0}}>
              {params.row.discount}% off
            </Typography>
          )} */}
        </Box>
      ),
    },
    {
      field: "discount",
      headerName: "Discount",
      width: 80,
      renderCell: (params) => (params.value > 0 ? `${params.value}%` : "—"),
    },
    {
      field: "sold_count",
      headerName: "Sold",
      width: 80,
    },
    {
      field: "status",
      headerName: "Status",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex">
          {params.row.featured && (
            <Tooltip title="Featured">
              <StarIcon color="warning" sx={{ fontSize: 18, mr: 0.5 }} />
            </Tooltip>
          )}
          {params.row.in_stock && (
            <Tooltip title="In stock">
              <InventoryIcon color="success" sx={{ fontSize: 18, mr: 0.5 }} />
            </Tooltip>
          )}
          {params.row.on_sale && (
            <Tooltip title="On sale">
              <LoyaltyIcon color="error" sx={{ fontSize: 18 }} />
            </Tooltip>
          )}
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => navigate(`/products/${params.row.id}`)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box width="100%" minHeight="100vh" bgcolor="#f8fafc">
      {/* Header */}
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
            Products
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your product catalog
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Button variant="outlined" onClick={() => navigate("/products/new")}>
            Add Product
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Box px={{ xs: 2, sm: 4 }} py={4}>
        {/* Search */}
        <Box mb={3} maxWidth={360}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>

        {/* Data Grid */}
        <Box height={600}>
          <DataGrid
            rows={filtered}
            columns={columns}
            getRowId={(row) => row.id}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            disableRowSelectionOnClick
            sx={{
              backgroundColor: "#fff",
              borderRadius: 2,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f1f5f9",
                fontWeight: 600,
              },
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center", // vertically centers
              },
            }}
          />
        </Box>
      </Box>

      {/* Copy feedback */}
      <Snackbar
        open={copied}
        autoHideDuration={1500}
        onClose={() => setCopied(false)}
        message="Product ID copied"
      />
    </Box>
  );
}
