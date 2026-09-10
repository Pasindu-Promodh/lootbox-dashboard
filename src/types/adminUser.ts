export type AdminRole = "super_admin" | "admin" | "viewer";

export const ADMIN_ROLES: AdminRole[] = ["super_admin", "admin", "viewer"];

export interface AdminUser {
  user_id: string;
  email: string;
  role: AdminRole | string | null;
  created_at: string;
}

export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === "super_admin";
}
