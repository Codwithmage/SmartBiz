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
        total_price
      )
    `)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Create a sale (inserts sale record and sale items)
 */
export async function createSale(payload) {
  // Destructure 'items' out so Supabase doesn't look for an 'items' column in 'sales'
  const { items, ...saleData } = payload;

  // 1. Insert header record into 'sales'
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert([saleData])
    .select()
    .single();

  if (saleError) return { data: null, error: saleError };

  // 2. Insert line items into 'sale_items'
  if (items && items.length > 0) {
    const saleItemsPayload = items.map((item) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
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

  // Return the main sale object attached with its items array
  return { data: { ...sale, sale_items: items || [] }, error: null };
}