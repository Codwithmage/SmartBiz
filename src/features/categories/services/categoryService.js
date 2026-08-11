import supabase from "../../../supabase/SupabaseClient";

export async function getCategories(businessId) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  return { data, error };
}

export async function getCategory(categoryId) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .maybeSingle();

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

export async function updateCategory(categoryId, updates) {
  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", categoryId)
    .select()
    .single();

  return { data, error };
}

export async function deleteCategory(categoryId) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  return { error };
}