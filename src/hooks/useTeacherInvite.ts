import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTeacherInvite = () => {
  return useQuery({
    queryKey: ["teacher-invite"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await (supabase as any)
        .from("counselor_invites")
        .select("invite_code")
        .eq("counselor_id", user.id)
        .eq("invite_role", "teacher")
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return `${window.location.origin}/signup?role=teacher&invite=${data.invite_code}`;
    },
  });
};

export const useGenerateTeacherInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await (supabase as any)
        .from("counselor_invites")
        .select("invite_code")
        .eq("counselor_id", user.id)
        .eq("invite_role", "teacher")
        .maybeSingle();

      if (existing) {
        return `${window.location.origin}/signup?role=teacher&invite=${existing.invite_code}`;
      }

      const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 8);
      const { error } = await (supabase as any)
        .from("counselor_invites")
        .insert({ counselor_id: user.id, invite_code: inviteCode, invite_role: "teacher" });
      if (error) throw error;

      return `${window.location.origin}/signup?role=teacher&invite=${inviteCode}`;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-invite"] });
    },
  });
};
