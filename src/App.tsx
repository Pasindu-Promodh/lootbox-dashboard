// import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider, useAuth } from "./context/AuthContext";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import type { JSX } from "react";
// import ProductsPage from "./pages/ProductsPage";
// import ProductFormPage from "./pages/ProductFormPage";
// import { CategoriesProvider } from "./context/CategoriesContext";
// import OrdersPage from "./pages/OrdersPage";
// import Finance from "./pages/Finance";

// const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
//   const { user, loading } = useAuth();

//   if (loading) return null;
//   if (!user) return <Navigate to="/login" />;

//   return children;
// };

// export default function App() {
//   return (
//     <AuthProvider>
//       <CategoriesProvider>
//         <HashRouter>
//           <Routes>
//             <Route path="/login" element={<Login />} />
//             <Route
//               path="/dashboard"
//               element={
//                 <ProtectedRoute>
//                   <Dashboard />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/products"
//               element={
//                 <ProtectedRoute>
//                   <ProductsPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/products/new"
//               element={
//                 <ProtectedRoute>
//                   <ProductFormPage />
//                 </ProtectedRoute>
//               }
//             />

//             <Route
//               path="/products/:id"
//               element={
//                 <ProtectedRoute>
//                   <ProductFormPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/orders"
//               element={
//                 <ProtectedRoute>
//                   <OrdersPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/finance"
//               element={
//                 <ProtectedRoute>
//                   <Finance />
//                 </ProtectedRoute>
//               }
//             />
//           </Routes>
//         </HashRouter>
//       </CategoriesProvider>
//     </AuthProvider>
//   );
// }


import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProductsPage from "./pages/ProductsPage";
import ProductFormPage from "./pages/ProductFormPage";
import OrdersPage from "./pages/OrdersPage";
import Finance from "./pages/Finance";
import { CategoriesProvider } from "./context/CategoriesContext";
import type { JSX } from "react";

/* ---------- Protected Route ---------- */
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // Or a spinner

  if (!user) return <Navigate to="/login" />; // Show dashboard login

  return children;
};

/* ---------- Public Route (Login) ---------- */
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <CategoriesProvider>
        <HashRouter>
          <Routes>
            {/* Default */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Auth */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Products */}
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/new"
              element={
                <ProtectedRoute>
                  <ProductFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:id"
              element={
                <ProtectedRoute>
                  <ProductFormPage />
                </ProtectedRoute>
              }
            />

            {/* Orders */}
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />

            {/* Finance */}
            <Route
              path="/finance"
              element={
                <ProtectedRoute>
                  <Finance />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </HashRouter>
      </CategoriesProvider>
    </AuthProvider>
  );
}
