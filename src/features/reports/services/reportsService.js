// src/features/reports/services/reportsService.js
import supabase from "../../../supabase/supabaseClient";

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
        query = supabase
          .from("sales")
          .select("*")
          .eq("business_id", businessId)
          .gte("created_at", `${startDate}T00:00:00Z`)
          .lte("created_at", `${endDate}T23:59:59Z`)
          .order("created_at", { ascending: false });
        break;
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