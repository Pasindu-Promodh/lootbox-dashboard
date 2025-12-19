import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Button,
  Avatar,
  Divider,
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PeopleIcon from "@mui/icons-material/People";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const tiles = [
  {
    title: "Products",
    description: "Manage products & categories",
    icon: Inventory2Icon,
    color: "#4f46e5",
    path: "/products",
  },
  {
    title: "Orders",
    description: "View and update orders",
    icon: ShoppingCartIcon,
    color: "#0ea5e9",
    path: "/orders",
  },
  {
    title: "Users",
    description: "User & role management",
    icon: PeopleIcon,
    color: "#22c55e",
    path: "/users",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <Box minHeight="100vh" bgcolor="#f8fafc" width="100%">
      {/* Header */}
      <Box
        width="100%"
        px={{ xs: 2, sm: 4 }}
        py={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bgcolor="#ffffff"
        boxShadow="0 1px 8px rgba(0,0,0,0.05)"
      >
        <Box>
          <Typography fontWeight={600} fontSize={20}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your store
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={user?.user_metadata?.avatar_url} />
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Box
        width="100%"
        px={{ xs: 2, sm: 4 }}
        py={4}
      >
        <Typography variant="h6" mb={2}>
          Quick Actions
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Box display="flex" flexWrap="wrap" gap={3}>
          {tiles.map((tile) => {
            const Icon = tile.icon;

            return (
              <Box
                key={tile.title}
                sx={{
                  width: {
                    xs: "100%",
                    sm: "calc(50% - 12px)",
                    md: "calc(33.333% - 16px)",
                    lg: "calc(25% - 18px)",
                  },
                }}
              >
                <Card
                  sx={{
                    height: 160,
                    borderRadius: 3,
                    transition: "all 0.25s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
                    },
                  }}
                >
                  <CardActionArea
                    sx={{ height: "100%", p: 2 }}
                    onClick={() => navigate(tile.path)}
                  >
                    <CardContent sx={{ p: 0 }}>
                      <Box
                        width={48}
                        height={48}
                        borderRadius={2}
                        mb={2}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bgcolor={tile.color}
                        color="#fff"
                      >
                        <Icon />
                      </Box>

                      <Typography fontWeight={600}>
                        {tile.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {tile.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
