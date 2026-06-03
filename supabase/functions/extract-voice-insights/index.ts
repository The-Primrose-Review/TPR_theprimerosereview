import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConversationTurn {
  role: "eva" | "student";
  text: string;
}

interface Insight {
  category: string;
  title: string;
  content: string;
}

const SYSTEM_PROMPT = `You are an expert college admissions analyst. Your job is to extract meaningful personal insights about a student from a conversation they had with Eva, an AI admissions coach.

IMPORTANT CONTEXT: You will only receive Eva's side of the conversation. Eva is an active listener who explicitly acknowledges, reflects back, and builds on what the student says before asking her next question. For example, if Eva says "That's incredible that you captained the debate team for two years and made it to nationals — how did that experience shape you?", you can confidently infer the student shared those specific facts. Extract insights from what Eva's responses reveal about the student — not from Eva herself.

You will receive Eva's transcript and must return a structured JSON object.

INSIGHT CATEGORIES to consider:
- Academic Interests
- Leadership & Initiative
- Personal Growth
- Values & Motivations
- Admissions Storytelling Potential
- Career Goals
- Intellectual Curiosity
- Community Impact
- Resilience & Challenges
- Family & Background

QUALITY ASSESSMENT RULES — base this on the richness of what Eva's responses reveal about the student:
- "strong": Eva's responses reflect substantial, personal details the student shared across multiple areas (6+ exchanges with specific acknowledgments)
- "average": Eva's responses reflect genuine personal details across a few areas (3–5 meaningful exchanges)
- "short": Eva's responses are too generic or brief to infer meaningful student details

INSIGHT RULES:
- strong quality → up to 5 insights
- average quality → 2 to 4 insights
- short quality → return an empty array (no insights)
- Only write insights clearly supported by what Eva reflects back — if Eva says "so you've been playing piano since age 6", that's confirmed student content
- Do not invent details Eva did not acknowledge
- Two solid insights are better than five vague ones

Return ONLY valid JSON in this exact shape, no other text:
{
  "quality": "strong" | "average" | "short",
  "insights": [
    {
      "category": "Category Name",
      "title": "Short one-line insight title",
      "content": "2–3 sentences describing what was learned and why it matters for their admissions journey."
    }
  ]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationHistory } = await req.json() as { conversationHistory: ConversationTurn[] };

    if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
      throw new Error("conversationHistory is required");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve user from JWT
    let studentId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      studentId = user?.id ?? null;
    }

    // Build transcript string for Claude
    const transcript = conversationHistory
      .map(turn => `[${turn.role === "eva" ? "Eva" : "Student"}]: ${turn.text}`)
      .join("\n\n");

    const studentTurns = conversationHistory.filter(t => t.role === "student");
    const userPrompt = `Here is the full conversation transcript. The student had ${studentTurns.length} speaking turn(s).\n\nTranscript:\n${transcript}\n\nExtract insights now.`;

    const raw = await callAI({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 1200,
      temperature: 0.3,
    });

    if (!raw) throw new Error("No response from AI");

    // Parse JSON — strip markdown fences if present
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let result: { quality: string; insights: Insight[] };
    try {
      result = JSON.parse(cleaned);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    const insights: Insight[] = Array.isArray(result.insights) ? result.insights : [];
    const quality = result.quality ?? "short";

    // Store in DB (non-blocking on failure)
    if (studentId) {
      const { error } = await supabase.from("voice_insights").insert({
        student_id: studentId,
        insights,
        quality,
      });
      if (error) console.error("DB insert error:", error);
    }

    return new Response(JSON.stringify({ insights, quality }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("extract-voice-insights error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
