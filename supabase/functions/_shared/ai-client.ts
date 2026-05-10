const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export async function callAI(options: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  fallbackToGemini?: boolean;
  temperature?: number;
}): Promise<string | null> {
  const {
    systemPrompt,
    userPrompt,
    model = DEFAULT_MODEL,
    maxTokens = 4096,
    fallbackToGemini = false,
    temperature = 0.7,
  } = options;

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY2");
  const lovableKey = fallbackToGemini ? Deno.env.get("LOVABLE_API_KEY") : undefined;

  let content: string | null = null;

  if (anthropicKey) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        content = data.content?.[0]?.text ?? null;
        if (content) console.log(`Anthropic response received (${model})`);
        else console.warn("Empty Anthropic response");
      } else {
        const err = await response.text();
        console.warn(`Anthropic error ${response.status}: ${err}`);
      }
    } catch (err) {
      console.warn("Anthropic request failed:", err);
    }
  }

  if (!content && fallbackToGemini && lovableKey) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        content = data.choices?.[0]?.message?.content ?? null;
        if (content) console.log("Gemini fallback response received");
        else console.error("Empty Gemini response");
      } else {
        const err = await response.text();
        console.error(`Gemini fallback error ${response.status}: ${err}`);
      }
    } catch (err) {
      console.error("Gemini fallback failed:", err);
    }
  }

  return content;
}
