// src/features/reports/services/reportsService.js
import supabase from "../../../supabase/SupabaseClient";

export async function fetchReportData({ businessId, reportType, startDate, endDate }) {
  console.log("🔍 Running Report Query:", { businessId, reportType, startDate, endDate });

  if (!businessId) {
    console.error("❌ Business ID is missing or undefined!");
    return { data: [], error: "No active business selected." };
  }

  try {
    let query;

    switch (reportType) {
     case "sales": {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("business_id", businessId)
    .gte("created_at", `${startDate}T00:00:00Z`)
    .lte("created_at", `${endDate}T23:59:59Z`)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error };

  // Transform raw DB rows into clean display objects
  const formattedData = (data || []).map((sale) => ({
    "Date": new Date(sale.created_at || sale.sales_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    "Customer": sale.customer_name || "Walk-in Customer",
    "Payment Method": sale.payment_method || "N/A",
    "Status": sale.status || "COMPLETED",
    "Amount": `$${Number(sale.total_amount || sale.total_price || sale.subtotal || 0).toFixed(2)}`,
  }));

  return { data: formattedData, error: null };
}
      case "expenses": {
        query = supabase
          .from("expenses")
          .select("*")
          .eq("business_id", businessId)
          .gte("created_at", `${startDate}T00:00:00Z`)
          .lte("created_at", `${endDate}T23:59:59Z`)
          .order("created_at", { ascending: false });
        break;
      }
      case "profit": {
        const [salesRes, expenseRes] = await Promise.all([
          supabase
            .from("sales")
            .select("*")
            .eq("business_id", businessId)
            .gte("created_at", `${startDate}T00:00:00Z`)
            .lte("created_at", `${endDate}T23:59:59Z`),
          supabase
            .from("expenses")
            .select("*")
            .eq("business_id", businessId)
            .gte("created_at", `${startDate}T00:00:00Z`)
            .lte("created_at", `${endDate}T23:59:59Z`),
        ]);

        console.log("📊 Profit Raw Data:", { sales: salesRes.data, expenses: expenseRes.data });

        const totalRevenue =
          salesRes.data?.reduce(
            (acc, s) => acc + Number(s.total_price || s.total_amount || s.amount || 0),
            0
          ) || 0;

        const totalExpenses =
          expenseRes.data?.reduce((acc, e) => acc + Number(e.amount || 0), 0) || 0;

        return {
          data: [
            { metric: "Total Revenue", amount: totalRevenue },
            { metric: "Total Expenses", amount: totalExpenses },
            { metric: "Net Profit / (Loss)", amount: totalRevenue - totalExpenses },
          ],
          error: null,
        };
      }
      case "inventory": {
        query = supabase
          .from("products")
          .select("*")
          //.eq("business_id", businessId)
          .order("name", { ascending: true });
        break;
      }
      default:
        throw new Error("Invalid report type");
    }

    const { data, error } = await query;
    console.log(`📦 ${reportType} Report Results:`, { data, error });

    return { data: data || [], error };
  } catch (err) {
    console.error("❌ Catch Error:", err);
    return { data: [], error: err.message };
  }
}