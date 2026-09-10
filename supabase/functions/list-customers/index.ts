// Supabase Edge Function: list-customers
//
// Deploy with:  supabase functions deploy list-customers
//
// Lists every signed-up (Google OAuth) auth user so the Customers tab can
// merge accounts with their orders (joined by orders.user_id on the
// frontend). Listing auth users requires the service_role key, which can't
// be used from the browser, so this runs server-side.
//
// Any logged-in admin/staff/viewer can call this (unlike invite-admin, this
// is read-only and not a sensitive account-management action — it's just
// customer data).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_PAGES = 50; // 50 * 1000 = up to 50,000 users
const PER_PAGE = 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !caller) {
      return json({ error: "Not authenticated" }, 401);
    }

    const { data: callerAdminRow } = await callerClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", caller.id)
      .maybeSingle();

    if (!callerAdminRow) {
      return json({ error: "Not authorized" }, 403);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const users: {
      user_id: string;
      email: string | null;
      full_name: string | null;
      avatar_url: string | null;
      created_at: string;
      last_sign_in_at: string | null;
    }[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const { data, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage: PER_PAGE,
      });
      if (error) return json({ error: error.message }, 400);

      data.users.forEach((u) =>
        users.push({
          user_id: u.id,
          email: u.email ?? null,
          full_name:
            (u.user_metadata?.full_name as string | undefined) ??
            (u.user_metadata?.name as string | undefined) ??
            null,
          avatar_url: (u.user_metadata?.avatar_url as string | undefined) ?? null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
        })
      );

      if (data.users.length < PER_PAGE) break; // last page reached
    }

    return json({ users }, 200);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
