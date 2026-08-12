import { NotificationProvider } from "../features/notifications/context/NotificationContext";
import { AuthProvider } from "../context/AuthContext";
import { BusinessProvider } from "../context/BusinessContext";
import { InventoryProvider } from "../features/inventory/context/InventoryContext";
import { CategoryProvider } from "../context/CategoryContext"; // <-- Import CategoryProvider
import { SalesProvider } from "../features/sales/context/SalesContext";

export default function AppProviders({ children }) {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BusinessProvider>
          <InventoryProvider>
            <CategoryProvider>
              <SalesProvider>
                {children}
              </SalesProvider>
            </CategoryProvider>
          </InventoryProvider>
        </BusinessProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}