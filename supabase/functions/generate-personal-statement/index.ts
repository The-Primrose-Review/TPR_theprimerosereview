import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    const rateLimitError = await checkRateLimit(userId, 'generate-personal-statement', 10);
    if (rateLimitError) return rateLimitError;

    const { answers } = await req.json();

    if (!answers || typeof answers !== 'object') {
      return new Response(
        JSON.stringify({ error: 'No answers provided or invalid format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dynamicFields = [];

    if (answers.gender) dynamicFields.push(`- Gender: ${answers.gender}`);
    if (answers.age_range) dynamicFields.push(`- Age: ${answers.age_range}`);
    if (answers.degree_type) dynamicFields.push(`- Degree Type: ${answers.degree_type}`);
    if (answers.inspiration) dynamicFields.push(`- Inspiration: ${answers.inspiration}`);
    if (answers.personal_story || answers.challenge) {
      dynamicFields.push(`- Personal Story (free text): ${answers.personal_story || answers.challenge}`);
    }
    if (answers.degree_interest) dynamicFields.push(`- Motivation for this degree (free text): ${answers.degree_interest}`);
    if (answers.universities || answers.university_name) {
      dynamicFields.push(`- University: ${answers.universities || answers.university_name}`);
    }
    if (answers.background) dynamicFields.push(`- Background: ${answers.background}`);
    if (answers.career_goals) dynamicFields.push(`- Career Goals: ${answers.career_goals}`);
    if (answers.personal_strengths) dynamicFields.push(`- Personal Strengths: ${answers.personal_strengths}`);
    if (answers.years_experience) dynamicFields.push(`- Years Experience: ${answers.years_experience}`);
    if (answers.program) dynamicFields.push(`- Program: ${answers.program}`);
    if (answers.field_of_study) dynamicFields.push(`- Field of Study: ${answers.field_of_study}`);

    if (answers.answers && typeof answers.answers === 'object') {
      Object.entries(answers.answers).forEach(([key, value]) => {
        if (value && value !== '') {
          dynamicFields.push(`- ${key}: ${value}`);
        }
      });
    }

    const systemPrompt = 'You are an expert at writing compelling personal statements for university applications. You create highly personalized, authentic statements that showcase the applicant\'s unique story, motivations, and fit for their chosen program.';

    const userPrompt = `Using the following user-provided inputs:
${dynamicFields.length > 0 ? dynamicFields.join('\n') : '- No additional details provided'}

Write a professional and compelling personal statement suitable for a university application.

You must:
- Use the free-text responses ("personal story" and "motivation") directly in the essay. Integrate their language and content authentically and meaningfully.
- Base the narrative on the user's background and personal inputs.

Ensure the statement follows these criteria:
1. Clarity and Focus – Answers the question clearly and stays on topic.
2. Structure and Organization – Has a logical flow with introduction, body, and conclusion.
3. Content and Originality – Demonstrates unique insights and perspective.
4. Grammar and Style – Is grammatically correct and written in a formal, effective style.
5. Relevance and Examples – Uses concrete examples (especially from the user's own input).
6. Personal Voice – Sounds authentic and reflects the user's own experience and voice.
7. University-Specific Criteria – Adapt if ${answers.universities || answers.university_name || 'the university'} is specified.
8. Word Count Compliance – Stay between 350 to 650 words if no other limit is given.`;

    console.log("Calling AI to generate personal statement");

    const personalStatement = await callAI({
      systemPrompt,
      userPrompt,
      model: 'claude-sonnet-4-6',
      maxTokens: 1024,
    });

    if (!personalStatement) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate personal statement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Successfully generated personal statement");

    return new Response(
      JSON.stringify({ personalStatement }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in generate-personal-statement function:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
