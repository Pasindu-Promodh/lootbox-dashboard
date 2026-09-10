-- Run this in the Supabase SQL editor.
-- Tightens products/orders/categories mutation policies so "viewer" is truly
-- read-only, matching the UI. Read (SELECT) policies are untouched — viewers
-- can still see everything, same as admin/super_admin.
--
-- Uses the current_admin_role() function created earlier for admin_users
-- (SECURITY DEFINER, reads the caller's role without re-triggering RLS).

-- ── products ──────────────────────────────────────────────────────────
drop policy if exists "Allow only admins to insert products" on public.products;
create policy "Allow only admins to insert products"
on public.products
for insert
to authenticated
with check (public.current_admin_role() in ('admin', 'super_admin'));

drop policy if exists "Allow only admins to update products" on public.products;
create policy "Allow only admins to update products"
on public.products
for update
to authenticated
using (public.current_admin_role() in ('admin', 'super_admin'))
with check (public.current_admin_role() in ('admin', 'super_admin'));

drop policy if exists "Allow only admins to delete products" on public.products;
create policy "Allow only admins to delete products"
on public.products
for delete
to authenticated
using (public.current_admin_role() in ('admin', 'super_admin'));

-- ── orders ────────────────────────────────────────────────────────────
-- (No insert policy needed/touched — checkout goes through your edge
-- function using the service_role key, which bypasses RLS entirely.)
drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders
for update
to authenticated
using (public.current_admin_role() in ('admin', 'super_admin'))
with check (public.current_admin_role() in ('admin', 'super_admin'));

-- ── categories ────────────────────────────────────────────────────────
drop policy if exists "Allow only admins to insert categories" on public.categories;
create policy "Allow only admins to insert categories"
on public.categories
for insert
to authenticated
with check (public.current_admin_role() in ('admin', 'super_admin'));

drop policy if exists "Allow only admins to update categories" on public.categories;
create policy "Allow only admins to update categories"
on public.categories
for update
to authenticated
using (public.current_admin_role() in ('admin', 'super_admin'))
with check (public.current_admin_role() in ('admin', 'super_admin'));
