import { createContext, useContext, useState, useCallback } from "react";
import { getSales, createSale as createSaleService } from "../services/saleService";

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
      // Reload sales to fetch full row relationships seamlessly
      await loadSales(salePayload.business_id);
    }

    return { data, error };
  }, [loadSales]);

  return (
    <SalesContext.Provider
      value={{
        sales,
        loadingSales,
        loadSales,
        addSale,
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