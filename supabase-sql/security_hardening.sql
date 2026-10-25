-- Run this in the Supabase SQL editor AFTER admin_users_policies.sql and
-- viewer_readonly_policies.sql. Written against the live schema as dumped
-- on 2026-10-25; every statement is safe to re-run.
--
-- Run it BEFORE deploying the dashboard (its product form sends `stock`) and
-- before/with the create-order edge function.

-- ── 1. Never remove the last super_admin ──────────────────────────────
-- RLS lets a super_admin demote/delete any row, including the last
-- super_admin, which would lock everyone out of the Users tab.

create or replace function public.prevent_last_super_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'super_admin'
     and (tg_op = 'DELETE' or new.role is distinct from 'super_admin')
     and (select count(*) from public.admin_users where role = 'super_admin') <= 1
  then
    raise exception 'Cannot remove or demote the last super_admin';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists keep_one_super_admin on public.admin_users;
create trigger keep_one_super_admin
before update of role or delete on public.admin_users
for each row execute function public.prevent_last_super_admin_removal();


-- ── 2. Hide cost prices from the public ───────────────────────────────
-- products had a "read for all users" policy, so anyone with the anon key
-- could read original_price (your cost) straight from the table. The
-- storefront only uses products_public, so: make that view run as its owner
-- (bypassing RLS, exposing only the safe columns below) and restrict the
-- table itself to dashboard users.

alter table public.products
  add column if not exists stock integer check (stock is null or stock >= 0);

create or replace view public.products_public
with (security_invoker = false) as
select
  id,
  name,
  description,
  images,
  category,
  sub_category,
  pre_discount_price,
  price,
  discount,
  featured,
  in_stock,
  on_sale,
  sold_count,
  added_date,
  stock
from public.products;

revoke all on public.products_public from anon, authenticated;
grant select on public.products_public to anon, authenticated;

drop policy if exists "Enable read access for all users" on public.products;
drop policy if exists "Dashboard users can read products" on public.products;
create policy "Dashboard users can read products"
on public.products
for select
to authenticated
using (public.current_admin_role() is not null);


-- ── 3. Customers see their own orders without cost/profit ─────────────
-- Customers could select their rows from orders directly, including each
-- item's original_price and profit. orders_public already strips those, so
-- make it the only customer path: it runs as its owner and filters to the
-- caller, and the direct customer policy on orders is removed. Admins keep
-- "Admins can read orders".

create or replace view public.orders_public
with (security_invoker = false) as
select
  o.id,
  o.user_id,
  o.created_at,
  clean.items,
  o.pre_discount_subtotal,
  o.subtotal,
  o.discount,
  o.shipping,
  o.total,
  o.customer_name,
  o.address,
  o.district,
  o.phone1,
  o.phone2,
  o.payment_method,
  o.status,
  o.status_log
from public.orders o
cross join lateral (
  select jsonb_agg((i.value - 'profit') - 'original_price') as items
  from jsonb_array_elements(o.items) as i(value)
) clean
where o.user_id = auth.uid();

revoke all on public.orders_public from anon, authenticated;
grant select on public.orders_public to authenticated;

drop policy if exists "Enable users to view their own data only" on public.orders;


-- ── 4. mark_order_delivered: trust the session, not the argument ──────
-- The old version matched o.user_id = p_user_id, an argument the caller
-- chooses, and was granted to anon. Now it uses auth.uid() and only accepts
-- shipped orders. The signature is unchanged so the current storefront keeps
-- working; p_user_id is ignored.

create or replace function public.mark_order_delivered(p_order_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders o
  set
    status = 'delivered',
    status_log = o.status_log || jsonb_build_array(
      jsonb_build_object(
        'status', 'delivered',
        'note', 'Confirmed delivered by customer',
        'at', now()
      )
    )
  where o.id = p_order_id
    and o.user_id = auth.uid()
    and o.status = 'shipped';

  if not found then
    raise exception 'Order not found, not yours, or not shipped yet';
  end if;
end;
$$;

revoke all on function public.mark_order_delivered(uuid, uuid) from public, anon;
grant execute on function public.mark_order_delivered(uuid, uuid) to authenticated;


-- ── 5. One source of truth for order status ───────────────────────────
-- The storefront reads status_log; the dashboard's lists and finance read
-- status. init_order_status already sets both on insert; this keeps status
-- equal to the latest status_log entry on every update.

create or replace function public.sync_order_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if jsonb_typeof(new.status_log) = 'array' and jsonb_array_length(new.status_log) > 0 then
    new.status := new.status_log -> -1 ->> 'status';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_order_status on public.orders;
create trigger trg_sync_order_status
before update on public.orders
for each row execute function public.sync_order_status();


-- ── 6. Stock tracking ─────────────────────────────────────────────────
-- products.stock (added in section 2): null = not tracked (in_stock flag
-- only); a number = units on hand, and in_stock follows it.

create or replace function public.sync_in_stock()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.stock is not null then
    new.in_stock := new.stock > 0;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_in_stock on public.products;
create trigger trg_sync_in_stock
before insert or update on public.products
for each row execute function public.sync_in_stock();

-- Marks orders whose stock/sold_count were taken by reserve_stock, so
-- cancelling an older order doesn't "return" stock it never took.
alter table public.orders
  add column if not exists stock_reserved boolean not null default false;

-- Called by the create-order edge function before inserting an order.
-- All-or-nothing: if any item lacks stock, nothing changes.
-- p_items: [{"product_id": "<uuid>", "qty": 2}, …]
create or replace function public.reserve_stock(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  for item in
    select (e ->> 'product_id')::uuid as product_id, (e ->> 'qty')::int as qty
    from jsonb_array_elements(p_items) e
  loop
    update public.products
    set stock = case when stock is null then null else stock - item.qty end,
        sold_count = coalesce(sold_count, 0) + item.qty
    where id = item.product_id
      and (stock is null or stock >= item.qty);

    if not found then
      raise exception 'insufficient_stock for product %', item.product_id;
    end if;
  end loop;
end;
$$;

-- Undoes reserve_stock (failed order insert, or order cancelled).
create or replace function public.release_stock(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  for item in
    select (e ->> 'product_id')::uuid as product_id, (e ->> 'qty')::int as qty
    from jsonb_array_elements(p_items) e
  loop
    update public.products
    set stock = case when stock is null then null else stock + item.qty end,
        sold_count = greatest(coalesce(sold_count, 0) - item.qty, 0)
    where id = item.product_id;
  end loop;
end;
$$;

revoke all on function public.reserve_stock(jsonb) from public, anon, authenticated;
revoke all on function public.release_stock(jsonb) from public, anon, authenticated;
grant execute on function public.reserve_stock(jsonb) to service_role;
grant execute on function public.release_stock(jsonb) to service_role;

-- Put stock back when an order that reserved it is cancelled.
create or replace function public.release_stock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.release_stock(new.items);
  return new;
end;
$$;

drop trigger if exists trg_release_stock_on_cancel on public.orders;
create trigger trg_release_stock_on_cancel
after update on public.orders
for each row
when (
  new.status = 'cancelled'
  and old.status is distinct from 'cancelled'
  and old.stock_reserved
)
execute function public.release_stock_on_cancel();

-- Superseded by reserve_stock (from an earlier draft of this file).
drop function if exists public.increment_sold_count(uuid, int);


-- ── 7. Let customers create their profile row ─────────────────────────
-- handle_new_user creates it at sign-up, but accounts that predate that
-- trigger have none, and the profile page falls back to inserting one.

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (user_id = auth.uid());


-- ── 8. Product images: viewers are read-only ──────────────────────────
-- The upload/delete policies allowed any admin_users row, including
-- viewers. Reads stay open to dashboard users (the bucket's public URLs
-- serve images to shoppers regardless).

drop policy if exists "Admins can manage product images 16wiy3a_0" on storage.objects;
drop policy if exists "Admins can manage product images 16wiy3a_2" on storage.objects;
drop policy if exists "Managers can delete product images" on storage.objects;
drop policy if exists "Managers can upload product images" on storage.objects;

create policy "Managers can delete product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and public.current_admin_role() in ('admin', 'super_admin')
);

create policy "Managers can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.current_admin_role() in ('admin', 'super_admin')
);


-- ── 9. Close the legacy products2 table ───────────────────────────────
-- Not used by either app, but publicly readable (and writable grants were
-- left in place). Access is removed; the data is kept. Drop it yourself
-- once you've confirmed nothing needs it:
--   drop table public.products2;

drop policy if exists "Enable read access for all users" on public.products2;
revoke all on public.products2 from anon, authenticated;


-- ── 10. Optional: backfill sold_count from past orders ────────────────
-- Before this file nothing updated sold_count, so "Best Sellers" was
-- ordered by zeros. Uncomment to recompute it from non-cancelled orders
-- (overwrites current values):
--
-- update public.products p
-- set sold_count = coalesce(s.qty, 0)
-- from (
--   select (i ->> 'product_id')::uuid as product_id, sum((i ->> 'qty')::int) as qty
--   from public.orders o, jsonb_array_elements(o.items) i
--   where o.status <> 'cancelled'
--   group by 1
-- ) s
-- where s.product_id = p.id;
