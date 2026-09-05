import supabase from "../../../supabase/SupabaseClient";

/**
 * Fetch all sales for a business with their line items
 */
export async function getSales(businessId) {
  const { data, error } = await supabase
    .from("sales")
    .select(`
      *,
      sale_items (
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        cost_price,
        total_price
      )
    `)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Create a sale (inserts sale record and sale items with cost tracking)
 */
export async function createSale(payload) {
  const { items, ...saleData } = payload;

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert([saleData])
    .select()
    .single();

  if (saleError) return { data: null, error: saleError };

  if (items && items.length > 0) {
    const saleItemsPayload = items.map((item) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      cost_price: item.cost_price || 0, // Captured for gross profit computation
      total_price: item.unit_price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("sale_items")
      .insert(saleItemsPayload);

    if (itemsError) {
      console.error("Failed to insert sale items:", itemsError);
      return { data: null, error: itemsError };
    }
  }

  return { data: { ...sale, sale_items: items || [] }, error: null };
}

/**
 * Update payment status and amount paid for an outstanding sale
 */
export async function updateSaleStatus(saleId, amountPaid, paymentStatus) {
  const { data, error } = await supabase
    .from("sales")
    .update({
      amount_paid: amountPaid,
      payment_status: paymentStatus,
    })
    .eq("id", saleId)
    .select();

  return { data, error };
}