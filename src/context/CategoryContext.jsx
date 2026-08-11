import { createContext, useContext, useState, useCallback } from "react";

import { useBusiness } from "./BusinessContext";

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

    const { data, error } = await getCategories(business.id);

    if (!error) {
      setCategories(data || []);
    }

    setLoading(false);

    return { data, error };
  }, [business]);

  const addCategory = async (category) => {
    const payload = {
      ...category,
      business_id: business.id,
    };

    const { data, error } = await createCategory(payload);

    if (!error) {
      await loadCategories();
    }

    return { data, error };
  };

  const editCategory = async (categoryId, updates) => {
    const { data, error } = await updateCategory(categoryId, updates);

    if (!error) {
      await loadCategories();
    }

    return { data, error };
  };

  const removeCategory = async (categoryId) => {
    const { error } = await deleteCategory(categoryId);

    if (!error) {
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
    throw new Error(
      "useCategory must be used inside CategoryProvider"
    );
  }

  return context;
}