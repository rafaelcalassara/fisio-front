import { withSupabase } from "@supabase/server";

// Example secure API handler using @supabase/server
// Auth mode "user" requires valid JWT (RLS applies)
// Use ctx.supabase for user-scoped queries
// Use ctx.supabaseAdmin for admin bypass (careful!)

export default {
  fetch: withSupabase({ auth: "user" }, async (req: Request, ctx: any) => {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    if (action === "list") {
      // Example: fetch user's app state (uses RLS via ctx.supabase)
      const { data, error } = await ctx.supabase
        .from("app_state")
        .select("*")
        .limit(1);

      if (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
      return Response.json({ data, user: ctx.user });
    }

    if (action === "admin-list") {
      // Admin example (bypasses RLS) - only for trusted code
      const { data, error } = await ctx.supabaseAdmin
        .from("app_state")
        .select("*")
        .limit(5);

      if (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
      return Response.json({ data });
    }

    return Response.json({ message: "Unknown action" }, { status: 400 });
  }),
};

// For Supabase Edge Functions, you can deploy with:
// supabase functions deploy secure-api
// Set verify_jwt = true in config.toml for "user" auth (default for JWT)