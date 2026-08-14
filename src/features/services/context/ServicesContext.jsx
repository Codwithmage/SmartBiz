import { createContext, useContext, useState, useCallback } from "react";
import  supabase  from "../../../../supabase/supabaseClient"; // Adjust this path to your supabase client export

const ServicesContext = createContext();

export function ServicesProvider({ children }) {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Fetch all services for a specific business
  const loadServices = useCallback(async (businessId) => {
    if (!businessId) return;
    setLoadingServices(true);
    
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error("Failed to load services:", err.message);
    } finally {
      setLoadingServices(false);
    }
  }, []);

  // Save new service to database
  const addService = async ({ name, price, businessId }) => {
    try {
      const { data, error } = await supabase
        .from("services")
        .insert([{ name, price, business_id: businessId }])
        .select();

      if (error) throw error;

      // Optimistically update state with saved DB record
      if (data && data.length > 0) {
        setServices((prev) => [data[0], ...prev]);
      }
      return data[0];
    } catch (err) {
      console.error("Failed to add service:", err.message);
      throw err;
    }
  };

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

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error("useServices must be used within a ServicesProvider");
  }
  return context;
};