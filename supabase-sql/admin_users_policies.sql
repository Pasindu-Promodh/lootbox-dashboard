-- Run this in the Supabase SQL editor.
-- Required for the Users tab (Admins & Staff section) to work.
--
-- By default, Supabase enables Row Level Security on new tables with NO
-- policies, which means every request from the browser (anon/authenticated
-- key) is silently blocked. If admin_users has RLS enabled and you haven't
-- added policies like these, fetchAdminUsers/updateAdminRole/removeAdminUser
-- will all fail (typically returning an empty list or a permission error).

alter table public.admin_users enable row level security;

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

-- Any logged-in admin can update roles (including their own row via the UI,
-- though the Users tab disables editing/removing your own row client-side)
create policy "Admins can update admin_users"
on public.admin_users
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
  )
);

-- Any logged-in admin can remove another admin's access
create policy "Admins can delete admin_users"
on public.admin_users
for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
  )
);

-- No INSERT policy for the authenticated role on purpose — new rows are only
-- ever created by the invite-admin edge function using the service_role key,
-- which bypasses RLS entirely. This stops any logged-in admin from inserting
-- arbitrary rows (i.e. self-granting access) directly from the browser.
