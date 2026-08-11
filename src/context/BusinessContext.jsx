import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

import { useAuth } from "./AuthContext";
import { getBusiness } from "../features/business/services/businessService";

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  const loadBusiness = useCallback(async (targetUserId) => {
    const idToFetch = targetUserId || userId;

    if (!idToFetch) {
      setBusiness(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    const { data, error } = await getBusiness(idToFetch);

    if (error) {
      console.error("Failed to load business:", error);
      setBusiness(null);
      setLoading(false);
      return null;
    }

    // Convert empty arrays or empty objects into explicit null
    const validBusiness =
      data && !Array.isArray(data) && Object.keys(data).length > 0 ? data : null;

    setBusiness(validBusiness);
    setLoading(false);
    return validBusiness;
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setBusiness(null);
      setLoading(false);
      return;
    }

    loadBusiness(userId);
  }, [userId, authLoading, loadBusiness]);

  const refreshBusiness = useCallback(async () => {
    if (!userId) {
      setBusiness(null);
      return null;
    }
    return loadBusiness(userId);
  }, [userId, loadBusiness]);

  const clearBusiness = useCallback(() => {
    setBusiness(null);
  }, []);

  const value = useMemo(
    () => ({
      business,
      loading,
      businessLoading: loading, // Exported to match AppEntry's destructuring
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