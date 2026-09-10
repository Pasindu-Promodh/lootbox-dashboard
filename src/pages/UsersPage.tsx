import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Tooltip,
  Snackbar,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { useAuth } from "../context/AuthContext";
import {
  fetchAdminUsers,
  updateAdminRole,
  removeAdminUser,
  inviteAdminUser,
} from "../services/adminUsers";
import { fetchCustomers } from "../services/customers";
import { ADMIN_ROLES, isSuperAdmin, type AdminUser } from "../types/adminUser";
import type { Customer } from "../types/customer";
import OrderDetailPage from "./OrderDetailPage";

const ROLE_COLORS: Record<string, "default" | "primary" | "error"> = {
  super_admin: "error",
  admin: "primary",
  viewer: "default",
};

export default function UsersPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [tab, setTab] = useState(0);
  const currentUserIsSuperAdmin = isSuperAdmin(role);

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
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage dashboard admins & customers
          </Typography>
        </Box>

        <Button variant="outlined" onClick={() => navigate("/dashboard")}>
          Back
        </Button>
      </Box>

      <Box px={{ xs: 2, sm: 4 }} pt={2} bgcolor="#fff" boxShadow="0 1px 8px rgba(0,0,0,0.05)">
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Admins" />
          <Tab label="Customers" />
        </Tabs>
      </Box>

      <Box px={{ xs: 2, sm: 4 }} py={4}>
        {tab === 0 && (
          <AdminsSection
            currentUserId={user?.id ?? null}
            isSuperAdmin={currentUserIsSuperAdmin}
          />
        )}
        {tab === 1 && <CustomersSection />}
      </Box>
    </Box>
  );
}

/* ==================== ADMINS ==================== */

function AdminsSection({
  currentUserId,
  isSuperAdmin,
}: {
  currentUserId: string | null;
  isSuperAdmin: boolean;
}) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setAdmins(data);
    } catch {
      setSnackbar("Failed to load admin users");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return admins.filter(
      (a) =>
        a.email.toLowerCase().includes(q) ||
        (a.role ?? "").toLowerCase().includes(q)
    );
  }, [admins, search]);

  const handleRoleChange = async (row: AdminUser, e: SelectChangeEvent) => {
    if (!isSuperAdmin) return;
    const newRole = e.target.value;
    const prev = row.role;

    // optimistic update
    setAdmins((list) =>
      list.map((a) => (a.user_id === row.user_id ? { ...a, role: newRole } : a))
    );

    try {
      await updateAdminRole(row.user_id, newRole);
      setSnackbar(`Role updated to "${newRole}" for ${row.email}`);
    } catch {
      setAdmins((list) =>
        list.map((a) => (a.user_id === row.user_id ? { ...a, role: prev } : a))
      );
      setSnackbar("Failed to update role");
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget || !isSuperAdmin) return;
    setRemoving(true);
    try {
      await removeAdminUser(removeTarget.user_id);
      setAdmins((list) => list.filter((a) => a.user_id !== removeTarget.user_id));
      setSnackbar(`Removed ${removeTarget.email}`);
    } catch {
      setSnackbar("Failed to remove admin user");
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError("Email is required");
      return;
    }
    setInviting(true);
    setInviteError(null);
    try {
      await inviteAdminUser(inviteEmail.trim(), inviteRole);
      setSnackbar(`Invite sent to ${inviteEmail.trim()}`);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("admin");
      load();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send invite";
      setInviteError(message);
    } finally {
      setInviting(false);
    }
  };

  const columns: GridColDef[] = [
    { field: "email", headerName: "Email", flex: 1, minWidth: 220 },
    {
      field: "role",
      headerName: "Role",
      width: 170,
      sortable: false,
      renderCell: (params) => {
        const disabled = params.row.user_id === currentUserId || !isSuperAdmin;
        const select = (
          <Select
            size="small"
            value={ADMIN_ROLES.includes(params.value) ? params.value : "admin"}
            onChange={(e) => handleRoleChange(params.row as AdminUser, e)}
            disabled={disabled}
            sx={{ minWidth: 130 }}
          >
            {ADMIN_ROLES.map((role) => (
              <MenuItem key={role} value={role}>
                <Chip
                  size="small"
                  label={role}
                  color={ROLE_COLORS[role] ?? "default"}
                  sx={{ pointerEvents: "none" }}
                />
              </MenuItem>
            ))}
          </Select>
        );
        if (!isSuperAdmin) {
          return (
            <Tooltip title="Only super admins can change roles">
              <span>{select}</span>
            </Tooltip>
          );
        }
        return select;
      },
    },
    {
      field: "created_at",
      headerName: "Added",
      width: 160,
      renderCell: (params) =>
        new Date(params.value).toLocaleString(undefined, {
          timeStyle: "short",
          dateStyle: "short",
        }),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 90,
      sortable: false,
      renderCell: (params) => {
        const isSelf = params.row.user_id === currentUserId;
        const disabled = isSelf || !isSuperAdmin;
        const title = isSelf
          ? "You can't remove your own account"
          : !isSuperAdmin
            ? "Only super admins can remove access"
            : "Remove access";
        return (
          <Tooltip title={title}>
            <span>
              <IconButton
                size="small"
                color="error"
                disabled={disabled}
                onClick={() => setRemoveTarget(params.row as AdminUser)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <>
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
            placeholder="Search by email or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={load}>
            Refresh
          </Button>
          <Tooltip title={isSuperAdmin ? "" : "Only super admins can invite admins"}>
            <span>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                disabled={!isSuperAdmin}
                onClick={() => setInviteOpen(true)}
              >
                Invite Admin
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Box height={600}>
        <DataGrid
          rows={filtered}
          columns={columns}
          getRowId={(row) => row.user_id}
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

      {/* INVITE DIALOG */}
      <Dialog open={inviteOpen} onClose={() => !inviting && setInviteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Invite Admin</DialogTitle>
        <DialogContent>
          <DialogContentText mb={2}>
            If they've already signed in with Google, they're added straight
            away. Otherwise a placeholder account is created and linked
            automatically the first time they sign in with Google using this
            email.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Select
            fullWidth
            size="small"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          >
            {ADMIN_ROLES.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </Select>
          {inviteError && (
            <Typography color="error" variant="body2" mt={1.5}>
              {inviteError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)} disabled={inviting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleInvite} disabled={inviting}>
            {inviting ? "Sending…" : "Send Invite"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* REMOVE CONFIRM DIALOG */}
      <Dialog open={Boolean(removeTarget)} onClose={() => !removing && setRemoveTarget(null)}>
        <DialogTitle>Remove {removeTarget?.email}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This revokes their dashboard access immediately. Their Supabase Auth
            account itself is not deleted, only their <code>admin_users</code> entry.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveTarget(null)} disabled={removing}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmRemove} disabled={removing}>
            {removing ? "Removing…" : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={2500}
        onClose={() => setSnackbar(null)}
        message={snackbar}
      />
    </>
  );
}

/* ==================== CUSTOMERS ==================== */

function CustomersSection() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ordersDialogFor, setOrdersDialogFor] = useState<Customer | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch {
      setSnackbar("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.customer_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone1?.includes(search) ||
        c.district?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const columns: GridColDef[] = [
    {
      field: "customer_name",
      headerName: "Customer",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography noWrap>{params.value}</Typography>
          {params.row.is_guest && (
            <Chip label="Guest" size="small" variant="outlined" />
          )}
        </Box>
      ),
    },
    { field: "email", headerName: "Email", width: 200, valueGetter: (v) => v || "—" },
    { field: "phone1", headerName: "Phone", width: 140, valueGetter: (v) => v || "—" },
    { field: "district", headerName: "District", width: 130, valueGetter: (v) => v || "—" },
    { field: "orders_count", headerName: "Orders", width: 90, type: "number" },
    {
      field: "total_spent",
      headerName: "Total Spent",
      width: 130,
      renderCell: (params) => (
        <Typography fontWeight={600} sx={{ textAlign: "right", flex: 1 }}>
          {params.value.toFixed(2)}
        </Typography>
      ),
    },
    {
      field: "last_order_at",
      headerName: "Last Order",
      width: 160,
      renderCell: (params) =>
        params.value
          ? new Date(params.value).toLocaleString(undefined, {
              timeStyle: "short",
              dateStyle: "short",
            })
          : "—",
    },
    {
      field: "actions",
      headerName: "Orders",
      width: 90,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title={params.row.orders_count ? "View orders" : "No orders yet"}>
          <span>
            <IconButton
              size="small"
              disabled={!params.row.orders_count}
              onClick={() => setOrdersDialogFor(params.row as Customer)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
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
            placeholder="Search by name, email, phone or district…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <Button variant="outlined" onClick={load}>
          Refresh
        </Button>
      </Box>

      <Box height={600}>
        <DataGrid
          rows={filtered}
          columns={columns}
          getRowId={(row) => row.key}
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

      {/* CUSTOMER'S ORDERS DIALOG */}
      <Dialog
        open={Boolean(ordersDialogFor)}
        onClose={() => setOrdersDialogFor(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Orders — {ordersDialogFor?.customer_name}</DialogTitle>
        <DialogContent dividers>
          {ordersDialogFor?.order_ids.map((id) => (
            <Box
              key={id}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              py={1}
              sx={{ borderBottom: "1px solid #eee", cursor: "pointer" }}
              onClick={() => setSelectedOrderId(id)}
            >
              <Typography variant="body2" title={id}>
                {id.slice(0, 8)}…
              </Typography>
              <VisibilityIcon fontSize="small" />
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrdersDialogFor(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* FULLSCREEN ORDER DETAIL */}
      {selectedOrderId && (
        <OrderDetailPage
          open={Boolean(selectedOrderId)}
          onClose={() => setSelectedOrderId(null)}
          orderId={selectedOrderId}
        />
      )}

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={2500}
        onClose={() => setSnackbar(null)}
        message={snackbar}
      />
    </>
  );
}
