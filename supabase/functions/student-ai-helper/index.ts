import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { essayContent, essayPrompt } = await req.json();

    // Authenticate the student via their JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL            = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY       = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANTHROPIC_API_KEY2      = Deno.env.get("ANTHROPIC_API_KEY2");
    const LOVABLE_API_KEY         = Deno.env.get("LOVABLE_API_KEY");

    // Resolve student identity from JWT
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch student profile + onboarding answers via service role
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const [{ data: profile }, { data: onboarding }] = await Promise.all([
      admin.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
      admin.from("onboarding_answers").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    const firstName = profile?.full_name?.split(" ")[0] || "the student";

    // Build a rich personality profile from onboarding data
    const lines: string[] = [];
    if (onboarding) {
      if (onboarding.age_range)         lines.push(`Grade / level: ${onboarding.age_range}`);
      if (onboarding.gender)            lines.push(`Gender: ${onboarding.gender}`);
      if (onboarding.degree_type)       lines.push(`Degree they are pursuing: ${onboarding.degree_type}`);
      if (onboarding.university_name)   lines.push(`Target university: ${onboarding.university_name}`);
      if (onboarding.program)           lines.push(`Intended major / program: ${onboarding.program}`);
      if (onboarding.career_goals)      lines.push(`Career goals: ${onboarding.career_goals}`);
      if (onboarding.background)        lines.push(`Personal background: ${onboarding.background}`);
      if (onboarding.personal_strengths)lines.push(`Core strengths / superpowers: ${onboarding.personal_strengths}`);
      if (onboarding.inspiration)       lines.push(`People who inspire them: ${onboarding.inspiration}`);
      if (onboarding.personal_story)    lines.push(`Personal story they shared: ${onboarding.personal_story}`);
      if (onboarding.degree_interest)   lines.push(`Why they want this degree: ${onboarding.degree_interest}`);
      if (onboarding.years_experience)  lines.push(`Years of relevant experience: ${onboarding.years_experience}`);

      // Also pull any freeform answers from the JSON blob
      if (onboarding.answers && typeof onboarding.answers === "object") {
        for (const [key, val] of Object.entries(onboarding.answers as Record<string, unknown>)) {
          if (typeof val === "string" && val.trim().length > 3) {
            lines.push(`${key.replace(/_/g, " ")}: ${val.trim()}`);
          }
        }
      }
    }

    const studentProfile = lines.length > 0
      ? lines.join("\n")
      : "No onboarding profile yet — give thoughtful general college essay guidance.";

    // ── Prompts ──────────────────────────────────────────────────────────────

    const hasEssay = Boolean(essayContent?.trim());

    const systemPromptBase = `You are a warm, sharp personal essay coach helping ${firstName} write a compelling college personal statement. You know this student well — their background, interests, strengths, and aspirations — because they shared the following profile during onboarding:

--- STUDENT PROFILE ---
${studentProfile}
-----------------------

Your job is to give PERSONALISED, specific suggestions tied directly to their actual background. Think like a coach who knows them personally and can see the unique story only they can tell.

Core rules:
- Never write sentences or paragraphs for the student — only suggest ideas, angles, and what to include
- Always anchor suggestions in something specific from their profile (e.g. "Since you mentioned football…" or "Your strength in X is a great hook because…")
- Be warm, encouraging, and direct — no fluff`;

    const systemPrompt = hasEssay
      ? `${systemPromptBase}

The student has shared their draft. Analyse it carefully against their profile.

If you find genuine areas to strengthen (weak hook, missed personal detail, underdeveloped theme, etc.):
- Return 1–4 targeted suggestions in this format:

**[Short punchy title]**
[2–3 sentences explaining the suggestion and why it works for this specific student]

If the essay is already compelling, authentic, and well-rooted in their story — skip the suggestion format entirely. Instead write a warm, specific 3–5 sentence message telling them exactly what is working and why it's strong. Be concrete — name the specific moments, phrases, or angles that land well.

Nothing else — no intro filler, no outro.`
      : `${systemPromptBase}

Return exactly 4 compelling opening angles or ideas they could take for their personal statement. Format each as:

**[Short punchy title]**
[2–3 sentences explaining the suggestion and why it works for this specific student]

Nothing else — no intro, no outro, just the 4 suggestions.`;

    const userPrompt = hasEssay
      ? `${essayPrompt ? `Essay prompt: "${essayPrompt}"\n\n` : ""}Here is what ${firstName} has written so far:\n\n"${essayContent}"\n\nAnalyse this draft and give targeted feedback based on their profile. If it's already strong, say so specifically.`
      : `${essayPrompt ? `Essay prompt: "${essayPrompt}"\n\n` : ""}${firstName} hasn't written anything yet. Based on their profile, suggest 4 compelling angles or opening ideas they could take for their personal statement.`;

    // ── Call Anthropic (primary) ─────────────────────────────────────────────

    let content: string | null = null;

    if (ANTHROPIC_API_KEY2) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": ANTHROPIC_API_KEY2,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          content = data.content?.[0]?.text ?? null;
          if (content) console.log("Anthropic response received");
          else console.warn("Empty Anthropic response — falling back to Gemini");
        } else {
          console.warn(`Anthropic error ${res.status} — falling back to Gemini`);
        }
      } catch (err) {
        console.warn("Anthropic request failed:", err, "— falling back to Gemini");
      }
    }

    // ── Fallback: Gemini 2.5 Flash ───────────────────────────────────────────

    if (!content && LOVABLE_API_KEY) {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.8,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          content = data.choices?.[0]?.message?.content ?? null;
          if (content) console.log("Gemini fallback response received");
          else console.error("Empty Gemini response");
        } else {
          console.error(`Gemini error ${res.status}`);
        }
      } catch (err) {
        console.error("Gemini fallback failed:", err);
      }
    }

    if (!content) {
      return new Response(JSON.stringify({ error: "AI service unavailable. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ suggestions: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in student-ai-helper:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
