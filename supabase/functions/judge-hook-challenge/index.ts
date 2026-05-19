import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-client.ts";
import { authenticate, checkRateLimit } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, error: authError } = await authenticate(req);
    if (authError) return authError;

    const rateLimitError = await checkRateLimit(userId, 'judge-hook-challenge', 10);
    if (rateLimitError) return rateLimitError;

    const { hookText, challengeId, challengeTheme } = await req.json();

    if (!hookText || !challengeId) {
      return new Response(
        JSON.stringify({ error: "hookText and challengeId are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an expert college admissions essay hook judge. Your job is to evaluate a short essay hook (1–3 sentences) submitted for a weekly student writing competition.

A great hook: opens with immediacy, establishes a unique personal voice, creates a question or tension the reader wants resolved, and is crisp and clear.

Evaluate on exactly 5 criteria:
1. Personal Voice & Authenticity (id: "voice", color: "#8B5CF6") — Does it sound like a real, specific person?
2. Storytelling & Structure (id: "storytelling", color: "#F97316") — Does it open mid-scene or with compelling tension?
3. Self-Reflection & Growth (id: "reflection", color: "#0EA5E9") — Does it hint at introspection or deeper meaning?
4. Impact & Memorability (id: "impact", color: "#10B981") — Will an admissions reader remember this opening?
5. Grammar & Clarity (id: "grammar", color: "#EF4444") — Is it clean, precise, and easy to read?

Return ONLY a JSON object with this exact structure (no markdown, no extra text):
{
  "overallScore": <number 0-100>,
  "criteria": [
    {"id": "voice", "name": "Personal Voice & Authenticity", "score": <0-100>, "color": "#8B5CF6"},
    {"id": "storytelling", "name": "Storytelling & Structure", "score": <0-100>, "color": "#F97316"},
    {"id": "reflection", "name": "Self-Reflection & Growth", "score": <0-100>, "color": "#0EA5E9"},
    {"id": "impact", "name": "Impact & Memorability", "score": <0-100>, "color": "#10B981"},
    {"id": "grammar", "name": "Grammar & Clarity", "score": <0-100>, "color": "#EF4444"}
  ],
  "feedback": "<2-3 sentence overall assessment of the hook>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>"]
}`;

    const userPrompt = `Judge this college essay hook${challengeTheme ? ` for the weekly theme: "${challengeTheme}"` : ''}:

"${hookText}"`;

    const content = await callAI({ systemPrompt, userPrompt, maxTokens: 1024, fallbackToGemini: true });

    if (!content) {
      return new Response(
        JSON.stringify({ error: "AI judging failed — please try again" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let judgeResult: any;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        judgeResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON in AI response");
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Upsert: insert or update if student already submitted to this challenge
    const { data: submission, error: upsertError } = await supabase
      .from('challenge_submissions')
      .upsert(
        {
          challenge_id: challengeId,
          student_id: userId,
          hook_text: hookText,
          ai_scores: judgeResult,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'challenge_id,student_id' }
      )
      .select('id')
      .single();

    if (upsertError) {
      console.error("Failed to save submission:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to save your submission" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compute live rank among all scored submissions
    const { data: allSubmissions } = await supabase
      .from('challenge_submissions')
      .select('id, ai_scores')
      .eq('challenge_id', challengeId)
      .not('ai_scores', 'is', null);

    const ranked = (allSubmissions ?? [])
      .filter(s => s.ai_scores?.overallScore != null)
      .sort((a, b) => b.ai_scores.overallScore - a.ai_scores.overallScore);

    const rank = ranked.findIndex(s => s.id === submission.id) + 1;

    return new Response(
      JSON.stringify({ ...judgeResult, submissionId: submission.id, rank, totalSubmissions: ranked.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in judge-hook-challenge:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
