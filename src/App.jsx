import { RouterProvider } from "react-router-dom";
import router from "./routes/router"; // Update path if your router file is located elsewhere

import { AuthProvider } from "./features/auth/context/AuthContext";
import { BusinessProvider } from "./context/BusinessContext";
import { InventoryProvider } from "./features/inventory/context/InventoryContext";
import { SalesProvider } from "./features/sales/context/SalesContext";

function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <InventoryProvider>
          <SalesProvider>
            <RouterProvider router={router} />
          </SalesProvider>
        </InventoryProvider>
      </BusinessProvider>
    </AuthProvider>
  );
}

export default App;