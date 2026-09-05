import supabase from "../../../supabase/supabaseClient";

/**
 * Returns dashboard summary including calculated gross margins and net profit.
 */
export async function getDashboardSummary(businessId) {
  if (!businessId) {
    return {
      data: null,
      error: new Error("Business ID is required."),
    };
  }

  const [
    productsResult,
    salesResult,
    saleItemsResult,
    expensesResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),

    supabase
      .from("sales")
      .select("total_amount"),

    supabase
      .from("sale_items")
      .select("quantity, unit_price, cost_price"),

    supabase
      .from("expenses")
      .select("amount"),
  ]);

  const productCount = productsResult.count ?? 0;

  const totalSales =
    salesResult.data?.reduce(
      (sum, item) => sum + Number(item.total_amount || 0),
      0
    ) ?? 0;

  // Calculate Gross Profit from line items: (unit_price - cost_price) * quantity
  const grossProfit =
    saleItemsResult.data?.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);
      const costPrice = Number(item.cost_price || 0);
      return sum + qty * (unitPrice - costPrice);
    }, 0) ?? 0;

  const totalExpenses =
    expensesResult.data?.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    ) ?? 0;

  return {
    data: {
      totalProducts: productCount,
      totalSales,
      grossProfit,
      totalExpenses,
      netProfit: grossProfit - totalExpenses, // True net profit calculation
    },
    error: null,
  };
}