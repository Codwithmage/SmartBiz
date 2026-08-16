import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

import supabase from "../supabase/SupabaseClient";
import { useAuth } from "./AuthContext";
import { getBusiness } from "../features/business/services/businessService";

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { user, businessId: authBusinessId, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  const loadBusiness = useCallback(async () => {
    if (!userId) {
      setBusiness(null);
      setLoading(false);
      return null;
    }

    setLoading(true);

    try {
      // 1. If user has a linked business_id (Cashiers / Managers / Linked Owners)
      if (authBusinessId) {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", authBusinessId)
          .maybeSingle();

        if (data && !error) {
          setBusiness(data);
          setLoading(false);
          return data;
        }
      }

      // 2. Fallback: Lookup business by owner_id
      const { data, error } = await getBusiness(userId);

      if (error) {
        console.error("Failed to load business:", error);
        setBusiness(null);
        setLoading(false);
        return null;
      }

      const validBusiness =
        data && !Array.isArray(data) && Object.keys(data).length > 0 ? data : null;

      setBusiness(validBusiness);
      setLoading(false);
      return validBusiness;
    } catch (err) {
      console.error("Unexpected error fetching business:", err);
      setBusiness(null);
      setLoading(false);
      return null;
    }
  }, [userId, authBusinessId]);

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setBusiness(null);
      setLoading(false);
      return;
    }

    loadBusiness();
  }, [userId, authBusinessId, authLoading, loadBusiness]);

  const refreshBusiness = useCallback(async () => {
    if (!userId) {
      setBusiness(null);
      return null;
    }
    return loadBusiness();
  }, [userId, loadBusiness]);

  const clearBusiness = useCallback(() => {
    setBusiness(null);
  }, []);

  const value = useMemo(
    () => ({
      business,
      loading,
      businessLoading: loading,
      loadBusiness,
      refreshBusiness,
      clearBusiness,
    }),
    [business, loading, loadBusiness, refreshBusiness, clearBusiness]
  );

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusiness must be used inside BusinessProvider.");
  }
  return context;
}