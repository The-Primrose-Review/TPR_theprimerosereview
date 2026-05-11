CREATE OR REPLACE FUNCTION public.get_school_name_by_invite(invite_code_param TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.name
  FROM public.counselor_invites ci
  JOIN public.profiles p ON p.user_id = ci.counselor_id
  JOIN public.schools s ON s.id = p.school_id
  WHERE ci.invite_code = invite_code_param
    AND ci.is_active = TRUE
  LIMIT 1
$$;
