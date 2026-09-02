import { useState, useEffect, useMemo, useCallback } from "react";
import supabase from "../../../supabase/SupabaseClient";
import { subscribeToPushNotifications } from "../../../utils/pushNotifications";
import { offlineDb } from "../../../db/offlineDb";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [businessInfo, setBusinessInfo] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [timeframe, setTimeframe] = useState("monthly");
  const [pushStatus, setPushStatus] = useState("");

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

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          if (isMounted) setLoading(false);
          return;
        }

        const user = session.user;
        if (isMounted) setCurrentUserId(user.id);

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

  // Handler for subscribing to push notifications
  const handleEnablePush = useCallback(async () => {
    if (!currentUserId || !businessInfo?.id) return;
    setPushStatus("Enabling...");
    try {
      await subscribeToPushNotifications(currentUserId, businessInfo.id);
      setPushStatus("Active");
    } catch (err) {
      console.error("Failed to enable push:", err);
      setPushStatus("Failed");
    }
  }, [currentUserId, businessInfo?.id]);

  // Automatically attempt push subscription when user & business are ready
  useEffect(() => {
    if (currentUserId && businessInfo?.id) {
      subscribeToPushNotifications(currentUserId, businessInfo.id);
    }
  }, [currentUserId, businessInfo?.id]);

  // 2. Fetch table data with nested sale_items
  const fetchDashboardData = useCallback(async (bizId) => {
    if (!bizId) return;

    try {
      const [salesRes, servicesRes, expensesRes, productsRes] = await Promise.all([
        supabase
          .from("sales")
          .select("*, sale_items(*)")
          .eq("business_id", bizId)
          .order("created_at", { ascending: false }),
        supabase
          .from("services")
          .select("*")
          .eq("business_id", bizId)
          .order("created_at", { ascending: false }),
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

    const channel = supabase
      .channel(`realtime-dashboard-${bizId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sales", filter: `business_id=eq.${bizId}` }, () => fetchDashboardData(bizId))
      .on("postgres_changes", { event: "*", schema: "public", table: "sale_items" }, () => fetchDashboardData(bizId))
      .on("postgres_changes", { event: "*", schema: "public", table: "services", filter: `business_id=eq.${bizId}` }, () => fetchDashboardData(bizId))
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `business_id=eq.${bizId}` }, () => fetchDashboardData(bizId))
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `business_id=eq.${bizId}` }, () => fetchDashboardData(bizId))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessInfo?.id, fetchDashboardData]);

  // Lookup map for catalog products
  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // Catalog service IDs and Names lookup sets
  const { serviceSet, serviceNameSet } = useMemo(() => {
    const idSet = new Set();
    const nameSet = new Set();
    services.forEach((s) => {
      if (s.id) idSet.add(String(s.id));
      if (s.name) nameSet.add(String(s.name).trim().toLowerCase());
      if (s.title) nameSet.add(String(s.title).trim().toLowerCase());
      if (s.service_name) nameSet.add(String(s.service_name).trim().toLowerCase());
    });
    return { serviceSet: idSet, serviceNameSet: nameSet };
  }, [services]);

  // Enhanced service classifier logic
  const checkIfService = useCallback(
    (item) => {
      if (!item) return false;

      // 1. Explicit type or category check
      const typeStr = String(item.item_type || item.type || item.category || "").toLowerCase();
      if (typeStr === "service" || typeStr === "services") return true;

      // 2. Presence of explicit service_id key
      if (item.service_id) return true;

      // 3. ID lookup against catalog services table
      const possibleId = String(item.product_id || item.item_id || item.id || "");
      if (possibleId && serviceSet.has(possibleId)) return true;

      // 4. Fallback: Name / Title lookup against catalog service names
      const possibleName = String(
        item.item_name || item.name || item.title || item.product_name || item.description || ""
      ).trim().toLowerCase();
      if (possibleName && serviceNameSet.has(possibleName)) return true;

      return false;
    },
    [serviceSet, serviceNameSet]
  );

  // EOD Summary Calculation
  const handleFetchDailySummary = useCallback(async () => {
    if (!businessInfo?.id) return;
    setLoadingSummary(true);

    try {
      let rpcSummary = { total_revenue: 0, net_profit: 0, total_sales_count: 0, new_debts: 0 };

      if (navigator.onLine) {
        const { data, error } = await supabase.rpc("get_daily_business_summary", {
          p_business_id: businessInfo.id,
        });
        if (!error && data && data.length > 0) {
          rpcSummary = data[0];
        }
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const todayLocalDateStr = new Date().toLocaleDateString();
      let pendingOfflineRevenue = 0;
      let pendingOfflineProfit = 0;
      let pendingOfflineCount = 0;

      try {
        const localSales = await offlineDb.sales
          .where({ business_id: businessInfo.id })
          .toArray();

        const todaysUnsyncedSales = localSales.filter((sale) => {
          const isUnsynced = sale.synced === 0;
          const saleDate = sale.created_at || sale.date;
          if (!saleDate) return false;
          const formattedSaleDate = new Date(saleDate).toISOString().split("T")[0];
          return isUnsynced && formattedSaleDate === todayStr;
        });

        todaysUnsyncedSales.forEach((sale) => {
          const amount = Number(sale.amount || sale.total_amount || sale.unit_price || 0);
          const cost = Number(sale.cost_price || 0);
          const qty = Number(sale.quantity || 1);

          pendingOfflineRevenue += amount;
          pendingOfflineProfit += amount - cost * qty;
          pendingOfflineCount += 1;
        });
      } catch (dexieErr) {
        console.error("Dexie read error during EOD:", dexieErr);
      }

      // Calculate total daily sales/services count directly from local state as accurate fallback
      const todaysSalesFromState = sales.filter((s) => {
        const d = s.created_at || s.date;
        if (!d) return false;
        return new Date(d).toLocaleDateString() === todayLocalDateStr;
      }).length;

      const todaysServicesFromState = services.filter((s) => {
        const d = s.created_at || s.date;
        if (!d) return false;
        return new Date(d).toLocaleDateString() === todayLocalDateStr;
      }).length;

      // Check all possible RPC key names returned by Supabase
      const rpcCount = 
        rpcSummary.total_sales_count ?? 
        rpcSummary.sales_count ?? 
        rpcSummary.total_sales ?? 
        rpcSummary.count ?? 
        0;

      const fallbackCount = todaysSalesFromState + todaysServicesFromState + pendingOfflineCount;

      const finalCount = Number(rpcCount) > 0 ? Number(rpcCount) : fallbackCount;

      setDailySummary({
        ...rpcSummary,
        total_revenue: Number(rpcSummary.total_revenue || 0) + pendingOfflineRevenue,
        net_profit: Number(rpcSummary.net_profit || 0) + pendingOfflineProfit,
        total_sales_count: finalCount,
      });
    } catch (err) {
      console.error("Failed to fetch daily summary:", err.message);
    } finally {
      setLoadingSummary(false);
    }
  }, [businessInfo?.id, sales, services]);

  useEffect(() => {
    if (businessInfo?.id) {
      handleFetchDailySummary();
    }
  }, [businessInfo?.id, handleFetchDailySummary]);

  // Metrics calculation based on selected timeframe
  const metrics = useMemo(() => {
    const now = new Date();

    const isWithinTimeframe = (record) => {
      const rawDate = record?.created_at || record?.date || record?.sales_date || record?.created_date;
      if (!rawDate) return false;
      const date = new Date(rawDate);
      if (isNaN(date.getTime())) return false;

      if (timeframe === "daily") {
        return date.toDateString() === now.toDateString();
      } else if (timeframe === "weekly") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return date >= sevenDaysAgo;
      } else if (timeframe === "monthly") {
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }
      return true;
    };

    const filteredSales = sales.filter((s) => isWithinTimeframe(s));
    const filteredServices = services.filter((s) => isWithinTimeframe(s));
    const filteredExpenses = expenses.filter((e) => isWithinTimeframe(e));

    let totalProductSales = 0;
    let totalServicesRevenue = 0;

    filteredSales.forEach((sale) => {
      const saleAmount = Number(
        sale.amount || sale.total_amount || sale.total || sale.price || sale.unit_price || sale.subtotal || 0
      );

      if (sale.sale_items && Array.isArray(sale.sale_items) && sale.sale_items.length > 0) {
        sale.sale_items.forEach((item) => {
          const itemAmount = Number(
            item.total_price || item.amount || (Number(item.price || item.unit_price || 0) * Number(item.quantity || 1)) || 0
          );

          if (checkIfService(item)) {
            totalServicesRevenue += itemAmount;
          } else {
            totalProductSales += itemAmount;
          }
        });
      } else {
        if (checkIfService(sale)) {
          totalServicesRevenue += saleAmount;
        } else {
          totalProductSales += saleAmount;
        }
      }
    });

    filteredServices.forEach((service) => {
      totalServicesRevenue += Number(
        service.price || service.amount || service.total_amount || service.total || 0
      );
    });

    const totalSales = totalProductSales + totalServicesRevenue;

    const totalExpenses = filteredExpenses.reduce(
      (acc, expense) => acc + Number(expense.amount || expense.total || expense.cost || 0),
      0
    );

    const grossProductProfit = filteredSales.reduce((acc, sale) => {
      if (checkIfService(sale)) return acc;

      const product = productMap.get(sale.product_id);
      const qty = Number(sale.quantity || sale.qty || 1);
      const saleAmount = Number(sale.amount || sale.total_amount || sale.total || sale.unit_price || 0);
      const unitCost = Number(sale.cost_price || sale.cost || product?.cost_price || 0);

      return acc + (saleAmount - unitCost * qty);
    }, 0);

    const netServiceProfit = filteredServices.reduce((acc, service) => {
      const price = Number(service.price || service.amount || service.total_amount || service.total || 0);
      const cost = Number(service.cost || service.cost_price || 0);
      return acc + (price - cost);
    }, 0);

    const netProfit = grossProductProfit + netServiceProfit - totalExpenses;

    return { totalSales, totalProductSales, totalServicesRevenue, totalExpenses, netProfit };
  }, [sales, services, expenses, timeframe, productMap, checkIfService]);

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

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleEnablePush}
            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
          >
            🔔 {pushStatus === "Active" ? "Notifications On" : pushStatus || "Enable Weekly Push"}
          </button>

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
              <p className="text-slate-400">Sales Count</p>
              <p className="text-base font-bold text-amber-300 mt-1">
                {dailySummary.total_sales_count || 0} {dailySummary.total_sales_count === 1 ? "Sale" : "Sales"}
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