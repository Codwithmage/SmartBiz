import supabase from "../../../supabase/supabaseClient";

/**
 * Returns dashboard summary.
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
      .from("expenses")
      .select("amount"),
  ]);

  const productCount =
    productsResult.count ?? 0;

  const totalSales =
    salesResult.data?.reduce(
      (sum, item) => sum + Number(item.total_amount),
      0
    ) ?? 0;

  const totalExpenses =
    expensesResult.data?.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    ) ?? 0;

  return {
    data: {
      totalProducts: productCount,
      totalSales,
      totalExpenses,
      totalProfit:
        totalSales - totalExpenses,
    },
    error: null,
  };
}