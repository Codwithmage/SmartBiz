import supabase from "../../../supabase/SupabaseClient";

export async function registerUser({
  fullName,
  email,
  password,
  businessId,
  role,
}) {
  const userMetadata = {
    full_name: fullName,
    role: role || "OWNER",
  };

  if (businessId) {
    userMetadata.business_id = businessId;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userMetadata,
    },
  });

  return { data, error };
}

export async function loginUser({
  email,
  password,
}) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();

  return { error };
}

export async function getUserBusiness(userId) {
  if (!userId) return { data: null, error: null };

  // 1. Fetch user profile to get assigned business_id
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("business_id, role")
    .eq("id", userId)
    .maybeSingle();

  // 2. If profile already has a linked business_id, fetch and return that business
  if (profile?.business_id) {
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", profile.business_id)
      .maybeSingle();

    if (business && !bizErr) {
      return { data: business, error: null };
    }
  }

  // 3. Fallback: Search businesses table directly for created/owned business
  const { data: directBusiness, error: directErr } = await supabase
    .from("businesses")
    .select("*")
    .or(`owner_id.eq.${userId},created_by.eq.${userId}`)
    .maybeSingle();

  return { data: directBusiness, error: directErr };
}