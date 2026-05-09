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
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import InventoryIcon from "@mui/icons-material/Inventory";
import LoyaltyIcon from "@mui/icons-material/Loyalty";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  DataGrid,
  type GridColDef,
  type GridRowSelectionModel,
} from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, type Product } from "../services/products";
import { deleteProduct } from "../services/productsCrud";

const calcDiscountFromPrices = (pre: number, price: number) =>
  pre ? Math.round(((pre - price) / pre) * 100) : 0;

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  // Single delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Multi-select & bulk delete state
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set(),
  });
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await getProducts({ limit: 500 }); // ← was 50, bump to 500 or whatever covers your catalog
    setProducts(data);
    setLoading(false);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.sub_category.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedIds: string[] =
    selectionModel.type === "include"
      ? Array.from(selectionModel.ids as Set<string>)
      : filtered
          .map((p) => p.id)
          .filter((id) => !(selectionModel.ids as Set<string>).has(id));

  // ── Single delete ──────────────────────────────────────────
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

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

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  // ── Bulk delete ────────────────────────────────────────────
  const handleBulkDeleteClick = () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    setBulkDeleting(true);
    const results = await Promise.all(
      selectedIds.map((id) => deleteProduct(id)),
    );
    setBulkDeleting(false);

    const failed = results.filter((r) => !r).length;
    if (failed > 0) {
      alert(`${failed} product(s) could not be deleted.`);
    }

    setSelectionModel({ type: "include", ids: new Set() });
    setBulkDeleteDialogOpen(false);
    loadProducts();
  };

  const cancelBulkDelete = () => {
    setBulkDeleteDialogOpen(false);
  };

  const selectedCount = selectedIds.length;
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
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
    { field: "name", headerName: "Name", flex: 1, minWidth: 160 },
    { field: "category", headerName: "Category", width: 150 },
    { field: "sub_category", headerName: "Sub Category", width: 150 },
    {
      field: "original_price",
      headerName: "Original",
      width: 80,
      renderCell: (params) => (
        <Typography sx={{ textAlign: "right", flex: 1 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "price",
      headerName: "Price",
      width: 140,
      renderCell: (params) => (
        <Box sx={{ flex: 1, justifyContent: "space-between", display: "flex" }}>
          {params.row.on_sale && (
            <Tooltip title="Pre-discount price">
              <Typography
                sx={{
                  flex: 1,
                  textAlign: "right",
                  textDecoration: "line-through",
                }}
              >
                {params.row.pre_discount_price}
              </Typography>
            </Tooltip>
          )}
          <Typography sx={{ flex: 1, textAlign: "right" }} fontWeight={600}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "discount",
      headerName: "Discount",
      width: 80,
      renderCell: (params) => (
        <Typography sx={{ flex: 1, textAlign: "right" }}>
          {params.row.on_sale
            ? `${calcDiscountFromPrices(params.row.pre_discount_price, params.row.price)}%`
            : "—"}
        </Typography>
      ),
    },
    {
      field: "sold_count",
      headerName: "Sold",
      width: 50,
      renderCell: (params) => (
        <Typography sx={{ flex: 1, textAlign: "right" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" width="100%">
          <Box
            sx={{
              flex: 1,
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {params.row.featured && (
              <Tooltip title="Featured">
                <StarIcon color="warning" />
              </Tooltip>
            )}
          </Box>
          <Box
            sx={{
              flex: 1,
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {params.row.in_stock && (
              <Tooltip title="In stock">
                <InventoryIcon color="success" />
              </Tooltip>
            )}
          </Box>
          <Box
            sx={{
              flex: 1,
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {params.row.on_sale && (
              <Tooltip title="On sale">
                <LoyaltyIcon color="error" />
              </Tooltip>
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" width="100%">
          <Box
            sx={{
              flex: 1,
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Tooltip title="Edit">
              <IconButton
                onClick={() => navigate(`/products/${params.row.id}`)}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Box
            sx={{
              flex: 1,
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Tooltip title="Delete">
              <IconButton onClick={() => handleDeleteClick(params.row)}>
                <DeleteIcon color="error" />
              </IconButton>
            </Tooltip>
          </Box>
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
          <Button
            variant="outlined"
            onClick={() => navigate("/products/bulk-import")}
          >
            Add Bulk
          </Button>
          <Button variant="outlined" onClick={loadProducts}>
            Refresh
          </Button>
          <Button variant="outlined" onClick={() => navigate("/dashboard")}>
            Back
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Box px={{ xs: 2, sm: 4 }} py={4}>
        {/* Search + Bulk action bar */}
        <Box mb={3} display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ maxWidth: 360, flex: 1 }}
          />

          {/* Bulk delete button — only visible when rows are selected */}
          {selectedCount > 0 && (
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={`${selectedCount} selected`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDeleteClick}
              >
                Delete Selected
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() =>
                  setSelectionModel({ type: "include", ids: new Set() })
                }
              >
                Clear
              </Button>
            </Box>
          )}
        </Box>

        {/* Data Grid */}
        <Box height={700}>
          <DataGrid
            rows={filtered}
            columns={columns}
            getRowId={(row) => row.id}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
            }}
            // ── Multi-select ──────────────────────────────────
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={selectionModel}
            onRowSelectionModelChange={(newModel) =>
              setSelectionModel(newModel)
            }
            // ─────────────────────────────────────────────────
            sx={{
              backgroundColor: "#fff",
              borderRadius: 2,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f1f5f9",
                fontWeight: 600,
              },
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center",
              },
            }}
          />
        </Box>
      </Box>

      {/* ── Single delete dialog ── */}
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

      {/* ── Bulk delete dialog ── */}
      <Dialog open={bulkDeleteDialogOpen} onClose={cancelBulkDelete}>
        <DialogTitle>Delete {selectedCount} Products</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>
              {selectedCount} product{selectedCount !== 1 ? "s" : ""}
            </strong>
            ? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelBulkDelete} disabled={bulkDeleting}>
            Cancel
          </Button>
          <Button
            color="error"
            onClick={confirmBulkDelete}
            disabled={bulkDeleting}
            startIcon={bulkDeleting && <CircularProgress size={16} />}
          >
            {bulkDeleting ? "Deleting..." : `Delete ${selectedCount}`}
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
