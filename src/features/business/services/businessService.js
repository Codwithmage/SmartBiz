import supabase from "../../../supabase/SupabaseClient";

/**
 * Returns the current user's business.
 * Returns null if no business exists.
 */
export async function getBusiness(userId) {
  if (!userId) {
    return { data: null, error: new Error("User ID is required.") };
  }

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("created_by", userId)
    .maybeSingle();

  if (error) {
    console.error("getBusiness error:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Creates a business for the current user.
 */
export async function createBusiness({
  businessName,
  category,
  phone,
  email,
  businessType,
  currency,
  address,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: userError || new Error("User not authenticated."),
    };
  }

  const { data, error } = await supabase
    .from("businesses")
    .insert({
      created_by: user.id,
      business_name: businessName,
      category,
      phone,
      email,
      business_type: businessType,
      currency,
      address,
    })
    .select()
    .single();

  if (error) {
    console.error("createBusiness error:", error.message);
  }

  return { data, error };
}

/**
 * Updates an existing business.
 */
export async function updateBusiness(id, updates) {
  if (!id) {
    return { data: null, error: new Error("Business ID is required.") };
  }

  const { data, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updateBusiness error:", error.message);
  }

  return { data, error };
}