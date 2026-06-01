import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Returns all users with the "administrator" role.
 * Used to populate assignment dropdowns on lead detail pages.
 */
export async function fetchAdminUsers() {
  try {
    const adminClient = createSupabaseAdminClient();
    const { data, error } = await adminClient
      .from("user_roles")
      .select("user_id, profiles(first_name, surname, email, role_title)")
      .eq("role", "administrator")
      .order("user_id");

    if (error) return [];

    return (data || []).map((r) => ({
      user_id:    r.user_id,
      first_name: r.profiles?.first_name || "",
      surname:    r.profiles?.surname || "",
      email:      r.profiles?.email || "",
      role_title: r.profiles?.role_title || "",
    }));
  } catch {
    return [];
  }
}

export function adminUserDisplayName(user) {
  const name = [user.first_name, user.surname].filter(Boolean).join(" ");
  return name || user.email || "Admin";
}
