// import {
//   Box,
//   Typography,
//   Card,
//   CardContent,
//   Divider,
//   Button,
// } from "@mui/material";
// import PaidIcon from "@mui/icons-material/Paid";
// import TrendingUpIcon from "@mui/icons-material/TrendingUp";
// import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
// import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
// import { useNavigate } from "react-router-dom";

// const kpis = [
//   {
//     label: "Total Revenue",
//     value: "Rs. 245,000",
//     icon: PaidIcon,
//     color: "#22c55e",
//   },
//   {
//     label: "Net Profit",
//     value: "Rs. 78,400",
//     icon: TrendingUpIcon,
//     color: "#16a34a",
//   },
//   {
//     label: "Orders",
//     value: "1,284",
//     icon: ShoppingCartIcon,
//     color: "#0ea5e9",
//   },
//   {
//     label: "Expenses",
//     value: "Rs. 166,600",
//     icon: ReceiptLongIcon,
//     color: "#f97316",
//   },
// ];

// export default function Finance() {
//   const navigate = useNavigate();

//   return (
//     <Box width="100%" minHeight="100vh" bgcolor="#f8fafc">
//       {/* Header */}
//       <Box
//         px={{ xs: 2, sm: 4 }}
//         py={2}
//         display="flex"
//         justifyContent="space-between"
//         alignItems="center"
//         bgcolor="#fff"
//         boxShadow="0 1px 8px rgba(0,0,0,0.05)"
//       >
//         <Box>
//           <Typography fontSize={20} fontWeight={600}>
//             Finance
//           </Typography>
//           <Typography variant="body2" color="text.secondary">
//             Monitor revenue, profit and expenses
//           </Typography>
//         </Box>

//         <Box display="flex" gap={2}>
//           <Button variant="outlined">Refresh</Button>
//           <Button variant="outlined" onClick={() => navigate("/dashboard")}>
//             Back
//           </Button>
//         </Box>
//       </Box>

//       {/* Page Content */}
//       <Box px={{ xs: 2, sm: 4 }} py={4}>
//         {/* KPI Cards */}
//         <Box
//           display="grid"
//           gridTemplateColumns={{
//             xs: "1fr",
//             sm: "repeat(2, 1fr)",
//             md: "repeat(4, 1fr)",
//           }}
//           gap={3}
//         >
//           {kpis.map((kpi) => {
//             const Icon = kpi.icon;

//             return (
//               <Card
//                 key={kpi.label}
//                 sx={{
//                   borderRadius: 3,
//                   transition: "all 0.25s ease",
//                   boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
//                   "&:hover": {
//                     transform: "translateY(-4px)",
//                     boxShadow: "0 14px 32px rgba(0,0,0,0.12)",
//                   },
//                 }}
//               >
//                 <CardContent>
//                   <Box
//                     display="flex"
//                     alignItems="center"
//                     justifyContent="space-between"
//                   >
//                     <Box>
//                       <Typography variant="body2" color="text.secondary">
//                         {kpi.label}
//                       </Typography>
//                       <Typography fontSize={22} fontWeight={600}>
//                         {kpi.value}
//                       </Typography>
//                     </Box>

//                     <Box
//                       width={48}
//                       height={48}
//                       borderRadius={2}
//                       display="flex"
//                       alignItems="center"
//                       justifyContent="center"
//                       bgcolor={kpi.color}
//                       color="#fff"
//                     >
//                       <Icon />
//                     </Box>
//                   </Box>
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </Box>

//         {/* Breakdown */}
//         <Box mt={5}>
//           <Divider sx={{ mb: 3 }} />

//           <Typography fontSize={18} fontWeight={600} mb={1}>
//             Financial Breakdown
//           </Typography>
//           <Typography color="text.secondary">
//             Charts and detailed reports will appear here.
//           </Typography>
//         </Box>
//       </Box>
//     </Box>
//   );
// }

import { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, Divider, Button, CircularProgress } from "@mui/material";
import PaidIcon from "@mui/icons-material/Paid";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useNavigate } from "react-router-dom";
import { fetchOrdersByFinanceBuckets } from "../services/orders";

export default function Finance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const buckets = await fetchOrdersByFinanceBuckets();

        const getRevenue = (arr: any[]) => arr.reduce((sum, o) => sum + o.total, 0);
        const getProfit = (arr: any[]) => arr.reduce((sum, o) => sum + o.profit, 0);

        setKpis([
          {
            label: "Pending Orders",
            orders: buckets.pendingOrders.length,
            revenue: getRevenue(buckets.pendingOrders),
            profit: getProfit(buckets.pendingOrders),
            icon: ShoppingCartIcon,
            color: "#f59e0b",
          },
          {
            label: "To Receive",
            orders: buckets.toReceive.length,
            revenue: getRevenue(buckets.toReceive),
            profit: getProfit(buckets.toReceive),
            icon: PaidIcon,
            color: "#22c55e",
          },
          {
            label: "Submitted Payments",
            orders: buckets.submitted.length,
            revenue: getRevenue(buckets.submitted),
            profit: getProfit(buckets.submitted),
            icon: ReceiptLongIcon,
            color: "#0ea5e9",
          },
          {
            label: "Completed Orders",
            orders: buckets.completed.length,
            revenue: getRevenue(buckets.completed),
            profit: getProfit(buckets.completed),
            icon: TrendingUpIcon,
            color: "#16a34a",
          },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

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
            Finance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor orders, revenue, and profit by status
          </Typography>
        </Box>

        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Refresh
          </Button>
          <Button variant="outlined" onClick={() => navigate("/dashboard")}>
            Back
          </Button>
        </Box>
      </Box>

      {/* Page Content */}
      <Box px={{ xs: 2, sm: 4 }} py={4}>
        {loading ? (
          <Box display="flex" justifyContent="center" mt={10}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* KPI Cards */}
            <Box
              display="grid"
              gridTemplateColumns={{ xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(4,1fr)" }}
              gap={3}
            >
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <Card
                    key={kpi.label}
                    sx={{
                      borderRadius: 3,
                      transition: "all 0.25s ease",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 14px 32px rgba(0,0,0,0.12)",
                      },
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {kpi.label}
                          </Typography>
                          <Typography fontSize={18} fontWeight={600}>
                            Orders: {kpi.orders}
                          </Typography>
                          <Typography fontSize={16} color="text.secondary">
                            Revenue: Rs. {kpi.revenue.toLocaleString()}
                          </Typography>
                          <Typography fontSize={16} color="text.secondary">
                            Profit: Rs. {kpi.profit.toLocaleString()}
                          </Typography>
                        </Box>

                        <Box
                          width={48}
                          height={48}
                          borderRadius={2}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          bgcolor={kpi.color}
                          color="#fff"
                        >
                          <Icon />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>

            {/* Breakdown */}
            <Box mt={5}>
              <Divider sx={{ mb: 3 }} />
              <Typography fontSize={18} fontWeight={600} mb={1}>
                Financial Breakdown
              </Typography>
              <Typography color="text.secondary">
                Charts and detailed reports will appear here.
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
