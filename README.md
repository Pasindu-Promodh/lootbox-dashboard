# Pickio dashboard

Admin dashboard for the Pickio store: products, bulk import, orders, finance, customers and admin users. React 19 + MUI + Vite on Supabase. Deployed to `https://pasindu-promodh.github.io/lootbox-dashboard/`.

## Local development

```bash
cp .env.example .env   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_REDIRECT_TO (optional)
npm install
npm run dev            # http://localhost:5173/lootbox-dashboard/
```

`VITE_REDIRECT_TO` defaults to the current page URL. Whatever is used must be in Supabase → Authentication → Redirect URLs.

## Access control

Sign-in is Google OAuth. A user can use the dashboard only if they have a row in `admin_users`:

| Role | Can do |
| --- | --- |
| `super_admin` | Everything, including inviting, re-roling and removing admins |
| `admin` | Manage products, categories and orders |
| `viewer` | Read-only |

The UI hides actions by role, but **the database enforces it**: RLS policies in `supabase-sql/` and role checks in the edge functions. Apply the SQL in this order in the Supabase SQL editor:

1. `admin_users_policies.sql` (also defines `current_admin_role()`)
2. `viewer_readonly_policies.sql`
3. `security_hardening.sql`:
   - last-super-admin guard
   - cost prices hidden from the public
   - customers read orders only through `orders_public`
   - `mark_order_delivered` uses the session user
   - `status` kept in sync with `status_log`
   - stock tracking
   - profile inserts
   - viewer-proof image policies
   - `products2` locked down

All three are re-runnable and were tested against a copy of the live schema. Apply them **before** deploying the dashboard, because the product form sends the new `stock` column.

## Stock

A product's `stock` is optional. Leave it empty to manage availability with the In Stock switch, or set a number: orders reduce it (atomically, via the storefront's `create-order`), cancelling an order returns it, and In Stock turns off at 0.

## Edge functions

```bash
supabase functions deploy invite-admin
supabase functions deploy list-customers
```

- `invite-admin`: super admins only; adds a user (creating a placeholder auth user if needed) to `admin_users`.
- `list-customers`: any admin; lists auth users for the Customers tab.

Both allow browser calls only from `localhost:5173` and the GitHub Pages origin (`ALLOWED_ORIGINS`).

## Deploying

Pushing to `main` lints, builds and publishes `dist/` to `gh-pages`. Repository secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_REDIRECT_TO`.
