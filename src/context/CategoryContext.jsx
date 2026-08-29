import { createContext, useContext, useState, useCallback } from "react";
import { useBusiness } from "./BusinessContext";
import { offlineDb } from "../db/offlineDb";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../features/categories/services/categoryService";

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
  const { business } = useBusiness();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!business?.id) {
      setCategories([]);
      return { data: null, error: null };
    }

    setLoading(true);

    try {
      // 1. OFFLINE FLOW: Load categories from Dexie indexedDB
      if (!navigator.onLine) {
        const localCategories = await offlineDb.categories
          .where({ business_id: business.id })
          .toArray();
        setCategories(localCategories || []);
        setLoading(false);
        return { data: localCategories, error: null };
      }

      // 2. ONLINE FLOW: Fetch categories from backend service
      const { data, error } = await getCategories(business.id);

      if (error) throw error;

      if (data) {
        // Cache categories locally for offline fallback
        await offlineDb.categories.bulkPut(data);
        setCategories(data);
      }

      setLoading(false);
      return { data, error: null };
    } catch (err) {
      console.error("Error loading categories:", err);

      // Fallback to local offlineDb if network call fails
      const localFallback = await offlineDb.categories
        .where({ business_id: business.id })
        .toArray();
      if (localFallback.length) {
        setCategories(localFallback);
      }

      setLoading(false);
      return { data: localFallback, error: err };
    }
  }, [business]);

  const addCategory = async (category) => {
    const payload = {
      ...category,
      business_id: business.id,
    };

    const { data, error } = await createCategory(payload);

    if (!error) {
      if (data) {
        await offlineDb.categories.put(data);
      }
      await loadCategories();
    }

    return { data, error };
  };

  const editCategory = async (categoryId, updates) => {
    const { data, error } = await updateCategory(categoryId, updates);

    if (!error) {
      if (data) {
        await offlineDb.categories.put(data);
      }
      await loadCategories();
    }

    return { data, error };
  };

  const removeCategory = async (categoryId) => {
    const { error } = await deleteCategory(categoryId);

    if (!error) {
      await offlineDb.categories.delete(categoryId);
      await loadCategories();
    }

    return { error };
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        loading,
        loadCategories,
        addCategory,
        editCategory,
        removeCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);

  if (!context) {
    throw new Error("useCategory must be used inside CategoryProvider");
  }

  return context;
}