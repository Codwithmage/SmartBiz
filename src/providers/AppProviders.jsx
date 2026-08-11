import { NotificationProvider } from "../features/notifications/context/NotificationContext";
import { AuthProvider } from "../context/AuthContext";
import { BusinessProvider } from "../context/BusinessContext";
import { InventoryProvider } from "../features/inventory/context/InventoryContext";
import { SalesProvider } from "../features/sales/context/SalesContext";

export default function AppProviders({ children }) {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BusinessProvider>
          <InventoryProvider>
            <SalesProvider>
              {children}
            </SalesProvider>
          </InventoryProvider>
        </BusinessProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}