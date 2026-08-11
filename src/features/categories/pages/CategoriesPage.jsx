import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useInventory } from "../../inventory/context/InventoryContext";
import { useBusiness } from "../../../context/BusinessContext";

function CategoriesPage() {
  const { business } = useBusiness();
  const {
    categories,
    loadingCategories,
    loadCategories,
    updateCategory,
    deleteCategory,
  } = useInventory();

  const businessId = business?.id;

  // Modal State
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  // Form State
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (businessId) {
      loadCategories(businessId);
    }
  }, [businessId, loadCategories]);

  // Open Edit Modal
  const handleStartEdit = (category) => {
    setEditingCategory(category);
    setEditName(category.name || "");
    setEditDescription(category.description || "");
    setErrorMessage("");
  };

  // Submit Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setErrorMessage("Category name cannot be empty.");
      return;
    }

    setActionLoading(true);
    setErrorMessage("");

    const { error } = await updateCategory(editingCategory.id, {
      name: editName.trim(),
      description: editDescription.trim() || null,
    });

    setActionLoading(false);

    if (error) {
      setErrorMessage(error.message || "Failed to update category.");
      return;
    }

    setEditingCategory(null);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    setActionLoading(true);
    setErrorMessage("");

    const { error } = await deleteCategory(deletingCategory.id);

    setActionLoading(false);

    if (error) {
      setErrorMessage(error.message || "Failed to delete category.");
      return;
    }

    setDeletingCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Categories</h1>
          <p className="text-gray-500">
            Organize your inventory using categories.
          </p>
        </div>

        <Link
          to="/inventory/categories/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
        >
          + Add Category
        </Link>
      </div>

      {loadingCategories ? (
        <div className="rounded-lg border p-6 text-gray-500">
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-lg border p-10 text-center">
          <h2 className="text-lg font-semibold">No Categories Yet</h2>
          <p className="mt-2 text-gray-500">
            Categories help organize products and improve reporting.
          </p>
          <Link
            to="/inventory/categories/new"
            className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2 text-white"
          >
            Create First Category
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Description
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {category.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleStartEdit(category)}
                      className="mr-2 rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeletingCategory(category);
                        setErrorMessage("");
                      }}
                      className="rounded border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Category</h3>

            {errorMessage && (
              <div className="mb-4 rounded bg-red-50 p-3 text-xs text-red-600">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Category</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deletingCategory.name}</strong>?
              This action cannot be undone.
            </p>

            {errorMessage && (
              <div className="mb-4 rounded bg-red-50 p-3 text-xs text-red-600">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriesPage;