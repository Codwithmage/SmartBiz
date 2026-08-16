import { useState, useEffect, useCallback } from "react";
import { useServices } from "../../services/context/ServicesContext";
import { useBusiness } from "../../../context/BusinessContext";
import supabase from "../../../supabase/SupabaseClient";

function ServicesPage() {
  const { services = [], loadingServices = false, loadServices, addService } = useServices() || {};
  const businessContext = useBusiness() || {};

  const activeBusiness = 
    businessContext.currentBusiness || 
    businessContext.business || 
    businessContext.activeBusiness;

  const [businessId, setBusinessId] = useState(
    activeBusiness?.id || activeBusiness?._id || activeBusiness?.business_id || null
  );

  // Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit Modal State
  const [editingService, setEditingService] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState(null);

  // Fallback: Fetch business_id from profile if context is missing it for staff members
  const resolveBusinessId = useCallback(async () => {
    if (businessId) return businessId;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.business_id) {
        setBusinessId(profile.business_id);
        return profile.business_id;
      }
    } catch (err) {
      console.error("Error fetching user profile business_id:", err);
    }
    return null;
  }, [businessId]);

  useEffect(() => {
    async function initServices() {
      const activeId = await resolveBusinessId();
      if (activeId && typeof loadServices === "function") {
        loadServices(activeId);
      }
    }
    initServices();
  }, [resolveBusinessId, loadServices]);

  // Create Service
  const handleSubmit = async (e) => {
    e.preventDefault();

    const activeId = await resolveBusinessId();

    if (!activeId) {
      setErrorMsg("No active business found. Please make sure you are logged in.");
      return;
    }

    if (!name || !price) {
      setErrorMsg("Please fill in both Service Name and Price.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      await addService({
        name,
        price: parseFloat(price),
        businessId: activeId,
      });

      setName("");
      setPrice("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving service:", err);
      setErrorMsg(err.message || "Failed to save service to database.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Service
  const openEditModal = (service) => {
    setEditingService(service);
    setEditName(service.name || "");
    setEditPrice(service.price || "");
  };

  // Save Service Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      setSavingEdit(true);
      const { error } = await supabase
        .from("services")
        .update({
          name: editName,
          price: parseFloat(editPrice) || 0,
        })
        .eq("id", editingService.id);

      if (error) throw error;

      alert("Service updated successfully!");
      setEditingService(null);
      const activeId = await resolveBusinessId();
      if (activeId && typeof loadServices === "function") {
        loadServices(activeId);
      }
    } catch (err) {
      alert(`Failed to update service: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Soft Delete (Archive) Service Action
  const handleDeleteService = async (service) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove the service "${service.name}"?\n\nThis will safely archive it without affecting historical reports.`
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(service.id);
      const { error } = await supabase
        .from("services")
        .update({ is_active: false })
        .eq("id", service.id);

      if (error) throw error;

      alert(`Service "${service.name}" removed successfully.`);
      const activeId = await resolveBusinessId();
      if (activeId && typeof loadServices === "function") {
        loadServices(activeId);
      }
    } catch (err) {
      alert(`Failed to remove service: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Services</h1>
          <p className="text-sm text-gray-500">Manage your business services and pricing</p>
        </div>
        
        <button
          onClick={() => {
            setErrorMsg("");
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Service
        </button>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loadingServices ? (
          <div className="p-8 text-center text-gray-500">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No services added yet. Click "+ Add Service" to create one.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-600 text-sm">
                <th className="py-3 px-4 font-semibold">Service Name</th>
                <th className="py-3 px-4 font-semibold">Price</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, index) => (
                <tr key={service.id || index} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-800 font-medium">{service.name}</td>
                  <td className="py-3 px-4 text-blue-600 font-semibold">
                    ₦{Number(service.price || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(service)}
                      className="rounded bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteService(service)}
                      disabled={deletingId === service.id}
                      className="rounded bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 border border-red-200 transition disabled:opacity-50"
                    >
                      {deletingId === service.id ? "Removing..." : "🗑️ Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Service</h2>

            {errorMsg && (
              <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Haircut, Consultation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Service</h2>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
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

export default ServicesPage;