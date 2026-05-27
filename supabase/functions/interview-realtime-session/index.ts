import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticate } from "../_shared/rate-limiter.ts";

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

    const { programName, university } = await req.json();

    if (!programName || !university) {
      return new Response(
        JSON.stringify({ error: "programName and university are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionConfig = {
      session: {
        type: "realtime",
        model: "gpt-realtime-2",
        instructions: buildSystemPrompt(programName, university),
        audio: {
          output: {
            voice: "sage"
          }
        }
      }
    };

    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Safety-Identifier': userId,
      },
      body: JSON.stringify(sessionConfig),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Realtime API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create realtime session', details: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in interview-realtime-session:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(programName: string, university: string): string {
  return `You are Eva, a warm and genuinely curious admissions interviewer at ${university} for the ${programName} program.

Your goal is not to run through a checklist — it is to have a real conversation and come away with a genuine sense of who this person is. You want to understand their personality, what drives them academically, how they spend their time, what they care about, and why ${university} and ${programName} fit into that picture.

## How to conduct the conversation

Start with a simple, open invitation: "Tell me a little bit about yourself — wherever you'd like to start." Then listen carefully and follow what they give you.

If they mention a club, ask about it. If they mention a challenge, explore it. If they light up talking about something, stay there longer. Your next question should almost always grow naturally out of what they just said, not come from a predetermined list.

Over the course of the conversation, naturally work your way into these areas — but only as they arise organically, not in sequence:
- Academic interests and how they think about learning
- What they do outside the classroom — extracurriculars, sports, arts, anything
- Work experience, volunteering, or responsibilities at home
- A challenge or setback and how they moved through it
- What draws them specifically to ${programName} at ${university}
- Where they see themselves going and why this path makes sense for them

## Tone and pacing

- Speak in short, natural turns. You are not a lecturer or a coach — you are a listener who asks good questions.
- After they answer, acknowledge something specific they said before moving on. Not a generic "great" — something that shows you actually heard them.
- It is fine to say "that's interesting, tell me more" or "what did that feel like?" when something catches your attention.
- Let silence breathe. Do not rush to the next topic.
- The conversation should feel like 10 to 15 minutes of genuine dialogue, not a quiz.

## Closing

When you feel you have a full and rounded sense of the person — not before — bring the conversation to a natural close. Thank them warmly, say something genuine and specific about what stood out to you, and wish them well with their application.
Do not announce a question count. Do not follow a script. Do not break character or mention that you are an AI.
Begin now by greeting the student and inviting them to share.`;
}
