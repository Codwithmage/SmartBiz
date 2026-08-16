import { useState, useEffect, useMemo, useCallback } from "react";
import supabase from "../../../supabase/SupabaseClient";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [businessInfo, setBusinessInfo] = useState(null);
  const [timeframe, setTimeframe] = useState("monthly");

  // Raw state from database
  const [sales, setSales] = useState([]);
  const [services, setServices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);

  // End-of-Day Summary State
  const [dailySummary, setDailySummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // 1. Resolve Business Info ONCE when session is active
  useEffect(() => {
    let isMounted = true;

    const initAuthAndBusiness = async () => {
      try {
        setLoading(true);
        
        // Use getSession() instead of getUser() to wait for restored token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          if (isMounted) setLoading(false);
          return;
        }

        const user = session.user;

        // Step A: Check if user is business owner
        let { data: biz } = await supabase
          .from("businesses")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        // Step B: Check profile if staff
        if (!biz) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("business_id")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.business_id) {
            const { data: staffBiz } = await supabase
              .from("businesses")
              .select("*")
              .eq("id", profile.business_id)
              .maybeSingle();
            biz = staffBiz;
          }
        }

        if (isMounted && biz) {
          setBusinessInfo(biz);
        }
      } catch (err) {
        console.error("Dashboard initialization error:", err);
        if (isMounted) setErrorMessage(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuthAndBusiness();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch table data for the specific business
  const fetchDashboardData = useCallback(async (bizId) => {
    if (!bizId) return;

    try {
      const [salesRes, servicesRes, expensesRes, productsRes] = await Promise.all([
        supabase.from("sales").select("*").eq("business_id", bizId).order("created_at", { ascending: false }),
        supabase.from("services").select("*").eq("business_id", bizId).order("created_at", { ascending: false }),
        supabase.from("expenses").select("*").eq("business_id", bizId),
        supabase.from("products").select("*").eq("business_id", bizId),
      ]);

      if (salesRes.error) console.error("Sales error:", salesRes.error.message);
      if (servicesRes.error) console.error("Services error:", servicesRes.error.message);
      if (expensesRes.error) console.error("Expenses error:", expensesRes.error.message);
      if (productsRes.error) console.error("Products error:", productsRes.error.message);

      setSales(salesRes.data || []);
      setServices(servicesRes.data || []);
      setExpenses(expensesRes.data || []);
      setProducts(productsRes.data || []);
    } catch (err) {
      console.error("Fetch data error:", err);
    }
  }, []);

  // 3. Realtime Listener attached ONLY after businessInfo.id is resolved
  useEffect(() => {
    const bizId = businessInfo?.id;
    if (!bizId) return;

    fetchDashboardData(bizId);

    // Channel specific to this business to prevent cross-tenant triggers
    const channel = supabase
      .channel(`realtime-dashboard-${bizId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sales", filter: `business_id=eq.${bizId}` }, () => fetchDashboardData(bizId))
      .on("postgres_changes", { event: "*", schema: "public", table: "services", filter: `business_id=eq.${bizId}` }, () => fetchDashboardData(bizId))
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `business_id=eq.${bizId}` }, () => fetchDashboardData(bizId))
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `business_id=eq.${bizId}` }, () => fetchDashboardData(bizId))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessInfo?.id, fetchDashboardData]);

  // Fetch Daily Summary
  const handleFetchDailySummary = useCallback(async () => {
    if (!businessInfo?.id) return;
    setLoadingSummary(true);

    try {
      const { data, error } = await supabase.rpc("get_daily_business_summary", {
        p_business_id: businessInfo.id,
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setDailySummary(data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch daily summary:", err.message);
    } finally {
      setLoadingSummary(false);
    }
  }, [businessInfo?.id]);

  useEffect(() => {
    if (businessInfo?.id) {
      handleFetchDailySummary();
    }
  }, [businessInfo?.id, handleFetchDailySummary]);

  // Lookup map for products
  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // Metrics calculation
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
    const filteredServices = services.filter((s) => isWithinTimeframe(s.created_at || s.date));
    const filteredExpenses = expenses.filter((e) => isWithinTimeframe(e.created_at || e.date));

    const totalProductSales = filteredSales.reduce(
      (acc, sale) => acc + Number(sale.amount || sale.total_amount || sale.unit_price || 0),
      0
    );

    const totalServicesRevenue = filteredServices.reduce(
      (acc, service) => acc + Number(service.price || service.amount || service.total_amount || 0),
      0
    );

    const totalSales = totalProductSales + totalServicesRevenue;

    const totalExpenses = filteredExpenses.reduce(
      (acc, expense) => acc + Number(expense.amount || 0),
      0
    );

    const grossProductProfit = filteredSales.reduce((acc, sale) => {
      const product = productMap.get(sale.product_id);
      const qty = Number(sale.quantity || 1);
      const saleAmount = Number(sale.amount || sale.total_amount || sale.unit_price || 0);
      const unitCost = Number(sale.cost_price || product?.cost_price || 0);

      return acc + (saleAmount - unitCost * qty);
    }, 0);

    const netServiceProfit = filteredServices.reduce((acc, service) => {
      const price = Number(service.price || service.amount || service.total_amount || 0);
      const cost = Number(service.cost || service.cost_price || 0);
      return acc + (price - cost);
    }, 0);

    const netProfit = grossProductProfit + netServiceProfit - totalExpenses;

    return { totalSales, totalProductSales, totalServicesRevenue, totalExpenses, netProfit };
  }, [sales, services, expenses, timeframe, productMap]);

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

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{businessInfo?.name || "Dashboard"}</h2>
          <p className="text-xs text-gray-500">
            {businessInfo?.category || "Retail"} • {businessInfo?.address || "Active"}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleFetchDailySummary}
            disabled={loadingSummary}
            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 border border-blue-200 transition disabled:opacity-50"
          >
            {loadingSummary ? "Calculating..." : "📊 Run EOD Summary"}
          </button>

          <div className="inline-flex rounded-lg bg-gray-100 p-1 border">
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
      </div>

      {/* End of Day Summary Display */}
      {dailySummary && (
        <div className="rounded-xl bg-slate-900 text-white p-5 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
            <h3 className="font-bold text-sm text-blue-400 flex items-center gap-2">
              <span>🔔</span> End-of-Day Performance Digest
            </h3>
            <span className="text-xs text-slate-400">Generated Today</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-slate-400">Revenue</p>
              <p className="text-base font-bold text-white mt-1">
                {currencySymbol}{Number(dailySummary.total_revenue || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-slate-400">Net Profit</p>
              <p className={`text-base font-bold mt-1 ${Number(dailySummary.net_profit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {currencySymbol}{Number(dailySummary.net_profit || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-slate-400">Top Item Sold</p>
              <p className="text-base font-bold text-amber-300 mt-1 truncate">
                {dailySummary.top_item_name || "N/A"} ({dailySummary.top_item_qty || 0})
              </p>
            </div>

            <div>
              <p className="text-slate-400">New Debts</p>
              <p className="text-base font-bold text-rose-300 mt-1">
                {currencySymbol}{Number(dailySummary.new_debts || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Realtime Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Revenue ({timeframe})</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {currencySymbol}{metrics.totalSales.toLocaleString()}
          </p>
          <span className="text-[10px] text-gray-400 mt-1">
            Products: {currencySymbol}{metrics.totalProductSales.toLocaleString()} • Services: {currencySymbol}{metrics.totalServicesRevenue.toLocaleString()}
          </span>
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
            <span className="text-xs font-semibold text-gray-500 uppercase">Inventory & Services</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-blue-600">
            {products.length.toLocaleString()} <span className="text-xs font-normal text-gray-500">Products</span>
          </p>
          <span className="text-[10px] text-gray-400 mt-1">
            Active services: {services.length}
          </span>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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