-- ── Study Cost Planner: saved plans ──────────────────────────────────────────
-- One row per calculation a student explicitly saves.
-- Stores inputs + computed totals so history can be shown without recalculating.

CREATE TABLE IF NOT EXISTS public.cost_plans (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- inputs
  country             TEXT        NOT NULL,
  city                TEXT,                                                    -- null = no city selected
  degree              TEXT        NOT NULL CHECK (degree IN ('undergrad', 'masters', 'mba')),
  field_of_study      TEXT        NOT NULL,
  living_style        TEXT        NOT NULL CHECK (living_style IN ('budget', 'standard', 'premium')),
  duration_years      INTEGER     NOT NULL CHECK (duration_years BETWEEN 1 AND 10),
  city_multiplier     NUMERIC(4,2) NOT NULL DEFAULT 1.0,

  -- computed totals (snapshotted at save time)
  annual_min          INTEGER     NOT NULL,
  annual_max          INTEGER     NOT NULL,
  program_min         INTEGER     NOT NULL,
  program_max         INTEGER     NOT NULL,
  monthly_living_min  INTEGER     NOT NULL,
  monthly_living_max  INTEGER     NOT NULL,
  affordability       TEXT        CHECK (affordability IN ('affordable', 'moderate', 'high')),

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cost_plans_student_id  ON public.cost_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_cost_plans_created_at  ON public.cost_plans(created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.cost_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_insert_own_cost_plans"
  ON public.cost_plans FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "students_select_own_cost_plans"
  ON public.cost_plans FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "students_delete_own_cost_plans"
  ON public.cost_plans FOR DELETE
  USING (auth.uid() = student_id);
