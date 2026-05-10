import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { selectedText, essayPrompt } = await req.json();

    if (!selectedText) {
      return new Response(
        JSON.stringify({ error: "selectedText is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a college admissions coach reviewing a passage from a student's personal statement. First identify which part of the essay narrative this passage represents (Hook, Context, Challenge, Turning Point, Growth, or Reflection). Then give 2-3 concise sentences of honest, actionable coaching — what's working and what to strengthen. Do NOT rewrite or suggest replacement sentences. Be warm but direct.
Format your response as:
**[Section type]:** [2-3 sentences of coaching]`;

    const userPrompt = `${essayPrompt ? `Essay Prompt: ${essayPrompt}\n\n` : ""}Student's selected passage:
"${selectedText}"

Identify the section type and give coaching feedback on this passage.`;

    const content = await callAI({ systemPrompt, userPrompt, maxTokens: 512 });

    if (!content) {
      return new Response(
        JSON.stringify({ error: "AI coaching failed" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ feedback: content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in coach-essay-section:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
