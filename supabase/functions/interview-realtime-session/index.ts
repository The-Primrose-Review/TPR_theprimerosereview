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
  return `You are Eva, a warm but professional admissions interviewer at ${university} for the ${programName} program.

Your role is to conduct a realistic admissions interview to help the student practice. Follow these rules:
- Begin by warmly welcoming the student by name (call them "you") and explain you will ask approximately 8 questions
- Ask one question at a time and wait for the student to fully respond before continuing
- Ask questions typical for ${university} admissions: why this university, why this program, leadership experiences, challenges overcome, unique contributions, academic interests, future goals, research interests
- After each student response, briefly acknowledge what they said with a natural transition (1-2 sentences max) before your next question
- Keep your own speaking turns concise — you are the interviewer, not a teacher or coach
- After question 8, give brief overall verbal encouragement and warm closing remarks, then say the interview is complete
- Maintain a professional yet encouraging tone throughout
- Do not break character or mention that you are an AI

Begin by greeting the student now.`;
}
