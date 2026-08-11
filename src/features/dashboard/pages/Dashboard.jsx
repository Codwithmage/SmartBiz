import { useState, useEffect, useMemo } from "react";
import supabase from "../../../supabase/supabaseClient";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [businessInfo, setBusinessInfo] = useState(null);
  const [timeframe, setTimeframe] = useState("monthly"); // "daily" | "weekly" | "monthly"

  // Raw state from database
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);

  // Fetch all realtime data
  const fetchDashboardData = async () => {
    try {
      setErrorMessage("");

      // 1. Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      // 2. Fetch business details
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (businessError) throw businessError;
      if (business) setBusinessInfo(business);

      const businessId = business?.id;

      // 3. Clean flat queries (No fragile relational string joins)
      let salesQuery = supabase.from("sales").select("*");
      let expensesQuery = supabase.from("expenses").select("*");
      let productsQuery = supabase.from("products").select("*");

      if (businessId) {
        salesQuery = salesQuery.eq("business_id", businessId);
        expensesQuery = expensesQuery.eq("business_id", businessId);
        productsQuery = productsQuery.eq("business_id", businessId);
      }

      const [salesRes, expensesRes, productsRes] = await Promise.all([
        salesQuery.order("created_at", { ascending: false }),
        expensesQuery,
        productsQuery,
      ]);

      if (salesRes.error) console.error("Sales fetch error:", salesRes.error.message);
      if (expensesRes.error) console.error("Expenses fetch error:", expensesRes.error.message);
      if (productsRes.error) console.error("Products fetch error:", productsRes.error.message);

      setSales(salesRes.data || []);
      setExpenses(expensesRes.data || []);
      setProducts(productsRes.data || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Realtime listeners for postgres changes
    const channel = supabase
      .channel("realtime-dashboard-v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => fetchDashboardData())
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => fetchDashboardData())
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Quick lookup map for product details (cost_price, name, etc.)
  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // Calculate metrics based on selected Timeframe
  const metrics = useMemo(() => {
    const now = new Date();

    const isWithinTimeframe = (dateString) => {
      if (!dateString) return false;
      const date = new Date(dateString);

      if (timeframe === "daily") {
        return date.toDateString() === now.toDateString();
      } else if (timeframe === "weekly") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return date >= sevenDaysAgo;
      } else if (timeframe === "monthly") {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      return true;
    };

    const filteredSales = sales.filter((s) => isWithinTimeframe(s.created_at || s.date));
    const filteredExpenses = expenses.filter((e) => isWithinTimeframe(e.created_at || e.date));

    // 1. Total Revenue
    const totalSales = filteredSales.reduce(
      (acc, sale) => acc + Number(sale.amount || sale.total_amount || sale.unit_price || 0),
      0
    );

    // 2. Total Expenses
    const totalExpenses = filteredExpenses.reduce(
      (acc, expense) => acc + Number(expense.amount || 0),
      0
    );

    // 3. Gross Product Profit = (Sale Amount - Cost Price) - Expenses
    const grossProductProfit = filteredSales.reduce((acc, sale) => {
      const product = productMap.get(sale.product_id);
      const qty = Number(sale.quantity || 1);
      const saleAmount = Number(sale.amount || sale.total_amount || sale.unit_price || 0);
      const unitCost = Number(sale.cost_price || product?.cost_price || 0);

      const margin = saleAmount - (unitCost * qty);
      return acc + margin;
    }, 0);

    const netProfit = grossProductProfit - totalExpenses;

    return { totalSales, totalExpenses, netProfit };
  }, [sales, expenses, timeframe, productMap]);

  // Low Stock Items (Quantity <= 5)
  const lowStockProducts = useMemo(() => {
    return products.filter(
      (p) => Number(p.stock_quantity ?? p.quantity ?? 0) <= 5
    );
  }, [products]);

  const currencySymbol =
    businessInfo?.currency === "NGN" || !businessInfo?.currency
      ? "₦"
      : businessInfo.currency + " ";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm font-semibold text-gray-500">Loading live metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* Header & Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{businessInfo?.name || "Dashboard"}</h2>
          <p className="text-xs text-gray-500">
            {businessInfo?.category || "Retail"} • {businessInfo?.address || "Active"}
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-gray-100 p-1 border self-start sm:self-auto">
          {["daily", "weekly", "monthly"].map((type) => (
            <button
              key={type}
              onClick={() => setTimeframe(type)}
              className={`px-3 py-1.5 text-xs font-semibold capitalize rounded-md transition-all ${
                timeframe === type
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Realtime Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="text-xs font-semibold text-gray-500 uppercase">Sales ({timeframe})</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {currencySymbol}{metrics.totalSales.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📉</span>
            <span className="text-xs font-semibold text-gray-500 uppercase">Expenses ({timeframe})</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-rose-600">
            {currencySymbol}{metrics.totalExpenses.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="text-xs font-semibold text-gray-500 uppercase">Net Profit ({timeframe})</span>
          </div>
          <p className={`mt-4 text-2xl font-bold ${metrics.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {currencySymbol}{metrics.netProfit.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <span className="text-xs font-semibold text-gray-500 uppercase">Products</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-blue-600">
            {products.length.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tables: Recent Sales & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales List */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Recent Sales</h3>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Live
            </span>
          </div>
          {sales.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No sales recorded yet.</p>
          ) : (
            <div className="divide-y max-h-72 overflow-y-auto">
              {sales.slice(0, 6).map((sale) => {
                const product = productMap.get(sale.product_id);
                const title = sale.product_name || sale.customer_name || sale.item_name || product?.name || "Sale Record";

                return (
                  <div key={sale.id} className="py-2.5 flex justify-between items-center text-sm pr-2">
                    <div>
                      <p className="font-medium text-gray-900">{title}</p>
                      <p className="text-xs text-gray-500">
                        {sale.created_at || sale.date
                          ? new Date(sale.created_at || sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " • " + new Date(sale.created_at || sale.date).toLocaleDateString()
                          : "Recently added"}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-600">
                      +{currencySymbol}{Number(sale.amount || sale.total_amount || sale.unit_price || 0).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Low Stock Alert</h3>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {lowStockProducts.length} Items
            </span>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">All products are adequately stocked.</p>
          ) : (
            <div className="divide-y max-h-72 overflow-y-auto">
              {lowStockProducts.map((prod) => (
                <div key={prod.id} className="py-2.5 flex justify-between items-center text-sm pr-2">
                  <span className="font-medium text-gray-900">{prod.name || prod.title}</span>
                  <span className="rounded bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                    {prod.stock_quantity ?? prod.quantity ?? 0} remaining
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}