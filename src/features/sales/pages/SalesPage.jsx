import { useState, useMemo, useEffect } from "react";
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

  const { sales, loadingSales, loadSales, addSale } = useSales();
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

      if (s.payment_status === "OUTSTANDING" || s.payment_status === "PARTIAL") {
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

  // Merge Products and Services into a single catalog
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
      availableStock: Infinity, // Services do not have inventory limits
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

  // Helper function to explicitly remove an item from the cart
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

    const { error } = await addSale(salePayload);

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
    setActiveTab("OVERVIEW_HISTORY");
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
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          {/* Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="rounded-xl border bg-white p-3 sm:p-4 shadow-sm">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Today's Sales</p>
              <p className="mt-1 text-lg sm:text-2xl font-bold text-green-600">
                {formatCurrency(overviewStats.todaysSales, currency)}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-3 sm:p-4 shadow-sm">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Total Sales</p>
              <p className="mt-1 text-lg sm:text-2xl font-bold text-gray-900">
                {formatCurrency(overviewStats.totalSales, currency)}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-3 sm:p-4 shadow-sm">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Transactions</p>
              <p className="mt-1 text-lg sm:text-2xl font-bold text-gray-900">
                {overviewStats.totalTransactions}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-3 sm:p-4 shadow-sm">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Average Sale</p>
              <p className="mt-1 text-lg sm:text-2xl font-bold text-gray-900">
                {formatCurrency(overviewStats.averageSale, currency)}
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl border bg-white p-3 sm:p-4 shadow-sm">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Credit / Outstanding</p>
              <p className="mt-1 text-lg sm:text-2xl font-bold text-red-600">
                {formatCurrency(overviewStats.outstandingSales, currency)}
              </p>
            </div>
          </div>

          {/* Sales History Table */}
          <div className="rounded-xl border bg-white p-4 sm:p-5 shadow-sm space-y-4">
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

            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-600">
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
                          {sale.sale_items?.length || 0}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(sale.total_amount, currency)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              sale.payment_status === "OUTSTANDING"
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {sale.payment_status || "PAID"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium hover:bg-gray-100"
                          >
                            View
                          </button>
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 rounded-xl border bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Search Products & Services
              </h2>
              {/* Filter Tabs */}
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

          {/* Checkout Panel */}
          <div className="rounded-xl border bg-white p-4 sm:p-5 shadow-sm space-y-4 h-fit">
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
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Completing Sale..." : "Complete Sale"}
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 sm:p-6 shadow-xl space-y-4">
            <div className="border-b pb-3 flex justify-between items-start">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Sale Details</h3>
                <p className="text-xs text-gray-500">
                  {selectedSale.receipt_number || `#${selectedSale.id}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
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
            </div>

            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[300px]">
                <thead className="bg-gray-50 border-b font-semibold">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2 text-center">Type</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedSale.sale_items?.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2">{item.product_name}</td>
                      <td className="p-2 text-center">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                            item.item_type === "SERVICE"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.item_type || "PRODUCT"}
                        </span>
                      </td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(item.total_price, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-xs border-t pt-3">
              <div className="flex justify-between text-gray-600">
                <span>Payment Method:</span>
                <span className="font-medium text-gray-900">{selectedSale.payment_method}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Status:</span>
                <span className="font-medium text-gray-900">{selectedSale.payment_status}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t">
                <span>Total Amount:</span>
                <span>{formatCurrency(selectedSale.total_amount, currency)}</span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 border-t">
              <button
                onClick={() => setSelectedSale(null)}
                className="w-full sm:w-auto rounded-md bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesPage;