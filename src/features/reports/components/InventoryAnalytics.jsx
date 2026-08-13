import { useEffect, useState } from "react";
import supabase from "../../../supabase/SupabaseClient";
import { useBusiness } from "../../../context/BusinessContext";

export default function InventoryAnalytics() {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [bestSellers, setBestSellers] = useState([]);
  const [deadStock, setDeadStock] = useState([]);
  const [totalCapitalTiedUp, setTotalCapitalTiedUp] = useState(0);

  useEffect(() => {
    if (!business?.id) return;

    async function fetchAnalytics() {
      setLoading(true);

      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // 1. Fetch All Active Products for this Business
        const { data: products, error: prodError } = await supabase
          .from("products")
          .select("id, name, quantity, cost_price, selling_price")
          .eq("business_id", business.id);

        if (prodError) throw prodError;

        // 2. Fetch Recent Sales Items (Last 60 Days)
        const { data: salesItems, error: salesError } = await supabase
          .from("sale_items")
          .select("product_id, quantity, created_at, unit_price, cost_price")
          .gte("created_at", sixtyDaysAgo.toISOString());

        if (salesError) throw salesError;

        // 3. Map Sales Activity per Product
        const salesStats = {};
        salesItems?.forEach((item) => {
          const pid = item.product_id;
          if (!salesStats[pid]) {
            salesStats[pid] = { totalSold: 0, revenue: 0, profit: 0, lastSaleDate: item.created_at };
          }

          const qty = Number(item.quantity || 0);
          const price = Number(item.unit_price || 0);
          const cost = Number(item.cost_price || 0);

          salesStats[pid].totalSold += qty;
          salesStats[pid].revenue += qty * price;
          salesStats[pid].profit += qty * (price - cost);

          if (new Date(item.created_at) > new Date(salesStats[pid].lastSaleDate)) {
            salesStats[pid].lastSaleDate = item.created_at;
          }
        });

        // 4. Calculate Best Sellers (Top units sold in last 30 days)
        const bestSellerList = products
          .map((prod) => ({
            ...prod,
            unitsSold: salesStats[prod.id]?.totalSold || 0,
            totalProfit: salesStats[prod.id]?.profit || 0,
            margin: prod.selling_price > 0 ? (((prod.selling_price - prod.cost_price) / prod.selling_price) * 100).toFixed(0) : 0,
          }))
          .filter((p) => p.unitsSold > 0)
          .sort((a, b) => b.unitsSold - a.unitsSold)
          .slice(0, 5); // Top 5

        // 5. Calculate Dead Stock (In stock, but 0 sales in last 60 days)
        let totalTiedCapital = 0;
        const deadStockList = products
          .filter((prod) => {
            const hasStock = Number(prod.quantity || 0) > 0;
            const recentSales = salesStats[prod.id]?.totalSold || 0;
            return hasStock && recentSales === 0;
          })
          .map((prod) => {
            const tiedCapital = Number(prod.quantity) * Number(prod.cost_price || 0);
            totalTiedCapital += tiedCapital;
            return { ...prod, tiedCapital };
          })
          .sort((a, b) => b.tiedCapital - a.tiedCapital);

        setBestSellers(bestSellerList);
        setDeadStock(deadStockList);
        setTotalCapitalTiedUp(totalTiedCapital);
      } catch (err) {
        console.error("Failed to load inventory analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [business]);

  if (loading) return <div className="p-4 text-gray-500">Calculating inventory metrics...</div>;

  return (
    <div className="space-y-8">
      {/* Capital Summary Banner */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-amber-900 text-lg">Dead Stock Capital Alert</h3>
          <p className="text-xs text-amber-700">Cash tied up in items with no sales in 60+ days.</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-amber-900">
            ₦{totalCapitalTiedUp.toLocaleString()}
          </span>
          <p className="text-xs font-semibold text-amber-700">{deadStock.length} stagnant items</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers Card */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            🔥 Best Sellers <span className="text-xs font-normal text-gray-500">(Last 30 Days)</span>
          </h3>

          {bestSellers.length === 0 ? (
            <p className="text-sm text-gray-500">No sales recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-2 text-sm">
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <span className="text-xs text-green-600 font-medium">{item.margin}% Profit Margin</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{item.unitsSold} sold</p>
                    <p className="text-xs text-gray-500">₦{item.totalProfit.toLocaleString()} profit</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dead Stock Card */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            ⚠️ Dead Stock Risk <span className="text-xs font-normal text-gray-500">(0 sales in 60+ days)</span>
          </h3>

          {deadStock.length === 0 ? (
            <p className="text-sm text-gray-500">Great job! No dead stock detected.</p>
          ) : (
            <div className="space-y-3">
              {deadStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-2 text-sm">
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <span className="text-xs text-gray-500">{item.quantity} units sitting in store</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">₦{item.tiedCapital.toLocaleString()}</p>
                    <span className="text-xs text-gray-400">Tied capital</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}