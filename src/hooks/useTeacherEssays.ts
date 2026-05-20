import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TeacherEssay {
  shareId: string;
  essayId: string;
  title: string;
  studentName: string;
  studentId: string;
  prompt: string | null;
  content: string;
  wordCount: number;
  status: string;
  teacherStatus: string;
  teacherNotes: string | null;
  aiScore: number | null;
  aiAnalysis: any;
  sharedAt: string;
  updatedAt: string;
}

export const useTeacherEssays = () => {
  return useQuery({
    queryKey: ["teacher-essays"],
    queryFn: async (): Promise<TeacherEssay[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: shares, error } = await (supabase as any)
        .from("essay_teacher_shares")
        .select("id, essay_feedback_id, teacher_status, teacher_notes, shared_at, student_id")
        .eq("teacher_id", user.id)
        .order("shared_at", { ascending: false });

      if (error) throw error;
      if (!shares || shares.length === 0) return [];

      const essayIds = shares.map((s: any) => s.essay_feedback_id);
      const studentIds = [...new Set(shares.map((s: any) => s.student_id as string))];

      const [{ data: essays, error: essayError }, { data: profiles, error: profileError }] =
        await Promise.all([
          (supabase as any)
            .from("essay_feedback")
            .select("id, essay_title, essay_prompt, essay_content, status, ai_analysis, updated_at")
            .in("id", essayIds),
          supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", studentIds),
        ]);

      if (essayError) throw essayError;
      if (profileError) throw profileError;

      return shares.map((share: any) => {
        const essay = essays?.find((e: any) => e.id === share.essay_feedback_id);
        const profile = profiles?.find((p: any) => p.user_id === share.student_id);
        return {
          shareId: share.id,
          essayId: share.essay_feedback_id,
          title: essay?.essay_title ?? "Untitled",
          studentName: profile?.full_name ?? "Unknown Student",
          studentId: share.student_id,
          prompt: essay?.essay_prompt ?? null,
          content: essay?.essay_content ?? "",
          wordCount: essay?.essay_content?.split(/\s+/).filter(Boolean).length ?? 0,
          status: essay?.status ?? "pending",
          teacherStatus: share.teacher_status ?? "pending",
          teacherNotes: share.teacher_notes ?? null,
          aiScore: essay?.ai_analysis?.overall_score ?? null,
          aiAnalysis: essay?.ai_analysis ?? null,
          sharedAt: share.shared_at,
          updatedAt: essay?.updated_at ?? share.shared_at,
        };
      });
    },
  });
};

export const useUpdateTeacherEssayNotes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shareId, teacherNotes, teacherStatus }: {
      shareId: string;
      teacherNotes?: string;
      teacherStatus?: string;
    }) => {
      const update: any = {};
      if (teacherNotes !== undefined) update.teacher_notes = teacherNotes;
      if (teacherStatus !== undefined) update.teacher_status = teacherStatus;

      const { error } = await (supabase as any)
        .from("essay_teacher_shares")
        .update(update)
        .eq("id", shareId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-essays"] });
    },
  });
};
