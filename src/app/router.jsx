import { createBrowserRouter } from "react-router-dom";

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
import ServicesPage from "../features/inventory/pages/ServicesPage"; // <-- ADDED
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

  // Main Dashboard Routes
  {
    element: (
      <ProtectedRoute>
        <CategoryProvider>
          <AppLayout />
        </CategoryProvider>
      </ProtectedRoute>
    ),
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      
      // Inventory & Services Sub-routes
      { path: "/inventory", element: <InventoryOverview /> },
      { path: "/inventory/products", element: <InventoryProducts /> },
      { path: "/inventory/services", element: <ServicesPage /> }, // <-- ADDED
      { path: "/inventory/add", element: <AddProduct /> },
      { path: "/inventory/categories", element: <CategoriesPage /> },
      { path: "/inventory/categories/new", element: <AddCategoryPage /> },

      // Sales, Expenses & Reports
      { path: "/sales", element: <SalesPage /> },
      { path: "/expenses", element: <ExpensesPage /> },
      { path: "/reports", element: <ReportsPage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },

  // Fallback Route
  { path: "*", element: <Login /> },
]);

export default router;