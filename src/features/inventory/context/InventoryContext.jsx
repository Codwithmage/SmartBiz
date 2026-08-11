import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

import {
  getProducts,
  getCategories,
  createProduct as createProductService,
  updateCategory as updateCategoryService,
  deleteCategory as deleteCategoryService,
} from "../services/inventoryService";

const InventoryContext = createContext(null);

function InventoryProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);

  /**
   * Load Products
   */
  const loadProducts = useCallback(async (businessId) => {
    if (!businessId) {
      setProducts([]);
      return [];
    }

    setLoadingProducts(true);

    const { data, error } = await getProducts(businessId);

    if (error) {
      console.error(error);
      setProducts([]);
      setLoadingProducts(false);
      return [];
    }

    setProducts(data || []);
    setLoadingProducts(false);

    return data;
  }, []);

  /**
   * Load Categories
   */
  const loadCategories = useCallback(async (businessId) => {
    if (!businessId) {
      setCategories([]);
      return [];
    }

    setLoadingCategories(true);

    const { data, error } = await getCategories(businessId);

    if (error) {
      console.error(error);
      setCategories([]);
      setLoadingCategories(false);
      return [];
    }

    setCategories(data || []);
    setLoadingCategories(false);

    return data;
  }, []);

  /**
   * Update Category
   */
  const updateCategory = useCallback(async (id, updates) => {
    const { data, error } = await updateCategoryService(id, updates);

    if (!error) {
      setCategories((previous) =>
        previous.map((category) =>
          category.id === id ? { ...category, ...updates } : category
        )
      );
    }

    return { data, error };
  }, []);

  /**
   * Delete Category
   */
  const deleteCategory = useCallback(async (id) => {
    const { data, error } = await deleteCategoryService(id);

    if (!error) {
      setCategories((previous) =>
        previous.filter((category) => category.id !== id)
      );
    }

    return { data, error };
  }, []);

  /**
   * Create Product
   */
  const createProduct = useCallback(async (payload) => {
    setCreatingProduct(true);

    const { data, error } = await createProductService(payload);

    setCreatingProduct(false);

    if (error) {
      console.error("Product creation failed:", error);
      return { data: null, error };
    }

    return { data, error: null };
  }, []);

  /**
   * Refresh Everything
   */
  const refreshInventory = useCallback(
    async (businessId) => {
      await Promise.all([
        loadProducts(businessId),
        loadCategories(businessId),
      ]);
    },
    [loadProducts, loadCategories]
  );

  /**
   * Clear Cache
   */
  const clearInventory = () => {
    setProducts([]);
    setCategories([]);
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        categories,
        loadingProducts,
        loadingCategories,
        creatingProduct,
        loadProducts,
        loadCategories,
        updateCategory,
        deleteCategory,
        createProduct,
        refreshInventory,
        clearInventory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

function useInventory() {
  const context = useContext(InventoryContext);

  if (!context) {
    throw new Error(
      "useInventory must be used inside InventoryProvider."
    );
  }

  return context;
}

export { InventoryProvider, useInventory };