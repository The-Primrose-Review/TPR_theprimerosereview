import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DimensionScore {
  score: number;
  insight: string;
}

interface LabFeedback {
  clarity: DimensionScore;
  originality: DimensionScore;
  emotionalPull: DimensionScore;
  curiosity: DimensionScore;
  overallLabel: string;
  overallSummary: string;
  suggestedActions: string[];
}

interface ActionSuggestions {
  suggestions: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, mode, action } = await req.json();

    if (!text?.trim()) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY2 = Deno.env.get("ANTHROPIC_API_KEY2");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!ANTHROPIC_API_KEY2 && !LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let systemPrompt: string;
    let userPrompt: string;

    if (mode === 'suggest') {
      if (!action) {
        return new Response(
          JSON.stringify({ error: "Action is required for suggest mode" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      systemPrompt = `You are a sharp college essay coach. A student wants to apply one specific improvement to their opening. Give them 4-5 SPECIFIC, ACTIONABLE bullet points showing HOW to do it — referencing their actual text where possible.

RULES:
- Be concrete. No example sentences or rewrites — directions only.
- Each bullet: max 25 words. Start each with an action verb.
- If the action doesn't fit the text well, say so honestly in the first bullet.
- Reference specific words or phrases from the student's text when giving direction.

Return ONLY this JSON, no markdown:
{
  "suggestions": ["...", "...", "...", "...", "..."]
}`;

      userPrompt = `The student wants to: "${action}"

Their text:
"${text}"

Give 4-5 specific, concrete directions for how to apply this improvement. No sample sentences.`;

    } else {
      systemPrompt = `You are a sharp, honest college essay coach. Students send you 1-5 sentences — usually a hook or opening. You give direct, slightly provocative feedback. Be more like a brutally honest friend than a teacher.

Rate across 4 dimensions (score each 0-100):
- clarity: Is this immediately clear? One focused idea? Penalise vague language, cluttered ideas, unclear pronouns.
- originality: Would a reader have seen this before? Reward unusual angles, unexpected images, surprising word choices. Penalise clichés, "ever since I was young", "I have always been passionate".
- emotionalPull: Does this make the reader feel something? Reward vulnerability, tension, real stakes. Penalise generic emotion words like "amazing" or "inspired".
- curiosity: Does this make the reader want to read the next sentence? Reward mystery, unresolved tension, unexpected details.

overall = average of the four scores, rounded to integer.

GAMIFICATION LABEL — pick exactly one:
- "Strong Hook" if overall 75+
- "Promising" if overall 60-74
- "Needs Work" if overall 40-59
- "Blends In" if overall below 40

INSIGHT TONE RULES:
- Max 15 words per insight. Direct. Slightly provocative.
- BAD: "This could be more specific" — never write this
- GOOD: "I've read this exact opening in at least 500 essays"
- GOOD: "The word 'passionate' is doing all the heavy lifting here"
- GOOD: "Strong. The specific detail makes this feel real."

overallSummary: 1-2 honest sentences about the text overall. No filler.

suggestedActions: 4-6 action labels (max 4 words each), chosen based on what THIS specific text most needs. Pick from:
"Make it more personal", "Add tension", "Start in the middle", "Cut the cliché", "Add a specific detail", "Raise the stakes", "Try a different opening", "Find your real voice", "Show don't tell", "Add sensory detail", "Name what you lost", "Make the stakes concrete"

Return ONLY this JSON, no markdown:
{
  "clarity": { "score": N, "insight": "..." },
  "originality": { "score": N, "insight": "..." },
  "emotionalPull": { "score": N, "insight": "..." },
  "curiosity": { "score": N, "insight": "..." },
  "overallLabel": "Strong Hook|Promising|Needs Work|Blends In",
  "overallSummary": "...",
  "suggestedActions": ["...", "...", "...", "...", "..."]
}`;

      userPrompt = `Evaluate this essay opening:

"${text}"

Be honest. Return only the JSON.`;
    }

    let content: string | null = null;

    if (ANTHROPIC_API_KEY2) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
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

        if (response.ok) {
          const data = await response.json();
          content = data.content?.[0]?.text ?? null;
          if (content) console.log("Anthropic response received");
          else console.warn("Empty content from Anthropic, falling back");
        } else {
          const err = await response.text();
          console.warn(`Anthropic error ${response.status}: ${err} — falling back`);
        }
      } catch (err) {
        console.warn("Anthropic request failed:", err, "— falling back");
      }
    }

    if (!content && LOVABLE_API_KEY) {
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          content = data.choices?.[0]?.message?.content ?? null;
          if (content) console.log("Gemini fallback response received");
          else console.error("Empty content from Gemini fallback");
        } else {
          const err = await response.text();
          console.error(`Gemini fallback error ${response.status}: ${err}`);
        }
      } catch (err) {
        console.error("Gemini fallback failed:", err);
      }
    }

    if (!content) {
      return new Response(
        JSON.stringify({ error: "AI evaluation failed" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: LabFeedback | ActionSuggestions;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw content:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI evaluation" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in lab-feedback:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
