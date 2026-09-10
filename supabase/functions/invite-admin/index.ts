// Supabase Edge Function: invite-admin
//
// Deploy with:  supabase functions deploy invite-admin
// Requires these secrets to be set on your Supabase project (Project Settings
// > Edge Functions > Secrets), NOT in your frontend .env:
//   SUPABASE_URL              (auto-provided by the platform)
//   SUPABASE_ANON_KEY         (auto-provided by the platform)
//   SUPABASE_SERVICE_ROLE_KEY (auto-provided by the platform)
//
// This project uses Google OAuth ONLY for authentication — there is no
// password-based login. This function:
//   1. Verifies the caller is already an authenticated admin (checks their
//      JWT against the admin_users table using the ANON key, respecting RLS).
//   2. If they are:
//      - If the email belongs to an EXISTING auth user (e.g. someone who has
//        already signed in with Google), just adds them to admin_users.
//      - If the email is new, creates a placeholder auth user directly via
//        the SERVICE ROLE key (no email sent, no password set). When that
//        person later signs in with Google using the same email, Supabase
//        links their Google identity to this same user record instead of
//        creating a duplicate — as long as auto-linking on matching email is
//        enabled in your project's Auth settings.
//
// The service_role key never leaves this server-side function.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Client scoped to the calling user's JWT — used only to verify identity.
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
      .select("user_id, role")
      .eq("user_id", caller.id)
      .maybeSingle();

    if (!callerAdminRow) {
      return json({ error: "Not authorized to invite admins" }, 403);
    }

    const { email, role } = await req.json();
    if (!email || typeof email !== "string") {
      return json({ error: "email is required" }, 400);
    }
    const normalizedEmail = email.trim().toLowerCase();

    // Admin client with elevated privileges — only ever used here, server-side.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Look for an existing auth user with this email first (e.g. someone
    // who has already signed in with Google before being made an admin).
    let userId: string | null = null;
    const existingUser = await findUserByEmail(adminClient, normalizedEmail);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // No existing auth account. Create a placeholder auth user with
      // email_confirm: true so that when this person signs in with Google
      // using the same email, Supabase links their Google identity to THIS
      // user record instead of creating a separate one. No password is set —
      // this project uses Google OAuth only, the user never logs in any
      // other way, and no email is sent by this call.
      const { data: created, error: createError } =
        await adminClient.auth.admin.createUser({
          email: normalizedEmail,
          email_confirm: true,
        });

      if (createError || !created?.user) {
        return json(
          { error: createError?.message ?? "Failed to create user" },
          400
        );
      }
      userId = created.user.id;
    }

    // Avoid duplicate admin_users rows if they're somehow already in there.
    const { data: alreadyAdmin } = await adminClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (alreadyAdmin) {
      return json({ error: "User is already an admin" }, 409);
    }

    const { error: insertError } = await adminClient.from("admin_users").insert({
      user_id: userId,
      email: normalizedEmail,
      role: role ?? "admin",
    });

    if (insertError) {
      return json({ error: insertError.message }, 400);
    }

    return json(
      {
        user_id: userId,
        email: normalizedEmail,
        created_new_auth_user: !existingUser,
      },
      200
    );
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

// Paginates through auth users to find one by email.
// (supabase-js's listUsers doesn't support filtering by email directly,
// so we page through results and match. Fine for typical admin-panel-sized
// user bases; for very large ones consider querying auth.users via a
// database function/RPC with an indexed lookup instead.)
async function findUserByEmail(
  adminClient: ReturnType<typeof createClient>,
  email: string
) {
  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;

    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;

    if (data.users.length < perPage) return null; // last page reached
  }
  return null;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}