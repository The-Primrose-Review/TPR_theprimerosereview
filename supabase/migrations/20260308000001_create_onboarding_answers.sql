CREATE TABLE IF NOT EXISTS public.onboarding_answers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id        TEXT,
  answers             JSONB,
  gender              TEXT,
  age_range           TEXT,
  degree_type         TEXT,
  degree_interest     TEXT,
  inspiration         TEXT,
  personal_story      TEXT,
  university_name     TEXT,
  program             TEXT,
  background          TEXT,
  career_goals        TEXT,
  personal_strengths  TEXT,
  years_experience    TEXT,
  completed           BOOLEAN,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.onboarding_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own onboarding answers"
  ON public.onboarding_answers FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert onboarding answers"
  ON public.onboarding_answers FOR INSERT
  WITH CHECK (true);

CREATE TRIGGER update_onboarding_answers_updated_at
  BEFORE UPDATE ON public.onboarding_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
