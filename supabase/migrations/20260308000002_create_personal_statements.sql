CREATE TABLE IF NOT EXISTS public.personal_statements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT,
  content    TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.personal_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own personal statements"
  ON public.personal_statements FOR ALL
  USING (auth.uid() = user_id);
