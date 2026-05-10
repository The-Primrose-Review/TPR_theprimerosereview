import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Returns a 401 Response if the request has no valid JWT, or null if auth passed.
// Also returns the authenticated user's ID on success.
export async function authenticate(
  req: Request,
): Promise<{ userId: string; error: null } | { userId: null; error: Response }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return {
      userId: null,
      error: new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      userId: null,
      error: new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  return { userId: user.id, error: null };
}

// Checks whether userId has exceeded limitPerHour calls to functionName.
// Logs the current call if allowed.
// Returns a 429 Response if over limit, or null if the call is allowed.
export async function checkRateLimit(
  userId: string,
  functionName: string,
  limitPerHour: number,
): Promise<Response | null> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("api_usage_log")
    .select("id")
    .eq("user_id", userId)
    .eq("function_name", functionName)
    .gte("created_at", oneHourAgo)
    .limit(limitPerHour + 1);

  if (error) {
    // Fail open — don't block the user if the ledger is unavailable
    console.error("Rate limit check failed:", error);
    return null;
  }

  if ((data?.length ?? 0) >= limitPerHour) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please try again in an hour." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Log this call (best-effort, don't block on failure)
  supabase
    .from("api_usage_log")
    .insert({ user_id: userId, function_name: functionName, created_at: new Date().toISOString() })
    .then(({ error: logError }) => {
      if (logError) console.error("Failed to log API usage:", logError);
    });

  return null;
}
