// src/features/reports/services/reportsService.js
import supabase from "../../../supabase/supabaseClient";
import { formatCurrency } from "../../../utils/currencyUtils";

export async function fetchReportData({ businessId, currency = "NGN", reportType, startDate, endDate }) {
  if (!businessId) {
    return { data: [], error: "No active business selected." };
  }

  try {
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

        const formattedSales = (data || []).map((sale) => ({
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
          "Amount": formatCurrency(sale.total_amount || sale.total_price || sale.subtotal, currency),
        }));

        return { data: formattedSales, error: null };
      }

      case "expenses": {
        const { data, error } = await supabase
          .from("expenses")
          .select("*")
          .eq("business_id", businessId)
          .gte("created_at", `${startDate}T00:00:00Z`)
          .lte("created_at", `${endDate}T23:59:59Z`)
          .order("created_at", { ascending: false });

        if (error) return { data: [], error };

        const formattedExpenses = (data || []).map((exp) => ({
          "Date": new Date(exp.created_at || exp.expense_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          "Category": exp.category || "General",
          "Description": exp.description || "N/A",
          "Payment Method": exp.payment_method || "Cash",
          "Amount": formatCurrency(exp.amount, currency),
        }));

        return { data: formattedExpenses, error: null };
      }

      case "inventory": {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("business_id", businessId)
          .order("name", { ascending: true });

        if (error) return { data: [], error };

        const formattedInventory = (data || []).map((prod) => {
          const qty = Number(prod.stock_quantity || prod.quantity || 0);
          const cost = Number(prod.cost_price || 0);
          const price = Number(prod.selling_price || prod.price || 0);

          return {
            "Product Name": prod.name || "Unnamed Item",
            "Category": prod.category || "Uncategorized",
            "In Stock": qty.toLocaleString(),
            "Unit Cost": formatCurrency(cost, currency),
            "Unit Price": formatCurrency(price, currency),
            "Cost Valuation": formatCurrency(qty * cost, currency),
            "Retail Valuation": formatCurrency(qty * price, currency),
          };
        });

        return { data: formattedInventory, error: null };
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

        const totalRevenue =
          salesRes.data?.reduce(
            (acc, s) => acc + Number(s.total_amount || s.total_price || s.subtotal || 0),
            0
          ) || 0;

        const totalExpenses =
          expenseRes.data?.reduce((acc, e) => acc + Number(e.amount || 0), 0) || 0;

        const netProfit = totalRevenue - totalExpenses;

        const formattedPNL = [
          { "Metric": "Total Revenue", "Amount": formatCurrency(totalRevenue, currency) },
          { "Metric": "Total Expenses", "Amount": formatCurrency(totalExpenses, currency) },
          { "Metric": "Net Profit / (Loss)", "Amount": formatCurrency(netProfit, currency) },
        ];

        return { data: formattedPNL, error: null };
      }

      default:
        throw new Error("Invalid report type");
    }
  } catch (err) {
    return { data: [], error: err.message };
  }
}