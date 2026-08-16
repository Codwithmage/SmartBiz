import { createContext, useContext, useState, useCallback } from "react";
import supabase from "../../../supabase/SupabaseClient";

const ServicesContext = createContext(null);

export function ServicesProvider({ children }) {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Load active services for a business
  const loadServices = useCallback(async (businessId) => {
    if (!businessId) {
      setServices([]);
      return [];
    }

    try {
      setLoadingServices(true);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", businessId)
        .neq("is_active", false) // Exclude archived items
        .order("created_at", { ascending: false });

      if (error) throw error;

      setServices(data || []);
      return data || [];
    } catch (err) {
      console.error("Failed to load services:", err);
      setServices([]);
      return [];
    } finally {
      setLoadingServices(false);
    }
  }, []);

  // Add new service
  const addService = useCallback(async ({ name, price, businessId }) => {
    const { data, error } = await supabase
      .from("services")
      .insert([{ name, price, business_id: businessId }])
      .select()
      .single();

    if (error) throw error;

    if (businessId) {
      await loadServices(businessId);
    }

    return data;
  }, [loadServices]);

  return (
    <ServicesContext.Provider
      value={{
        services,
        loadingServices,
        loadServices,
        addService,
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error("useServices must be used within a ServicesProvider.");
  }
  return context;
}