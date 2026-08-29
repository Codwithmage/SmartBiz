import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { offlineDb } from "../../../db/offlineDb";
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
   * Load Products with Offline Support
   */
  const loadProducts = useCallback(async (businessId) => {
    if (!businessId) {
      setProducts([]);
      return [];
    }

    setLoadingProducts(true);

    try {
      // 1. OFFLINE FLOW: Load products from local Dexie database
      if (!navigator.onLine) {
        let localProducts = [];
        if (offlineDb?.products) {
          localProducts = await offlineDb.products
            .where({ business_id: businessId })
            .toArray();
        }
        setProducts(localProducts || []);
        setLoadingProducts(false);
        return localProducts || [];
      }

      // 2. ONLINE FLOW: Fetch products from service
      const { data, error } = await getProducts(businessId);

      if (error) throw error;

      if (data) {
        // Cache fetched products locally in IndexedDB safely
        if (offlineDb?.products) {
          await offlineDb.products.bulkPut(data);
        }
        setProducts(data);
      }

      setLoadingProducts(false);
      return data || [];
    } catch (err) {
      console.error("Error loading products:", err);

      // Fallback to local Dexie database if network request fails
      let localFallback = [];
      if (offlineDb?.products) {
        localFallback = await offlineDb.products
          .where({ business_id: businessId })
          .toArray();
      }
      setProducts(localFallback || []);
      setLoadingProducts(false);
      return localFallback || [];
    }
  }, []);

  /**
   * Load Categories with Offline Support
   */
  const loadCategories = useCallback(async (businessId) => {
    if (!businessId) {
      setCategories([]);
      return [];
    }

    setLoadingCategories(true);

    try {
      // 1. OFFLINE FLOW: Load categories from local Dexie database
      if (!navigator.onLine) {
        let localCategories = [];
        if (offlineDb?.categories) {
          localCategories = await offlineDb.categories
            .where({ business_id: businessId })
            .toArray();
        }
        setCategories(localCategories || []);
        setLoadingCategories(false);
        return localCategories || [];
      }

      // 2. ONLINE FLOW: Fetch categories from service
      const { data, error } = await getCategories(businessId);

      if (error) throw error;

      if (data) {
        // Safe check before caching categories in IndexedDB
        if (offlineDb?.categories) {
          await offlineDb.categories.bulkPut(data);
        }
        setCategories(data);
      }

      setLoadingCategories(false);
      return data || [];
    } catch (err) {
      console.error("Error loading categories:", err);

      // Fallback to local Dexie database safely if network request fails
      let localFallback = [];
      if (offlineDb?.categories) {
        localFallback = await offlineDb.categories
          .where({ business_id: businessId })
          .toArray();
      }
      setCategories(localFallback || []);
      setLoadingCategories(false);
      return localFallback || [];
    }
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
      // Synchronize update to local storage safely
      if (data && offlineDb?.categories) {
        await offlineDb.categories.put(data);
      }
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
      // Remove from local cache safely
      if (offlineDb?.categories) {
        await offlineDb.categories.delete(id);
      }
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

    // Cache the newly created product in IndexedDB safely
    if (data) {
      if (offlineDb?.products) {
        await offlineDb.products.put(data);
      }
      setProducts((prev) => [data, ...prev]);
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