import { useEffect, useState } from "react";
import supabase from "../../../supabase/SupabaseClient";
import { useBusiness } from "../../../context/BusinessContext";

function SalesList() {
  const { business } = useBusiness();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected sale for updating payment
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (business?.id) {
      loadSales();
    }
  }, [business]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      alert(`Error loading sales: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Open update modal
  const openPaymentModal = (sale) => {
    setSelectedSale(sale);
    // Pre-fill remaining balance
    const remaining = (sale.total_amount || 0) - (sale.amount_paid || 0);
    setPaymentAmount(remaining > 0 ? remaining : 0);
  };

  // Process payment update
  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!selectedSale) return;

    const addedAmount = parseFloat(paymentAmount) || 0;
    const currentPaid = parseFloat(selectedSale.amount_paid || 0);
    const newAmountPaid = currentPaid + addedAmount;
    const totalAmount = parseFloat(selectedSale.total_amount || 0);

    // Determine status based on amounts
    let newStatus = "unpaid";
    if (newAmountPaid >= totalAmount) {
      newStatus = "paid";
    } else if (newAmountPaid > 0) {
      newStatus = "partial";
    }

    try {
      setUpdating(true);
      const { error } = await supabase
        .from("sales")
        .update({
          amount_paid: newAmountPaid,
          payment_status: newStatus,
        })
        .eq("id", selectedSale.id);

      if (error) throw error;

      alert("Payment updated successfully!");
      setSelectedSale(null);
      loadSales(); // Refresh the list
    } catch (err) {
      alert(`Failed to update payment: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-6">Loading sales records...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales & Payment Status</h1>
        <p className="text-sm text-gray-500">Track and update customer outstanding balances.</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
              <th className="p-4">Customer / ID</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Paid</th>
              <th className="p-4">Balance Due</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {sales.map((sale) => {
              const total = sale.total_amount || 0;
              const paid = sale.amount_paid || 0;
              const balance = total - paid;

              return (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">
                    {sale.customer_name || `Sale #${sale.id.slice(0, 8)}`}
                  </td>
                  <td className="p-4 font-semibold">₦{total.toLocaleString()}</td>
                  <td className="p-4 text-green-600">₦{paid.toLocaleString()}</td>
                  <td className="p-4 text-red-600 font-semibold">
                    ₦{balance > 0 ? balance.toLocaleString() : 0}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        sale.payment_status === "paid"
                          ? "bg-green-100 text-green-800"
                          : sale.payment_status === "partial"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sale.payment_status?.toUpperCase() || "UNPAID"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {sale.payment_status !== "paid" && (
                      <button
                        onClick={() => openPaymentModal(sale)}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-md text-xs font-semibold transition"
                      >
                        💳 Record Payment
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              Record Payment for {selectedSale.customer_name || "Sale"}
            </h2>

            <div className="text-xs space-y-1 bg-gray-50 p-3 rounded-md border text-gray-600">
              <p>Total Invoice: <strong>₦{selectedSale.total_amount?.toLocaleString()}</strong></p>
              <p>Already Paid: <strong>₦{(selectedSale.amount_paid || 0).toLocaleString()}</strong></p>
              <p className="text-red-600 font-semibold">
                Remaining Balance: ₦{((selectedSale.total_amount || 0) - (selectedSale.amount_paid || 0)).toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleUpdatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Amount Received (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-2 border rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? "Updating..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesList;