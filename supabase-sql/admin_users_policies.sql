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

-- Drop older/looser policies if you ran a previous version of this file
drop policy if exists "Admins can view admin_users" on public.admin_users;
drop policy if exists "Admins can update admin_users" on public.admin_users;
drop policy if exists "Admins can delete admin_users" on public.admin_users;

-- Any logged-in admin can view the full admin/staff list
create policy "Admins can view admin_users"
on public.admin_users
for select
to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
  )
);

-- Only super_admin can change roles
create policy "Super admins can update admin_users"
on public.admin_users
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid() and au.role = 'super_admin'
  )
);

-- Only super_admin can remove someone's access
create policy "Super admins can delete admin_users"
on public.admin_users
for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid() and au.role = 'super_admin'
  )
);

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
