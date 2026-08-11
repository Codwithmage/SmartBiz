import supabase from "../../../supabase/SupabaseClient";

/**
 * ======================================================
 * CATEGORIES
 * ======================================================
 */

export async function getCategories(businessId) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("business_id", businessId);

  return { data, error };
}

export async function createCategory(category) {
  const { data, error } = await supabase
    .from("categories")
    .insert(category)
    .select()
    .single();

  return { data, error };
}

export async function updateCategory(id, updates) {
  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteCategory(id) {
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  return { data, error };
}

/**
 * ======================================================
 * PRODUCTS
 * ======================================================
 */

export async function getProducts(businessId) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories(
        id,
        name
      )
    `)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Product creation goes through the RPC.
 */
export async function createProduct(payload) {
  const { data, error } = await supabase.rpc(
    "inventory_create_product",
    {
      p_payload: payload,
    }
  );

  return { data, error };
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function archiveProduct(id) {
  const { data, error } = await supabase
    .from("products")
    .update({
      status: "ARCHIVED",
    })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

/**
 * ======================================================
 * STOCK MOVEMENTS
 * ======================================================
 */

export async function getStockMovements(productId) {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  return { data, error };
}