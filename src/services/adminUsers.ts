import { supabase } from "../lib/supabase";
import type { AdminUser } from "../types/adminUser";

/**
 * Fetch all dashboard admin/staff accounts.
 */
export async function fetchAdminUsers() {
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch admin users failed:", error);
    throw error;
  }

  return (data ?? []) as AdminUser[];
}

/**
 * Change an admin user's role.
 */
export async function updateAdminRole(userId: string, role: string) {
  const { error } = await supabase
    .from("admin_users")
    .update({ role })
    .eq("user_id", userId);

  if (error) {
    console.error("Update admin role failed:", error);
    throw error;
  }
}

/**
 * Revoke dashboard access for a user by removing their admin_users row.
 * Note: this does NOT delete their underlying Supabase Auth account, it only
 * revokes dashboard access (AuthContext checks admin_users on every login).
 */
export async function removeAdminUser(userId: string) {
  const { error } = await supabase
    .from("admin_users")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Remove admin user failed:", error);
    throw error;
  }
}

/**
 * Invite a new admin user by email.
 *
 * This calls a Supabase Edge Function ("invite-admin") rather than talking to
 * Supabase Auth directly, because creating/inviting an auth user requires the
 * service_role key. That key must NEVER be shipped to the browser, so the
 * actual invite + admin_users insert happens server-side in the edge function.
 *
 * You need to deploy that function before this will work — see
 * /supabase-functions/invite-admin and README-USERS-SETUP.md.
 */
export async function inviteAdminUser(email: string, role: string) {
  const { data, error } = await supabase.functions.invoke("invite-admin", {
    body: { email, role },
  });

  if (error) {
    console.error("Invite admin failed:", error);
    throw error;
  }

  return data as { user_id: string; email: string };
}
