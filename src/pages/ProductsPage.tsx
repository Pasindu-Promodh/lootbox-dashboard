import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
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
import { deleteProduct } from "../services/productsCrud";

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  // Open delete dialog
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    const success = await deleteProduct(productToDelete.id);
    setDeleting(false);

    if (success) {
      loadProducts();
    } else {
      alert("Failed to delete product");
    }

    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const columns: GridColDef[] = [
    {
      field: "images",
      headerName: "",
      width: 70,
      sortable: false,
      renderCell: (params) => {
        const img = params.value?.[0]?.thumb || params.value?.[0]?.main;

        return (
          <Box
            width={40}
            height={40}
            borderRadius={1}
            overflow="hidden"
            bgcolor="#e2e8f0"
          >
            {img && (
              <img
                src={img}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </Box>
        );
      },
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
    // {
    //   field: "description",
    //   headerName: "Description",
    //   flex: 2,
    //   minWidth: 220,
    //   renderCell: (params) => (
    //     <Typography noWrap title={params.value} fontSize={"0.7rem"}>
    //       {params.value}
    //     </Typography>
    //   ),
    // },
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
          sx={{ textAlign: "right", flex: 1 }}
          //   sx={{
          //     textDecoration: params.row.discount > 0 ? "line-through" : "none",
          //   }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "price",
      headerName: "Price",
      width: 120,
      renderCell: (params) => (
        <Typography sx={{ flex: 1, textAlign: "right" }} fontWeight={600}>
          {params.value}
        </Typography>
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
        <Box sx={{ flex: 1, justifyContent: "space-between" }}>
          <IconButton
            size="large"
            sx={{ flex: 1 }}
            onClick={() => navigate(`/products/${params.row.id}`)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="medium"
            sx={{ flex: 1 }}
            color="error"
            onClick={() => handleDeleteClick(params.row)}
          >
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
          <Button variant="outlined" onClick={loadProducts}>
            Refresh
          </Button>
          <Button variant="outlined" onClick={() => navigate("/")}>
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{productToDelete?.name}</strong>? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            onClick={confirmDelete}
            disabled={deleting}
            startIcon={deleting && <CircularProgress size={16} />}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

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
