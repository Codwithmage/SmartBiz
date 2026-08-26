import { useState, useMemo, useEffect, useRef } from "react";
import { useSales } from "../context/SalesContext";
import { useInventory } from "../../inventory/context/InventoryContext";
import { useServices } from "../../services/context/ServicesContext";
import { useBusiness } from "../../../context/BusinessContext";
import { formatCurrency } from "../../../utils/currencyUtils";

// Local timezone helper to accurately match "Today"
const isToday = (dateString) => {
  if (!dateString) return false;
  const saleDate = new Date(dateString);
  const today = new Date();
  return (
    saleDate.getDate() === today.getDate() &&
    saleDate.getMonth() === today.getMonth() &&
    saleDate.getFullYear() === today.getFullYear()
  );
};

function SalesPage() {
  const { business } = useBusiness();
  const currency = business?.currency || "NGN";

  const { sales, loadingSales, loadSales, addSale, updatePaymentStatus } = useSales();
  const { products, loadProducts } = useInventory();
  const { services, loadServices } = useServices();

  const businessId = business?.id;

  const [activeTab, setActiveTab] = useState("OVERVIEW_HISTORY");
  const [selectedSale, setSelectedSale] = useState(null);
  const [historySearch, setHistorySearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");

  const [customerName, setCustomerName] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [itemTypeFilter, setItemTypeFilter] = useState("ALL"); // ALL, PRODUCT, SERVICE
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const printRef = useRef(null);

  useEffect(() => {
    if (businessId) {
      loadSales(businessId);
      loadProducts(businessId);
      if (loadServices) loadServices(businessId);
    }
  }, [businessId, loadSales, loadProducts, loadServices]);

  const overviewStats = useMemo(() => {
    let todaysSales = 0;
    let totalSales = 0;
    let totalTransactions = (sales || []).length;
    let outstandingSales = 0;

    (sales || []).forEach((s) => {
      const amount = parseFloat(s.total_amount || 0);
      totalSales += amount;

      if (isToday(s.created_at)) {
        todaysSales += amount;
      }

      if (s.payment_status === "OUTSTANDING" || s.payment_status === "PARTIAL" || s.payment_status === "UNPAID") {
        outstandingSales += parseFloat(s.balance_due || amount);
      }
    });

    return {
      todaysSales,
      totalSales,
      totalTransactions,
      averageSale: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      outstandingSales,
    };
  }, [sales]);

  const handlePrintReceipt = () => {
    window.print();
  };

  // Improved handler to clear outstanding payments
  const handleMarkAsPaid = async (sale) => {
    if (!updatePaymentStatus) {
      alert("Payment status update function is not defined in SalesContext.");
      return;
    }

    const confirm = window.confirm(
      `Mark payment for ${sale.customer_name || sale.receipt_number || "this sale"} as PAID?`
    );
    if (!confirm) return;

    try {
      const { error } = await updatePaymentStatus(
        sale.id,
        sale.total_amount,
        "PAID",
        businessId
      );

      if (error) {
        console.error("Update Payment Status Error:", error);
        alert("Failed to update status: " + (error.message || "Permission denied or network issue."));
        return;
      }

      // Reload sales data and update local state for real-time reflection
      if (businessId) {
        await loadSales(businessId);
      }

      if (selectedSale && selectedSale.id === sale.id) {
        setSelectedSale((prev) => (prev ? { ...prev, payment_status: "PAID", balance_due: 0 } : null));
      }

      alert("Payment status updated to PAID successfully.");
    } catch (err) {
      console.error("Unexpected error in handleMarkAsPaid:", err);
      alert("Error updating payment status: " + err.message);
    }
  };

  const unifiedCatalog = useMemo(() => {
    const productList = (products || []).map((p) => ({
      id: p.id,
      name: p.name,
      selling_price: Number(p.selling_price || 0),
      type: "PRODUCT",
      availableStock: Number(p.quantity ?? p.initial_quantity ?? Infinity),
    }));

    const serviceList = (services || []).map((s) => ({
      id: s.id,
      name: s.name,
      selling_price: Number(s.price || s.selling_price || 0),
      type: "SERVICE",
      availableStock: Infinity,
    }));

    return [...productList, ...serviceList];
  }, [products, services]);

  const filteredCatalog = useMemo(() => {
    if (!productQuery.trim()) return [];
    const query = productQuery.toLowerCase();

    return unifiedCatalog.filter((item) => {
      const matchesQuery = item.name.toLowerCase().includes(query);
      const matchesType = itemTypeFilter === "ALL" || item.type === itemTypeFilter;
      return matchesQuery && matchesType;
    });
  }, [unifiedCatalog, productQuery, itemTypeFilter]);

  const handleAddToCart = (item) => {
    const isService = item.type === "SERVICE";
    const availableStock = item.availableStock;

    setCart((prev) => {
      const existing = prev.find(
        (cartItem) => cartItem.id === item.id && cartItem.item_type === item.type
      );

      if (existing) {
        const nextQty = isService
          ? existing.quantity + 1
          : Math.min(existing.quantity + 1, availableStock);

        return prev.map((cartItem) =>
          cartItem.id === item.id && cartItem.item_type === item.type
            ? { ...cartItem, quantity: nextQty }
            : cartItem
        );
      }

      return [
        ...prev,
        {
          id: item.id,
          product_id: !isService ? item.id : null,
          service_id: isService ? item.id : null,
          item_type: item.type,
          product_name: item.name,
          unit_price: item.selling_price,
          quantity: 1,
          stock: availableStock,
        },
      ];
    });
    setProductQuery("");
  };

  const handleRemoveFromCart = (id, itemType) => {
    setCart((prev) =>
      prev.filter((item) => !(item.id === id && item.item_type === itemType))
    );
  };

  const handleUpdateQuantity = (id, itemType, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(id, itemType);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id && item.item_type === itemType) {
          const availableStock = item.stock ?? Infinity;
          const targetQty =
            item.item_type === "SERVICE"
              ? newQuantity
              : Math.min(newQuantity, availableStock);
          return { ...item, quantity: targetQty };
        }
        return item;
      })
    );
  };

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  const parsedDiscount = parseFloat(discountPercent) || 0;
  const discountAmount = (cartSubtotal * parsedDiscount) / 100;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);

  const handleCompleteSale = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Cart is empty.");

    setIsSubmitting(true);
    const salePayload = {
      business_id: businessId,
      customer_name: customerName.trim() || "Walk-in Customer",
      subtotal: cartSubtotal,
      discount_amount: discountAmount,
      total_amount: cartTotal,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      status: "COMPLETED",
      items: cart.map((item) => ({
        product_id: item.product_id,
        service_id: item.service_id,
        item_type: item.item_type,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.unit_price * item.quantity,
      })),
    };

    const { error, data } = await addSale(salePayload);

    if (error) {
      setIsSubmitting(false);
      alert("Failed to complete sale: " + error.message);
      return;
    }

    if (businessId) {
      const refreshes = [loadSales(businessId), loadProducts(businessId)];
      if (loadServices) refreshes.push(loadServices(businessId));
      await Promise.all(refreshes);
    }

    setIsSubmitting(false);
    setCart([]);
    setCustomerName("");
    setDiscountPercent(0);

    if (data && data[0]) {
      setSelectedSale(data[0]);
    } else {
      setActiveTab("OVERVIEW_HISTORY");
    }
  };

  const filteredSalesHistory = useMemo(() => {
    return (sales || []).filter((sale) => {
      const matchesSearch =
        sale.receipt_number?.toLowerCase().includes(historySearch.toLowerCase()) ||
        sale.customer_name?.toLowerCase().includes(historySearch.toLowerCase());
      const matchesStatus =
        paymentStatusFilter === "ALL" || sale.payment_status === paymentStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sales, historySearch, paymentStatusFilter]);

  return (
    <div className="space-y-6 px-2 sm:px-0 max-w-7xl mx-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-receipt, #printable-receipt * { visibility: visible; }
          #printable-receipt {
            position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0;
            box-shadow: none !important; border: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Track revenue, view transaction history, and process sales for products & services.
          </p>
        </div>

        <div className="flex w-full sm:w-auto rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab("OVERVIEW_HISTORY")}
            className={`flex-1 sm:flex-initial rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition ${
              activeTab === "OVERVIEW_HISTORY"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview & History
          </button>
          <button
            onClick={() => setActiveTab("NEW_SALE")}
            className={`flex-1 sm:flex-initial rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition ${
              activeTab === "NEW_SALE"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            + New Sale
          </button>
        </div>
      </div>

      {activeTab === "OVERVIEW_HISTORY" && (
        <>
          {/* Responsive Cards Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 no-print">
            <div className="rounded-xl border border-gray-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                Today's Sales
              </p>
              <p
                className="mt-2 text-lg sm:text-xl font-bold text-green-600 truncate min-w-0"
                title={formatCurrency(overviewStats.todaysSales, currency)}
              >
                {formatCurrency(overviewStats.todaysSales, currency)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                Total Sales
              </p>
              <p
                className="mt-2 text-lg sm:text-xl font-bold text-gray-900 truncate min-w-0"
                title={formatCurrency(overviewStats.totalSales, currency)}
              >
                {formatCurrency(overviewStats.totalSales, currency)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                Transactions
              </p>
              <p className="mt-2 text-lg sm:text-xl font-bold text-gray-900 truncate min-w-0">
                {overviewStats.totalTransactions}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                Average Sale
              </p>
              <p
                className="mt-2 text-lg sm:text-xl font-bold text-gray-900 truncate min-w-0"
                title={formatCurrency(overviewStats.averageSale, currency)}
              >
                {formatCurrency(overviewStats.averageSale, currency)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                Credit / Outstanding
              </p>
              <p
                className="mt-2 text-lg sm:text-xl font-bold text-red-600 truncate min-w-0"
                title={formatCurrency(overviewStats.outstandingSales, currency)}
              >
                {formatCurrency(overviewStats.outstandingSales, currency)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 sm:p-5 shadow-xs space-y-4 no-print">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Sales History</h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  type="text"
                  placeholder="Search receipt #, customer..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full sm:w-auto rounded-md border px-3 py-1.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="w-full sm:w-auto rounded-md border px-3 py-1.5 text-base sm:text-sm focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PAID">Paid</option>
                  <option value="OUTSTANDING">Outstanding</option>
                </select>
              </div>
            </div>

            {/* Scrollable Container with Sticky Table Header */}
            <div className="max-h-[500px] overflow-y-auto overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 border rounded-lg">
              <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                <thead className="sticky top-0 z-10 border-b bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                  <tr>
                    <th className="py-3 px-3">Sale #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3 text-center">Items</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3 text-center">Payment</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {loadingSales ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">
                        Loading sales history...
                      </td>
                    </tr>
                  ) : filteredSalesHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">
                        No sales records found.
                      </td>
                    </tr>
                  ) : (
                    filteredSalesHistory.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="py-3 px-3 font-mono font-medium text-gray-900">
                          {sale.receipt_number || `#${sale.id.slice(0, 8)}`}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {new Date(sale.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          {sale.customer_name || "Walk-in Customer"}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {sale.sale_items?.length || sale.items?.length || 0}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(sale.total_amount, currency)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              sale.payment_status === "OUTSTANDING" || sale.payment_status === "UNPAID" || sale.payment_status === "PARTIAL"
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {sale.payment_status || "PAID"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedSale(sale)}
                              className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium hover:bg-gray-100"
                            >
                              View
                            </button>
                            {(sale.payment_status === "OUTSTANDING" ||
                              sale.payment_status === "PARTIAL" ||
                              sale.payment_status === "UNPAID") && (
                              <button
                                onClick={() => handleMarkAsPaid(sale)}
                                className="rounded bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700 transition"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "NEW_SALE" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 no-print">
          <div className="lg:col-span-2 space-y-4 rounded-xl border bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Search Products & Services
              </h2>
              <div className="flex rounded-md bg-gray-100 p-0.5 text-xs">
                {["ALL", "PRODUCT", "SERVICE"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setItemTypeFilter(type)}
                    className={`px-2.5 py-1 font-medium rounded ${
                      itemTypeFilter === type
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {type === "ALL" ? "All" : type === "PRODUCT" ? "Products" : "Services"}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Type item or service name..."
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                className="w-full rounded-lg border p-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filteredCatalog.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border bg-white shadow-lg">
                  {filteredCatalog.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleAddToCart(item)}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                              item.type === "SERVICE"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {item.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {item.type === "PRODUCT"
                            ? `Stock: ${item.availableStock}`
                            : "Service Item"}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-blue-600">
                        {formatCurrency(item.selling_price, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-semibold text-gray-900 pt-2">Cart Items</h3>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center border rounded-lg border-dashed">
                Cart is empty. Search for products or services above to add them.
              </p>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-600 border-b">
                    <tr>
                      <th className="p-3">Item</th>
                      <th className="p-3">Price</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cart.map((item) => (
                      <tr key={`${item.item_type}-${item.id}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{item.product_name}</span>
                            <span
                              className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                                item.item_type === "SERVICE"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {item.item_type}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {formatCurrency(item.unit_price, currency)}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.id,
                                  item.item_type,
                                  item.quantity - 1
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-200 active:scale-95 transition"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(
                                  item.id,
                                  item.item_type,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-12 rounded border text-center py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.id,
                                  item.item_type,
                                  item.quantity + 1
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-200 active:scale-95 transition"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right font-semibold whitespace-nowrap">
                          {formatCurrency(item.unit_price * item.quantity, currency)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.id, item.item_type)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition"
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-4 sm:p-5 shadow-xs space-y-4 h-fit">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 border-b pb-2">Checkout</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Customer Name
              </label>
              <input
                type="text"
                placeholder="Walk-in Customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-md border p-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full rounded-md border p-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-md border p-2 text-base sm:text-sm focus:outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card / POS</option>
                  <option value="TRANSFER">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full rounded-md border p-2 text-base sm:text-sm focus:outline-none"
              >
                <option value="PAID">Paid</option>
                <option value="OUTSTANDING">Outstanding / Credit</option>
              </select>
            </div>

            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(cartSubtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Discount:</span>
                <span>-{formatCurrency(discountAmount, currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-gray-900 border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(cartTotal, currency)}</span>
              </div>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={isSubmitting || cart.length === 0}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Completing Sale..." : "Complete Sale"}
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal & Printable Template */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div
            id="printable-receipt"
            ref={printRef}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 sm:p-6 shadow-xl space-y-4"
          >
            <div className="border-b pb-3 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {business?.business_name || business?.name || "Sales Receipt"}
                </h2>
                <h3 className="text-sm font-semibold text-gray-700">Receipt Details</h3>
                <p className="text-xs text-gray-500">
                  {selectedSale.receipt_number || `#${selectedSale.id}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 no-print"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-500">Date & Time</p>
                <p className="font-semibold text-gray-900">
                  {new Date(selectedSale.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-semibold text-gray-900">
                  {selectedSale.customer_name || "Walk-in Customer"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Payment Method</p>
                <p className="font-semibold text-gray-900 uppercase">
                  {selectedSale.payment_method || "CASH"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Payment Status</p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    selectedSale.payment_status === "OUTSTANDING" || selectedSale.payment_status === "UNPAID" || selectedSale.payment_status === "PARTIAL"
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {selectedSale.payment_status || "PAID"}
                </span>
              </div>
            </div>

            {/* Receipt Items Table */}
            <div className="border-t border-b py-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-500 border-b pb-1">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-800">
                  {(selectedSale.sale_items || selectedSale.items || []).map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-2">
                        <div className="font-medium text-gray-900">
                          {item.product_name || item.name || "Item"}
                        </div>
                        {item.item_type && (
                          <span className="text-[9px] text-gray-500 uppercase">
                            {item.item_type}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">
                        {formatCurrency(item.unit_price, currency)}
                      </td>
                      <td className="py-2 text-right font-semibold">
                        {formatCurrency(
                          item.total_price || item.unit_price * item.quantity,
                          currency
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Receipt Financial Totals */}
            <div className="space-y-1 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>
                  {formatCurrency(
                    selectedSale.subtotal || selectedSale.total_amount,
                    currency
                  )}
                </span>
              </div>
              {parseFloat(selectedSale.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(selectedSale.discount_amount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-gray-900 border-t pt-2">
                <span>Total Amount:</span>
                <span>{formatCurrency(selectedSale.total_amount, currency)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t no-print">
              {(selectedSale.payment_status === "OUTSTANDING" ||
                selectedSale.payment_status === "PARTIAL" ||
                selectedSale.payment_status === "UNPAID") && (
                <button
                  onClick={() => handleMarkAsPaid(selectedSale)}
                  className="rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition"
                >
                  Mark as Paid
                </button>
              )}
              <button
                onClick={handlePrintReceipt}
                className="rounded bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesPage;