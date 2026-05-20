import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCounselorInvite = () => {
  return useQuery({
    queryKey: ["counselor-invite"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("counselor_invites")
        .select("invite_code")
        .eq("counselor_id", user.id)
        .eq("invite_role", "student")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // If no invite exists yet
      if (!data) {
        return null;
      }

      return `${window.location.origin}/signup?invite=${data.invite_code}`;
    }
  });
};