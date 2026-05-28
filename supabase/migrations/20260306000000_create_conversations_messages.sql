-- conversations and messages tables must exist before RLS policies in 20260307
CREATE TABLE IF NOT EXISTS public.conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'urgent', 'archived')),
  tags         TEXT[],
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
