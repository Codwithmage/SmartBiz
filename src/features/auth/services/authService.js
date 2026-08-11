import supabase from "../../../supabase/SupabaseClient";

export async function registerUser({
  fullName,
  email,
  password,
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
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
  // Fix: Call signOut on supabase.auth
  const { error } = await supabase.auth.signOut();

  return { error };
}

export async function getUserBusiness(userId) {
  // Fix: Query created_by to match business schema
  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("created_by", userId)
    .maybeSingle();

  return { data, error };
}