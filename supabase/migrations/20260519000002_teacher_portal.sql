-- ─── Teacher Portal Migration ────────────────────────────────────────────────

-- 1. Add teacher to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';

-- 2. Teacher profiles table — one row per teacher auth user, linked to a school
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id  UUID REFERENCES public.schools(id),
  subject    TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- 3. Essay-teacher shares — created when student explicitly picks teacher or both
CREATE TABLE IF NOT EXISTS public.essay_teacher_shares (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_feedback_id UUID NOT NULL REFERENCES public.essay_feedback(id) ON DELETE CASCADE,
  teacher_id        UUID NOT NULL REFERENCES auth.users(id),
  student_id        UUID NOT NULL REFERENCES auth.users(id),
  teacher_notes     TEXT,
  teacher_status    TEXT DEFAULT 'pending',
  shared_at         TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(essay_feedback_id, teacher_id)
);

-- 4. Add invite_role to counselor_invites so counselors can also generate teacher invite links
ALTER TABLE public.counselor_invites
  ADD COLUMN IF NOT EXISTS invite_role TEXT DEFAULT 'student';

-- ─── RLS: teacher_profiles ───────────────────────────────────────────────────
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own profile"
  ON public.teacher_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Counselors and principals can view teacher profiles at their school"
  ON public.teacher_profiles FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can view teachers at their school"
  ON public.teacher_profiles FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- ─── RLS: essay_teacher_shares ───────────────────────────────────────────────
ALTER TABLE public.essay_teacher_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can share their own essays"
  ON public.essay_teacher_shares FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view essays shared with them"
  ON public.essay_teacher_shares FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "Teachers can update their own notes and status"
  ON public.essay_teacher_shares FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());
