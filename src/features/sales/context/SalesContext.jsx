import { createContext, useContext, useState, useCallback } from "react";
import { 
  getSales, 
  createSale as createSaleService, 
  updateSaleStatus as updateSaleStatusService 
} from "../services/saleService";

const SalesContext = createContext(null);

export function SalesProvider({ children }) {
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);

  const loadSales = useCallback(async (businessId) => {
    if (!businessId) {
      setSales([]);
      return [];
    }

    setLoadingSales(true);
    const { data, error } = await getSales(businessId);

    if (error) {
      console.error("Failed to load sales:", error);
      setSales([]);
      setLoadingSales(false);
      return [];
    }

    setSales(data || []);
    setLoadingSales(false);
    return data || [];
  }, []);

  const addSale = useCallback(async (salePayload) => {
    const { data, error } = await createSaleService(salePayload);

    if (!error && data) {
      await loadSales(salePayload.business_id);
    }

    return { data, error };
  }, [loadSales]);

  const updatePaymentStatus = useCallback(
    async (saleId, amountPaid, newStatus = "paid", businessId) => {
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