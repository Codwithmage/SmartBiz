import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusiness } from "../../../context/BusinessContext";
import { useInventory } from "../context/InventoryContext";
import supabase from "../../../supabase/SupabaseClient";

function InventoryProducts() {
  const navigate = useNavigate();
  const { business } = useBusiness();
  const { products, loadingProducts, loadProducts } = useInventory();

  // State management
  const [restockingId, setRestockingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", sku: "", selling_price: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!business) return;
    loadProducts(business.id);
  }, [business, loadProducts]);

  // Quick Restock Action
  const handleRestock = async (product) => {
    const input = prompt(
      `Restock "${product.name}"\nCurrent Stock: ${product.quantity}\n\nEnter quantity to add:`
    );

    if (!input) return;
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
      if (business?.id) loadProducts(business.id);
    } catch (err) {
      alert(`Failed to restock product: ${err.message}`);
    } finally {
      setRestockingId(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || "",
      sku: product.sku || "",
      selling_price: product.selling_price || "",
    });
  };

  // Save Edited Product
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setSavingEdit(true);
      const { error } = await supabase
        .from("products")
        .update({
          name: editForm.name,
          sku: editForm.sku,
          selling_price: parseFloat(editForm.selling_price) || 0,
        })
        .eq("id", editingProduct.id);

      if (error) throw error;

      alert("Product updated successfully!");
      setEditingProduct(null);
      if (business?.id) loadProducts(business.id);
    } catch (err) {
      alert(`Failed to update product: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Soft Delete (Archive) Product Action
  const handleDelete = async (product) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove "${product.name}" from your store?\n\nThis will safely archive the item without affecting historical sales or reports.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(product.id);
      const { error } = await supabase
        .from("products")
        .update({ is_active: false }) // Soft Delete
        .eq("id", product.id);

      if (error) throw error;

      alert(`"${product.name}" has been removed from active inventory.`);
      if (business?.id) loadProducts(business.id);
    } catch (err) {
      alert(`Failed to remove product: ${err.message}`);
    } finally {
      setDeletingId(null);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage, edit, and restock your inventory.</p>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
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

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleRestock(product)}
                        disabled={restockingId === product.id}
                        className="rounded bg-gray-100 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition disabled:opacity-50"
                      >
                        {restockingId === product.id ? "Updating..." : "+ Restock"}
                      </button>

                      <button
                        onClick={() => openEditModal(product)}
                        className="rounded bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                        className="rounded bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 border border-red-200 transition disabled:opacity-50"
                      >
                        {deletingId === product.id ? "Removing..." : "🗑️ Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Product</h2>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  value={editForm.sku}
                  onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                  className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Selling Price (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editForm.selling_price}
                  onChange={(e) => setEditForm({ ...editForm, selling_price: e.target.value })}
                  className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryProducts;