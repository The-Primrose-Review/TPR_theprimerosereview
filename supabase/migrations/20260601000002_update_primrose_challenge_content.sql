-- Update the active challenge to The Primrose Challenge branding and content
UPDATE public.weekly_challenges
SET
  title = 'The Primrose Challenge: The Moment Everything Changed',
  description = 'Every memorable college essay begins with a moment that reveals something unique about you.

Think about a challenge you faced. It could be personal, academic, professional, or anything else that shaped who you are today. Your task is to write the first 1 to 3 sentences of that story.

Use the Primrose Lab to refine your opening, then submit it to the Primrose Challenge.',
  example_prompt = 'Don''t start with what you learned. Start with what happened.',
  ends_at = '2026-06-15 23:59:59+00'
WHERE is_active = true;
