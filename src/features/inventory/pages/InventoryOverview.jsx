import { useEffect } from "react";
import { useInventory } from "../context/InventoryContext";
import { useBusiness } from "../../../context/BusinessContext";

function InventoryOverview() {
  const { business } = useBusiness();
  const {
    products,
    categories,
    loadingProducts,
    loadingCategories,
    refreshInventory,
  } = useInventory();

  const businessId = business?.id;

  // Load latest inventory data whenever the business ID is available
  useEffect(() => {
    if (businessId) {
      refreshInventory(businessId);
    }
  }, [businessId, refreshInventory]);

  // Dynamic calculations from context data
  const totalProducts = products.length;
  const totalCategories = categories.length;

  const lowStockItems = products.filter((product) => {
    const qty = Number(product.initial_quantity ?? product.quantity ?? 0);
    const reorder = Number(product.reorder_level ?? 0);
    return qty <= reorder;
  }).length;

  const totalInventoryValue = products.reduce((sum, product) => {
    const price = Number(product.selling_price ?? 0);
    const qty = Number(product.initial_quantity ?? product.quantity ?? 0);
    return sum + price * qty;
  }, 0);

  // Take the 5 most recently created products
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const isLoading = loadingProducts || loadingCategories;

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500 font-medium">
        Loading inventory overview...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Overview</h1>
        <p className="text-gray-600 mt-1">
          Monitor your products, stock levels, and inventory activity.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Products</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalProducts}</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Categories</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalCategories}</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{lowStockItems}</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Inventory Value</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            ₦{totalInventoryValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recently Added Products */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recently Added Products
          </h2>
          {recentProducts.length === 0 ? (
            <p className="text-sm text-gray-500">Product activity will appear here.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentProducts.map((product) => (
                <li key={product.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      Qty: {product.initial_quantity ?? product.quantity ?? 0} {product.unit || ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    ₦{Number(product.selling_price || 0).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Stock Activity */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Stock Activity
          </h2>
          <p className="text-sm text-gray-500">Stock movements will appear here.</p>
        </div>
      </div>
    </div>
  );
}

export default InventoryOverview;