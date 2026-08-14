import { useState, useEffect } from "react";
import { useServices } from "../../services/context/ServicesContext";
import { useBusiness } from "../../../context/BusinessContext"; // Ensure path is correct

function ServicesPage() {
  const { services = [], loadingServices = false, loadServices, addService } = useServices() || {};
  const businessContext = useBusiness() || {};

  // Extract business object defensively across common Context variable names
  const activeBusiness = 
    businessContext.currentBusiness || 
    businessContext.business || 
    businessContext.activeBusiness;

  // Extract ID defensively across common DB property names
  const businessId = 
    activeBusiness?.id || 
    activeBusiness?._id || 
    activeBusiness?.business_id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load services once business ID is available
  useEffect(() => {
    if (businessId && typeof loadServices === "function") {
      loadServices(businessId);
    }
  }, [businessId, loadServices]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!businessId) {
      setErrorMsg("No active business found. Please make sure you are logged in and a business is selected.");
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
        businessId: businessId,
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Services</h1>
          <p className="text-sm text-gray-500">Manage your business services and pricing</p>
        </div>
        
        <button
          onClick={() => {
            setErrorMsg("");
            setIsModalOpen(true);
          }}
          disabled={!businessId}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Service
        </button>
      </div>

      {/* Warning banner if no business is loaded */}
      {!businessId && (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
          <p className="font-semibold">No Business Selected</p>
          <p className="text-sm">Please select or create a business profile to view and manage services.</p>
        </div>
      )}

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
              </tr>
            </thead>
            <tbody>
              {services.map((service, index) => (
                <tr key={service.id || index} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-800 font-medium">{service.name}</td>
                  <td className="py-3 px-4 text-blue-600 font-semibold">
                    {Number(service.price).toFixed(2)}
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
                  Price
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
    </div>
  );
}

export default ServicesPage;