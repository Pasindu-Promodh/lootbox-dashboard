export type AdminRole = "admin" | "staff" | "viewer";

export const ADMIN_ROLES: AdminRole[] = ["admin", "staff", "viewer"];

export interface AdminUser {
  user_id: string;
  email: string;
  role: AdminRole | string | null;
  created_at: string;
}
