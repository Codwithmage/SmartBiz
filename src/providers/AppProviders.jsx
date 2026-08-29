import { NotificationProvider } from "../features/notifications/context/NotificationContext";
import { AuthProvider } from "../context/AuthContext";
import { BusinessProvider } from "../context/BusinessContext";
import { InventoryProvider } from "../features/inventory/context/InventoryContext";
import { CategoryProvider } from "../context/CategoryContext";
import { ServicesProvider } from "../features/services/context/ServicesContext";
import { SalesProvider } from "../features/sales/context/SalesContext";
import { useNetworkSync } from "../hooks/useNetworkSync";

export default function AppProviders({ children }) {
  useNetworkSync();

  return (
    <NotificationProvider>
      <AuthProvider>
        <BusinessProvider>
          <InventoryProvider>
            <CategoryProvider>
              <ServicesProvider>
                <SalesProvider>
                  {children}
                </SalesProvider>
              </ServicesProvider>
            </CategoryProvider>
          </InventoryProvider>
        </BusinessProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}