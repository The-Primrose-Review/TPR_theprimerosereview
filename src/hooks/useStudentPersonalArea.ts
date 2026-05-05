import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import type { TrackedChange } from "@/components/EssayFeedbackModal";

type EssayFeedbackRow = Database["public"]["Tables"]["essay_feedback"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

// ── Types ─────────────────────────────────────────────────────

export interface FeedbackItem {
  id?: string;
  text: string;
  source?: "ai" | "manual";
  type?: "strength" | "suggestion";
  category?: string;
}

export interface CriterionScore {
  id: string;
  name: string;
  score: number;
  color: string;
}

export interface AnalysisIssue {
  id: string;
  criterionId: string;
  criterionName: string;
  color: string;
  startIndex: number;
  endIndex: number;
  highlightedText: string;
  problemType: string;
  problemDescription: string;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AnalysisResult {
  overallScore: number;
  criteria?: CriterionScore[] | Record<string, number>;
  issues?: AnalysisIssue[];
  strengths?: string[];
  improvements?: string[];
}

export interface EssayFeedback {
  id: string;
  essay_title: string;
  essay_content: string;
  essay_prompt: string | null;
  ai_analysis: AnalysisResult | null;
  feedback_items: FeedbackItem[];
  personal_message: string | null;
  track_changes: TrackedChange[];
  status: string;
  created_at: string;
  sent_at: string | null;
}

// ── Hook ──────────────────────────────────────────────────────

export const useStudentPersonalArea = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ── Essays (all essay_feedback rows for this student) ──────
  const {
    data: essays = [],
    isLoading: isLoadingEssays,
    error: essaysError,
  } = useQuery({
    queryKey: ["student-essays"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("essay_feedback")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row): EssayFeedback => ({
        id: row.id,
        essay_title: row.essay_title,
        essay_content: row.essay_content,
        essay_prompt: row.essay_prompt,
        ai_analysis: row.ai_analysis as unknown as AnalysisResult | null,
        feedback_items: (row.feedback_items as unknown as FeedbackItem[]) ?? [],
        personal_message: row.personal_message,
        track_changes: (row.track_changes as unknown as TrackedChange[]) ?? [],
        status: row.status,
        created_at: row.created_at,
        sent_at: row.sent_at,
      }));
    },
  });

  // ── Sent feedback (what the student actually sees) ─────────
  const {
    data: sentFeedback = [],
    isLoading: isLoadingFeedback,
    error: feedbackError,
  } = useQuery({
    queryKey: ["student-sent-feedback"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("essay_feedback")
        .select("*")
        .eq("student_id", user.id)
        .in("status", ["sent", "read"])
        .order("sent_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row): EssayFeedback => ({
        id: row.id,
        essay_title: row.essay_title,
        essay_content: row.essay_content,
        essay_prompt: row.essay_prompt,
        ai_analysis: row.ai_analysis as unknown as AnalysisResult | null,
        feedback_items: (row.feedback_items as unknown as FeedbackItem[]) ?? [],
        personal_message: row.personal_message,
        track_changes: (row.track_changes as unknown as TrackedChange[]) ?? [],
        status: row.status,
        created_at: row.created_at,
        sent_at: row.sent_at,
      }));
    },
  });

  // ── Tasks ──────────────────────────────────────────────────
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error: tasksError,
  } = useQuery({
    queryKey: ["student-tasks"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("student_id", user.id)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data as TaskRow[];
    },
  });

  // ── Mark task complete ─────────────────────────────────────
  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: true })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-tasks"] });
      toast({ title: "Task marked as complete" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  // ── Get feedback for a specific essay ─────────────────────
  const getFeedbackForEssay = (essayTitle: string): EssayFeedback[] =>
    sentFeedback.filter((fb) => fb.essay_title === essayTitle);

  return {
    essays,
    sentFeedback,
    tasks,
    isLoadingEssays,
    isLoadingFeedback,
    isLoadingTasks,
    essaysError,
    feedbackError,
    tasksError,
    completeTask,
    getFeedbackForEssay,
  };
};