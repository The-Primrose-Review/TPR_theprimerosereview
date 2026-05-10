import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI } from "../_shared/ai-client.ts";
import { authenticate, checkRateLimit } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DimensionScore {
  score: number;
  insight: string;
}

interface LabFeedback {
  authenticity: DimensionScore;
  specificity: DimensionScore;
  voice: DimensionScore;
  narrativeStrength: DimensionScore;
  memorability: DimensionScore;
  overallLabel: string;
  overallSummary: string;
  suggestedActions: string[];
}

interface Direction {
  title: string;
  angle: string;
  example: string;
  explanation: {
    why: string;
    what: string;
  };
}

interface ExploreResult {
  directions: Direction[];
}

interface ActionSuggestions {
  suggestions: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, error: authError } = await authenticate(req);
    if (authError) return authError;

    const rateLimitError = await checkRateLimit(userId, 'lab-feedback', 20);
    if (rateLimitError) return rateLimitError;

    const { text, mode, action, studentContext } = await req.json();

    if (!text?.trim()) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let systemPrompt: string;
    let userPrompt: string;
    let maxTokens = 1024;

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

    } else if (mode === 'explore') {
      maxTokens = 2048;

      systemPrompt = `You are a college essay coach helping a student see different directions their opening could take — without rewriting it for them.

Given a student's paragraph, generate exactly 3 distinct directions they could explore. The directions must always be:
1. Story-driven: Drop into a specific scene, moment, or action
2. Reflective: Start with a question, tension, or internal conflict
3. Bold / Direct: Cut the setup — make a strong, unexpected claim or statement

For each direction:
- Write a SHORT EXAMPLE paragraph (3-4 sentences) that demonstrates the direction
- The example must feel like a genuine student voice — vivid, imperfect, human. NOT polished marketing copy.
- It should be clearly directional, not a finished "best version". The student should want to improve on it.

CRITICAL: These examples are meant to spark thinking, not be copied. Keep them slightly rough.

Return ONLY this JSON, no markdown:
{
  "directions": [
    {
      "title": "Story-driven",
      "angle": "One sentence describing this approach",
      "example": "The example paragraph here",
      "explanation": {
        "why": "Why this approach works for admissions readers (1 sentence)",
        "what": "What changed from the original (1 sentence)"
      }
    },
    {
      "title": "Reflective",
      "angle": "...",
      "example": "...",
      "explanation": { "why": "...", "what": "..." }
    },
    {
      "title": "Bold / Direct",
      "angle": "...",
      "example": "...",
      "explanation": { "why": "...", "what": "..." }
    }
  ]
}`;

      userPrompt = `Student's paragraph:
"${text}"
${studentContext ? `\nStudent context (use to make examples more relevant to who they are):\n${studentContext}` : ''}

Generate 3 directional examples. Each must be clearly different. Keep them imperfect and human — not polished.`;

    } else {
      const contextBlock = studentContext
        ? `\nSTUDENT CONTEXT (use this to personalise the overallSummary — reference who they are, their story, their goals):\n${studentContext}\n`
        : '';

      systemPrompt = `You are a sharp, honest college essay coach with deep knowledge of what top admissions officers actually look for. Students send you 1-5 sentences — usually a hook or opening. You give direct, slightly provocative feedback that sounds like a trusted insider, not a teacher.
${contextBlock}
Rate across 5 dimensions (score each 0-100):
- authenticity: Does this feel like a real person, not a crafted persona? Reward vulnerability, honest self-awareness. Penalise "ever since I was young", "I have always been passionate", anything that sounds written for an application.
- specificity: Are there concrete details? Reward names, places, moments, numbers, sensory images. Penalise vague generalisations, abstract claims without evidence.
- voice: Does this sound like one specific human being? Reward distinctive rhythm, word choice, point of view. Penalise neutral, polished, "essay-voice" writing that could belong to anyone.
- narrativeStrength: Does this open a story worth following? Reward tension, movement, a clear "so what". Penalise summaries, lists, statements that describe rather than show.
- memorability: Would an admissions officer remember this paragraph tomorrow morning? Reward surprising angles, unusual perspectives, images that stick. Penalise forgettable openings, overused metaphors.

overall = average of the five scores, rounded to integer.

GAMIFICATION LABEL — pick exactly one:
- "Strong Hook" if overall 75+
- "Promising" if overall 60-74
- "Needs Work" if overall 40-59
- "Blends In" if overall below 40

INSIGHT RULES — this is critical:
Every insight MUST have two parts in one sentence:
1. A sharp critique (max 12 words, direct, slightly provocative, references the actual text)
2. A concrete writing move (1 sentence, starts with an action verb: start, replace, name, show, cut, add, etc.)
Format: "[Critique]. [Writing move]."

Examples of GOOD insights:
- "This reads like a resume, not a life. Start with one specific moment — a day, a door, a decision."
- "The word 'passionate' carries all the weight here. Name the specific thing you built, fixed, or lost instead."
- "Strong — the sensory detail makes this land. Push it further by adding what you heard or smelled."
- "Zero reason to keep reading after sentence one. Give the reader a question they need answered before they can stop."
- "I've seen this opening in hundreds of essays. Replace the abstract claim with one concrete scene from that experience."

overallSummary: 2-3 sharp insider sentences. Write as if briefing a trusted counselor — the kind of honest take an admissions officer would give in private. If student context is provided, connect the feedback to who this student actually is.

suggestedActions: 4-6 action labels (max 4 words each), chosen based on what THIS specific text most needs. Examples: "Make it more personal", "Add tension", "Start in the middle", "Cut the cliché", "Add a specific detail", "Raise the stakes", "Try a different opening", "Find your real voice", "Show don't tell", "Add sensory detail", "Name what you lost", "Make the stakes concrete"

Return ONLY this JSON, no markdown:
{
  "authenticity": { "score": N, "insight": "..." },
  "specificity": { "score": N, "insight": "..." },
  "voice": { "score": N, "insight": "..." },
  "narrativeStrength": { "score": N, "insight": "..." },
  "memorability": { "score": N, "insight": "..." },
  "overallLabel": "Strong Hook|Promising|Needs Work|Blends In",
  "overallSummary": "...",
  "suggestedActions": ["...", "...", "...", "...", "..."]
}`;

      userPrompt = `Evaluate this essay opening:

"${text}"

Be honest. Return only the JSON.`;
    }

    const content = await callAI({ systemPrompt, userPrompt, maxTokens, fallbackToGemini: true });

    if (!content) {
      return new Response(
        JSON.stringify({ error: "AI evaluation failed" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: LabFeedback | ExploreResult | ActionSuggestions;
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
