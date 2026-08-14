import { RouterProvider } from "react-router-dom";
import router from "./routes/router";

import { AuthProvider } from "./features/auth/context/AuthContext";
import { BusinessProvider } from "./context/BusinessContext";
import { InventoryProvider } from "./features/inventory/context/InventoryContext";
import { ServicesProvider } from "./features/services/context/ServicesContext"; // <-- 1. ADD THIS IMPORT
import { SalesProvider } from "./features/sales/context/SalesContext";

function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <InventoryProvider>
          <ServicesProvider> {/* <-- 2. WRAP AROUND SALESPROVIDER */}
            <SalesProvider>
              <RouterProvider router={router} />
            </SalesProvider>
          </ServicesProvider>
        </InventoryProvider>
      </BusinessProvider>
    </AuthProvider>
  );
}

export default App;