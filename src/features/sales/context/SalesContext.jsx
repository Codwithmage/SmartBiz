import { createContext, useContext, useState, useCallback } from "react";
import { 
  getSales, 
  createSale as createSaleService, 
  updateSaleStatus as updateSaleStatusService 
} from "../services/saleService";
import { offlineDb } from "../../../db/offlineDb";

const SalesContext = createContext(null);

export function SalesProvider({ children }) {
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);

  // Load sales with IndexedDB fallback for offline mode
  const loadSales = useCallback(async (businessId) => {
    if (!businessId) {
      setSales([]);
      return [];
    }

    setLoadingSales(true);

    // 1. OFFLINE: Load strictly from local Dexie database
    if (!navigator.onLine) {
      try {
        const allLocalSales = await offlineDb.sales.toArray();
        const localSales = allLocalSales.filter(
          (s) => String(s.business_id) === String(businessId)
        );
        setSales(localSales || []);
        return localSales || [];
      } catch (err) {
        console.error("Failed to read offline sales from Dexie:", err);
      } finally {
        setLoadingSales(false);
      }
    }

    // 2. ONLINE: Fetch directly from Supabase (without re-populating Dexie with synced: 1)
    const { data, error } = await getSales(businessId);

    if (error) {
      console.error("Failed to load online sales, falling back to Dexie:", error);
      const allLocalSales = await offlineDb.sales.toArray();
      const localSales = allLocalSales.filter(
        (s) => String(s.business_id) === String(businessId)
      );
      setSales(localSales || []);
      setLoadingSales(false);
      return localSales || [];
    }

    setSales(data || []);
    setLoadingSales(false);
    return data || [];
  }, []);

  // Add sale (Online direct insert vs Offline Dexie save)
  const addSale = useCallback(async (salePayload) => {
    // OFFLINE: Save to local Dexie with synced: 0
    if (!navigator.onLine) {
      const offlineSale = {
        ...salePayload,
        id: `offline_${Date.now()}`,
        created_at: new Date().toISOString(),
        synced: 0, // Picked up and uploaded by useNetworkSync when online
      };

      await offlineDb.sales.add(offlineSale);
      setSales((prev) => [offlineSale, ...prev]);
      return { data: offlineSale, error: null };
    }

    // ONLINE: Send directly to Supabase
    const { data, error } = await createSaleService(salePayload);

    if (!error && data) {
      await loadSales(salePayload.business_id);
    }

    return { data, error };
  }, [loadSales]);

  // Update payment status (optimistic local update + remote update)
  const updatePaymentStatus = useCallback(
    async (saleId, amountPaid, newStatus = "paid", businessId) => {
      if (!navigator.onLine) {
        await offlineDb.sales.update(saleId, {
          amount_paid: amountPaid,
          payment_status: newStatus,
          synced: 0,
        });

        setSales((prevSales) =>
          prevSales.map((sale) =>
            sale.id === saleId
              ? { ...sale, amount_paid: amountPaid, payment_status: newStatus, synced: 0 }
              : sale
          )
        );

        return { data: { id: saleId, amount_paid: amountPaid, payment_status: newStatus }, error: null };
      }

      const { data, error } = await updateSaleStatusService(saleId, amountPaid, newStatus);

      if (!error) {
        setSales((prevSales) =>
          prevSales.map((sale) =>
            sale.id === saleId
              ? { ...sale, amount_paid: amountPaid, payment_status: newStatus }
              : sale
          )
        );
        if (businessId) await loadSales(businessId);
      }

      return { data, error };
    },
    [loadSales]
  );

  return (
    <SalesContext.Provider
      value={{
        sales,
        loadingSales,
        loadSales,
        addSale,
        updatePaymentStatus,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error("useSales must be used within a SalesProvider.");
  }
  return context;
}