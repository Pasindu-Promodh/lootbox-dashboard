-- Run this in the Supabase SQL editor.
-- Required for the Users tab (Admins & Staff section) to work.
--
-- By default, Supabase enables Row Level Security on new tables with NO
-- policies, which means every request from the browser (anon/authenticated
-- key) is silently blocked. If admin_users has RLS enabled and you haven't
-- added policies like these, fetchAdminUsers/updateAdminRole/removeAdminUser
-- will all fail (typically returning an empty list or a permission error).
--
-- Permission model:
--   - Any logged-in admin/staff/viewer can VIEW the admin list.
--   - Only "super_admin" can UPDATE (role changes) or DELETE (remove access).
--   - Nobody can INSERT directly from the browser -- new rows are only ever
--     created by the invite-admin edge function using the service_role key.

alter table public.admin_users enable row level security;

-- Returns the caller's dashboard role (or null). SECURITY DEFINER so it can
-- read admin_users without re-entering admin_users' own RLS policies — a
-- policy on admin_users that sub-selects admin_users directly fails with
-- "infinite recursion detected in policy". Also used by
-- viewer_readonly_policies.sql.
create or replace function public.current_admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.admin_users where user_id = auth.uid()
$$;

revoke all on function public.current_admin_role() from public;
grant execute on function public.current_admin_role() to authenticated;

-- Drop older/looser policies if you ran a previous version of this file
drop policy if exists "Admins can view admin_users" on public.admin_users;
drop policy if exists "Admins can update admin_users" on public.admin_users;
drop policy if exists "Admins can delete admin_users" on public.admin_users;
drop policy if exists "Super admins can update admin_users" on public.admin_users;
drop policy if exists "Super admins can delete admin_users" on public.admin_users;

-- Any logged-in admin can view the full admin/staff list
create policy "Admins can view admin_users"
on public.admin_users
for select
to authenticated
using (public.current_admin_role() is not null);

-- Only super_admin can change roles, and only to a known role
create policy "Super admins can update admin_users"
on public.admin_users
for update
to authenticated
using (public.current_admin_role() = 'super_admin')
with check (role in ('super_admin', 'admin', 'viewer'));

-- Only super_admin can remove someone's access
create policy "Super admins can delete admin_users"
on public.admin_users
for delete
to authenticated
using (public.current_admin_role() = 'super_admin');

-- No INSERT policy for the authenticated role on purpose -- new rows are only
-- ever created by the invite-admin edge function using the service_role key,
-- which bypasses RLS entirely. This stops any logged-in admin (super_admin
-- included) from inserting arbitrary rows directly from the browser console.

-- ---------------------------------------------------------------------
-- Migrating existing rows off the old "staff" role (staff was removed,
-- replaced by super_admin/admin/viewer). Adjust the WHERE/SET as needed --
-- e.g. you likely want to manually set your own row to 'super_admin' first.
-- ---------------------------------------------------------------------
-- update public.admin_users set role = 'admin' where role = 'staff';
-- update public.admin_users set role = 'super_admin' where email = 'you@example.com';
