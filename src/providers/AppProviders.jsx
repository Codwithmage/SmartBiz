import { NotificationProvider } from "../features/notifications/context/NotificationContext";
import { AuthProvider } from "../context/AuthContext";
import { BusinessProvider } from "../context/BusinessContext";
import { InventoryProvider } from "../features/inventory/context/InventoryContext";
import { CategoryProvider } from "../context/CategoryContext";
import { ServicesProvider } from "../features/services/context/ServicesContext"; // <-- 1. ADD THIS IMPORT
import { SalesProvider } from "../features/sales/context/SalesContext";

export default function AppProviders({ children }) {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BusinessProvider>
          <InventoryProvider>
            <CategoryProvider>
              <ServicesProvider> {/* <-- 2. WRAP HERE */}
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