CREATE TABLE IF NOT EXISTS public.evaluation_results (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT,
  universities   TEXT[],
  story_score    JSONB,
  university_fit JSONB,
  roadmap        JSONB,
  essay_snapshot TEXT NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluation_results ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Students can view their own evaluation results"
    ON public.evaluation_results FOR SELECT
    USING (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Students can insert their own evaluation results"
    ON public.evaluation_results FOR INSERT
    WITH CHECK (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Students can delete their own evaluation results"
    ON public.evaluation_results FOR DELETE
    USING (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
