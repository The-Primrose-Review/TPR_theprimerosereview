import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StudentProfile {
  citizenship: string;
  studyCountry: string;
  degreeType: string;
  fieldOfStudy: string;
  gpaRange: string;
  backgroundTags: string[];
}

interface MatchResult {
  scholarshipId: string;
  matchLevel: 'high' | 'possible' | 'reach';
  matchScore: number;
  matchReason: string;
  personalizedTips: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, scholarshipList } = await req.json() as {
      profile: StudentProfile;
      scholarshipList: string;
    };

    if (!profile || !scholarshipList) {
      return new Response(
        JSON.stringify({ error: "Profile and scholarship list are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an expert college scholarship advisor with deep knowledge of global scholarship programs. Your job is to analyze a student's profile and match them to the most relevant scholarships from a curated list.

MATCHING RULES:
- "high" match (score 75–100): Student clearly meets the core eligibility criteria (citizenship, degree type, study destination, GPA expectations)
- "possible" match (score 50–74): Student meets most criteria but one factor is uncertain or borderline (e.g. slightly lower GPA, indirect field match)
- "reach" match (score 25–49): Student could apply but faces a significant eligibility gap or high competition
- EXCLUDE: If a scholarship has a hard eligibility wall the student cannot overcome (e.g. must be US citizen and student is not), do NOT include it at all

MATCH REASON: 1–2 sharp sentences explaining WHY this is a match (or stretch). Be specific — reference the student's actual citizenship, field, background tags. Sound like a trusted advisor, not a bot.

PERSONALIZED TIPS: 2–3 concrete, actionable tips for THIS student for THIS scholarship. Reference their specific background (GPA, field, tags). Tips should help them strengthen their application, not generic advice.

IMPORTANT:
- Return between 5 and 10 matches maximum — quality over quantity
- Sort by matchScore descending
- Be honest: if a student with 3.0 GPA applies for Rhodes, it's a reach, say so clearly
- Only return scholarships from the provided list (use the exact ID given)

Return ONLY this JSON, no markdown:
{
  "matches": [
    {
      "scholarshipId": "...",
      "matchLevel": "high|possible|reach",
      "matchScore": 85,
      "matchReason": "...",
      "personalizedTips": ["...", "...", "..."]
    }
  ]
}`;

    const userPrompt = `Student Profile:
- Citizenship: ${profile.citizenship}
- Where they want to study: ${profile.studyCountry}
- Degree level: ${profile.degreeType}
- Field of study: ${profile.fieldOfStudy}
- GPA range: ${profile.gpaRange}
- Background: ${profile.backgroundTags.length > 0 ? profile.backgroundTags.join(', ') : 'No specific tags provided'}

Available Scholarships (one per line, pipe-separated fields):
${scholarshipList}

Analyze the student's profile against each scholarship. Return the top 5–10 most relevant matches with honest match levels, specific reasons, and personalized tips. Exclude any scholarships where the student is categorically ineligible.`;

    const content = await callAI({
      systemPrompt,
      userPrompt,
      maxTokens: 2048,
      fallbackToGemini: true,
      temperature: 0.4,
    });

    if (!content) {
      return new Response(
        JSON.stringify({ error: "AI matching failed" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: { matches: MatchResult[] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI matching result" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in scholarship-match:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
