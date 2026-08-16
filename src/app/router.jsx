import { createBrowserRouter, Navigate } from "react-router-dom";

// Auth & Business
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import ForgotPassword from "../features/auth/pages/ForgotPassword";
import Dashboard from "../features/dashboard/pages/Dashboard";
import CreateBusiness from "../features/business/pages/CreateBusiness";
import AppEntry from "../features/app/pages/AppEntry";

// Inventory, Services & Categories
import InventoryOverview from "../features/inventory/pages/InventoryOverview";
import InventoryProducts from "../features/inventory/pages/InventoryProducts";
import ServicesPage from "../features/inventory/pages/ServicesPage";
import AddProduct from "../features/inventory/pages/AddProduct";
import CategoriesPage from "../features/categories/pages/CategoriesPage";
import AddCategoryPage from "../features/categories/pages/AddCategoryPage";

// Context Providers
import { CategoryProvider } from "../context/CategoryContext";

// Sales & Expenses
import SalesPage from "../features/sales/pages/SalesPage";
import ExpensesPage from "../features/expenses/pages/ExpensesPage";

// Reports
import ReportsPage from "../features/reports/pages/ReportsPage";

// Settings
import SettingsPage from "../features/settings/SettingsPage";

// Guards & Layout
import ProtectedRoute from "../components/guards/ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";

// Import TeamPage
import TeamPage from "../features/teams/pages/TeamPage";

const router = createBrowserRouter([
  // Public Auth Routes
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },

  // Onboarding & Entry Routes
  {
    path: "/app",
    element: (
      <ProtectedRoute allowNoBusiness>
        <AppEntry />
      </ProtectedRoute>
    ),
  },
  {
    path: "/create-business",
    element: (
      <ProtectedRoute allowNoBusiness>
        <CreateBusiness />
      </ProtectedRoute>
    ),
  },

  // Main App Routes (Base Authentication Guard)
  {
    element: (
      <ProtectedRoute>
        <CategoryProvider>
          <AppLayout />
        </CategoryProvider>
      </ProtectedRoute>
    ),
    children: [
      // ALL ROLES (Owner, Manager, Cashier)
      {
        path: "/sales",
        element: (
          <ProtectedRoute allowedRoles={["OWNER", "MANAGER", "CASHIER"]}>
            <SalesPage />
          </ProtectedRoute>
        ),
      },

      // INVENTORY ROUTES — OWNER, MANAGER, CASHIER
      {
        path: "/inventory",
        element: (
          <ProtectedRoute allowedRoles={["OWNER", "MANAGER", "CASHIER"]} fallbackPath="/sales">
            <InventoryOverview />
          </ProtectedRoute>
        ),
      },
      {
        path: "/inventory/products",
        element: (
          <ProtectedRoute allowedRoles={["OWNER", "MANAGER", "CASHIER"]} fallbackPath="/sales">
            <InventoryProducts />
          </ProtectedRoute>
        ),
      },
      {
        path: "/inventory/services",
        element: (
          <ProtectedRoute allowedRoles={["OWNER", "MANAGER", "CASHIER"]} fallbackPath="/sales">
            <ServicesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/inventory/add",
        element: (
          <ProtectedRoute allowedRoles={["OWNER", "MANAGER", "CASHIER"]} fallbackPath="/sales">
            <AddProduct />
          </ProtectedRoute>
        ),
      },
      {
        path: "/inventory/categories",
        element: (
          <ProtectedRoute allowedRoles={["OWNER", "MANAGER", "CASHIER"]} fallbackPath="/sales">
            <CategoriesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/inventory/categories/new",
        element: (
          <ProtectedRoute allowedRoles={["OWNER", "MANAGER", "CASHIER"]} fallbackPath="/sales">
            <AddCategoryPage />
          </ProtectedRoute>
        ),
      },

      // EXPENSES ROUTE — OWNER, MANAGER, CASHIER
      {
        path: "/expenses",
        element: (
          <ProtectedRoute allowedRoles={["OWNER", "MANAGER", "CASHIER"]} fallbackPath="/sales">
            <ExpensesPage />
          </ProtectedRoute>
        ),
      },

      // MANAGER & OWNER ONLY
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute allowedRoles={["OWNER", "MANAGER"]} fallbackPath="/sales">
            <Dashboard />
          </ProtectedRoute>
        ),
      },

      // OWNER ONLY
      {
        path: "/reports",
        element: (
          <ProtectedRoute allowedRoles={["OWNER"]} fallbackPath="/sales">
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/team",
        element: (
          <ProtectedRoute allowedRoles={["OWNER"]} fallbackPath="/sales">
            <TeamPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings",
        element: (
          <ProtectedRoute allowedRoles={["OWNER"]} fallbackPath="/sales">
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // Fallback Route
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default router;