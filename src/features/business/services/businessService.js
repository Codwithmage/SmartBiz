import supabase from "../../../supabase/SupabaseClient";

/**
 * Returns the current user's business based on their profile assignment.
 * Works for both Business Owners and Invited Team Members.
 */
export async function getBusiness(userId) {
  if (!userId) {
    return { data: null, error: new Error("User ID is required.") };
  }

  // 1. Try to fetch business_id from profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("business_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("getBusiness profile error:", profileError.message);
  }

  // 2. If profile already has a business_id, fetch and return that business
  if (profile?.business_id) {
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", profile.business_id)
      .maybeSingle();

    if (!bizError && business) {
      return { data: business, error: null };
    }
  }

  // 3. FALLBACK FOR ACCOUNTS: Check if user created a business via owner_id OR created_by
  const { data: legacyBusiness, error: legacyError } = await supabase
    .from("businesses")
    .select("*")
    .or(`owner_id.eq.${userId},created_by.eq.${userId}`)
    .maybeSingle();

  if (legacyError) {
    console.error("getBusiness legacy lookup error:", legacyError.message);
    return { data: null, error: legacyError };
  }

  // 4. If legacy business found, auto-heal profile by setting business_id and OWNER role
  if (legacyBusiness) {
    await supabase.from("profiles").upsert({
      id: userId,
      business_id: legacyBusiness.id,
      role: "OWNER",
    });

    return { data: legacyBusiness, error: null };
  }

  return { data: null, error: null };
}

/**
 * Creates a business for the current user and assigns them as the owner.
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

  // 1. Create business record (Populates both created_by and owner_id)
  const { data, error } = await supabase
    .from("businesses")
    .insert({
      created_by: user.id,
      owner_id: user.id,
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
    return { data: null, error };
  }

  // 2. Assign creator as OWNER on profiles table
  if (data?.id) {
    await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      business_id: data.id,
      role: "OWNER",
    });
  }

  return { data, error: null };
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