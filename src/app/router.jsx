import { createBrowserRouter } from "react-router-dom";

// Auth & Business
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import ForgotPassword from "../features/auth/pages/ForgotPassword";
import Dashboard from "../features/dashboard/pages/Dashboard";
import CreateBusiness from "../features/business/pages/CreateBusiness";
import AppEntry from "../features/app/pages/AppEntry";

// Inventory & Categories
import InventoryProducts from "../features/inventory/pages/InventoryProducts";
import AddProduct from "../features/inventory/pages/AddProduct";
import CategoriesPage from "../features/categories/pages/CategoriesPage";
import AddCategoryPage from "../features/categories/pages/AddCategoryPage";
import InventoryOverview from "../features/inventory/pages/InventoryOverview";

// Context Providers
import { CategoryProvider } from "../context/CategoryContext"; // <-- Adjust path if stored in context or features

// Sales & Expenses
import SalesPage from "../features/sales/pages/SalesPage";
import ExpensesPage from "../features/expenses/pages/ExpensesPage";

// Reports
import ReportsPage from "../features/reports/pages/ReportsPage";

// Guards & Layout
import ProtectedRoute from "../components/guards/ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";

const router = createBrowserRouter([
  // Public Auth Routes
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },

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

  // Main Dashboard Routes (Requires Business + Uses AppLayout + CategoryProvider)
  {
    element: (
      <ProtectedRoute>
        <CategoryProvider>
          <AppLayout />
        </CategoryProvider>
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/inventory/products",
        element: <InventoryProducts />,
      },
      {
        path: "/inventory/add",
        element: <AddProduct />,
      },
      {
        path: "/inventory/categories",
        element: <CategoriesPage />,
      },
      {
        path: "/inventory/categories/new",
        element: <AddCategoryPage />,
      },
      {
        path: "/inventory",
        element: <InventoryOverview />,
      },
      {
        path: "/sales",
        element: <SalesPage />,
      },
      {
        path: "/expenses",
        element: <ExpensesPage />,
      },
      {
        path: "/reports",
        element: <ReportsPage />,
      },
    ],
  },

  // Fallback Route
  {
    path: "*",
    element: <Login />,
  },
]);

export default router;