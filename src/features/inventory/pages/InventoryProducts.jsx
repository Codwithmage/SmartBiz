import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusiness } from "../../../context/BusinessContext";
import { useInventory } from "../context/InventoryContext";
import supabase from "../../../supabase/SupabaseClient";

function InventoryProducts() {
  const navigate = useNavigate();
  const { business } = useBusiness();
  const { products, loadingProducts, loadProducts } = useInventory();
  const [restockingId, setRestockingId] = useState(null);

  useEffect(() => {
    if (!business) return;
    loadProducts(business.id);
  }, [business, loadProducts]);

  // Handle Quick Restock Action
  const handleRestock = async (product) => {
    const input = prompt(
      `Restock "${product.name}"\nCurrent Stock: ${product.quantity}\n\nEnter quantity to add:`
    );

    if (!input) return; // User cancelled
    const amountToAdd = Number(input);

    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    try {
      setRestockingId(product.id);
      const newQuantity = Number(product.quantity || 0) + amountToAdd;

      const { error } = await supabase
        .from("products")
        .update({ quantity: newQuantity })
        .eq("id", product.id);

      if (error) throw error;

      alert(`Restocked! New quantity for "${product.name}" is ${newQuantity}.`);
      if (business?.id) loadProducts(business.id); // Reload updated inventory
    } catch (err) {
      alert(`Failed to restock product: ${err.message}`);
    } finally {
      setRestockingId(null);
    }
  };

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center py-20">
        <h2 className="text-xl font-semibold text-gray-600">Loading Products...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage and restock your inventory.</p>
        </div>

        <button
          onClick={() => navigate("/inventory/add")}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          + Add Product
        </button>
      </div>

      {/* Empty State vs Products Table */}
      {products.length === 0 ? (
        <div className="rounded-xl bg-white p-10 shadow text-center border">
          <h2 className="text-xl font-semibold text-gray-800">No Products Yet</h2>
          <p className="mt-2 text-sm text-gray-500">Your inventory is empty.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow border overflow-hidden">
          {/* Responsive Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[650px]">
              <thead className="bg-gray-50 border-b text-gray-600 uppercase text-xs font-semibold">
                <tr>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Price</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono text-xs text-gray-500">
                      {product.sku || "-"}
                    </td>

                    <td className="p-4 font-medium text-gray-900">
                      {product.name}
                    </td>

                    <td className="p-4 text-gray-600">
                      {product.categories?.name ?? "-"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          product.quantity <= 5
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {product.quantity} in stock
                      </span>
                    </td>

                    <td className="p-4 font-semibold text-gray-900">
                      ₦{Number(product.selling_price || 0).toLocaleString()}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRestock(product)}
                        disabled={restockingId === product.id}
                        className="rounded bg-gray-100 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition disabled:opacity-50"
                      >
                        {restockingId === product.id ? "Updating..." : "+ Restock"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryProducts;