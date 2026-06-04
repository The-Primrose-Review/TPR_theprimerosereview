CREATE TABLE IF NOT EXISTS public.voice_insights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insights    JSONB NOT NULL DEFAULT '[]',
  quality     TEXT CHECK (quality IN ('strong', 'average', 'short')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.voice_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert their own voice insights"
  ON public.voice_insights FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own voice insights"
  ON public.voice_insights FOR SELECT
  USING (auth.uid() = student_id);
