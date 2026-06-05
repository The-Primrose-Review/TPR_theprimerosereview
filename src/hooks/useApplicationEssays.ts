import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type {
  ApplicationEssaySlot,
  ApplicationEssaySlotWithDraft,
  CreateApplicationEssaySlotPayload,
  EssaySlotStatus,
} from "@/types/applicationEssays";

export const applicationEssayKeys = {
  all:            () => ["application_essays"] as const,
  byApplication:  (appId: string) => ["application_essays", appId] as const,
};

export const useApplicationEssays = (applicationId: string | null) => {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data: slots, isLoading, error } = useQuery({
    queryKey: applicationEssayKeys.byApplication(applicationId ?? ""),
    enabled: !!applicationId,
    queryFn: async (): Promise<ApplicationEssaySlotWithDraft[]> => {
      const { data: slotData, error: slotError } = await supabase
        .from("application_essays")
        .select("*")
        .eq("application_id", applicationId!)
        .order("display_order", { ascending: true });

      if (slotError) throw slotError;
      if (!slotData || slotData.length === 0) return [];

      const feedbackIds = slotData
        .map((s) => s.essay_feedback_id)
        .filter((id): id is string => !!id);

      let feedbackMap: Record<string, ApplicationEssaySlotWithDraft["essay_feedback"]> = {};

      if (feedbackIds.length > 0) {
        const { data: feedbackData, error: feedbackError } = await supabase
          .from("essay_feedback")
          .select("id, essay_title, essay_content, essay_prompt, status, ai_analysis, personal_message, created_at, updated_at, sent_at")
          .in("id", feedbackIds);

        if (feedbackError) throw feedbackError;

        feedbackMap = Object.fromEntries(
          (feedbackData ?? []).map((fb) => [fb.id, fb])
        );
      }

      return slotData.map((slot) => ({
        ...(slot as ApplicationEssaySlot),
        essay_feedback: slot.essay_feedback_id
          ? (feedbackMap[slot.essay_feedback_id] ?? null)
          : null,
      }));
    },
  });

  // ── Invalidation helper ────────────────────────────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: applicationEssayKeys.byApplication(applicationId ?? ""),
    });
    queryClient.invalidateQueries({ queryKey: ["applications"] });
  };

  // ── Create single slot ─────────────────────────────────────────────────────
  const createSlot = useMutation({
    mutationFn: async (payload: CreateApplicationEssaySlotPayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("application_essays")
        .insert({
          application_id: payload.application_id,
          student_id: user.id,
          essay_label: payload.essay_label,
          essay_prompt: payload.essay_prompt ?? null,
          word_limit: payload.word_limit ?? null,
          display_order: payload.display_order ?? 0,
          status: "not_started",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast({ title: "Essay slot added" }); },
    onError: (err: Error) => toast({ title: "Failed to add slot", description: err.message, variant: "destructive" }),
  });

  // ── Create multiple slots ──────────────────────────────────────────────────
  const createSlots = useMutation({
    mutationFn: async (payloads: CreateApplicationEssaySlotPayload[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const rows = payloads.map((p, i) => ({
        application_id: p.application_id,
        student_id: user.id,
        essay_label: p.essay_label,
        essay_prompt: p.essay_prompt ?? null,
        word_limit: p.word_limit ?? null,
        display_order: p.display_order ?? i,
        status: "not_started",
      }));

      const { data, error } = await supabase
        .from("application_essays")
        .insert(rows)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, payloads) => {
      const appId = payloads[0]?.application_id;
      if (appId) queryClient.invalidateQueries({ queryKey: applicationEssayKeys.byApplication(appId) });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({ title: `${payloads.length} essay slot(s) created` });
    },
    onError: (err: Error) => toast({ title: "Failed to create slots", description: err.message, variant: "destructive" }),
  });

  // ── Update slot status ─────────────────────────────────────────────────────
  const updateSlotStatus = useMutation({
    mutationFn: async ({ slotId, status }: { slotId: string; status: EssaySlotStatus }) => {
      const { data, error } = await supabase
        .from("application_essays")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", slotId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
    onError: (err: Error) => toast({ title: "Failed to update status", description: err.message, variant: "destructive" }),
  });

  // ── Sync slot status from essay_feedback status ────────────────────────────
  // Called after counselor sends feedback (essay_feedback.status → 'sent')
  // Maps essay_feedback status → application_essays slot status:
  //   'sent'        → 'in_review'   (counselor sent feedback, student to review)
  //   'in_progress' → 'draft'
  //   'draft'       → 'draft'
  const syncSlotFromFeedbackStatus = useMutation({
    mutationFn: async ({
      essayFeedbackId,
      feedbackStatus,
    }: {
      essayFeedbackId: string;
      feedbackStatus: string;
    }) => {
      // Map essay_feedback status → slot status
      const slotStatus: EssaySlotStatus =
        feedbackStatus === "sent" ? "in_review" : "draft";

      const { data, error } = await supabase
        .from("application_essays")
        .update({ status: slotStatus, updated_at: new Date().toISOString() })
        .eq("essay_feedback_id", essayFeedbackId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
    onError: (err: Error) => toast({ title: "Failed to sync slot status", description: err.message, variant: "destructive" }),
  });

  // ── Link essay_feedback to slot ────────────────────────────────────────────
  const linkEssayToSlot = useMutation({
    mutationFn: async ({ slotId, essayFeedbackId }: { slotId: string; essayFeedbackId: string }) => {
      const { data, error } = await supabase
        .from("application_essays")
        .update({
          essay_feedback_id: essayFeedbackId,
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", slotId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast({ title: "Essay linked to application" }); },
    onError: (err: Error) => toast({ title: "Failed to link essay", description: err.message, variant: "destructive" }),
  });

  // ── Unlink essay from slot ─────────────────────────────────────────────────
  const unlinkEssayFromSlot = useMutation({
    mutationFn: async (slotId: string) => {
      const { data, error } = await supabase
        .from("application_essays")
        .update({ essay_feedback_id: null, status: "not_started", updated_at: new Date().toISOString() })
        .eq("id", slotId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
    onError: (err: Error) => toast({ title: "Failed to unlink essay", description: err.message, variant: "destructive" }),
  });

  // ── Delete slot ────────────────────────────────────────────────────────────
  const deleteSlot = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase
        .from("application_essays")
        .delete()
        .eq("id", slotId);

      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: "Essay slot removed" }); },
    onError: (err: Error) => toast({ title: "Failed to delete slot", description: err.message, variant: "destructive" }),
  });

  // ── Derived counts ─────────────────────────────────────────────────────────
  const totalSlots      = slots?.length ?? 0;
  const approvedSlots   = slots?.filter((s) => s.status === "approved").length ?? 0;
  const notStartedSlots = slots?.filter((s) => s.status === "not_started").length ?? 0;
  const draftSlots      = slots?.filter((s) => s.status === "draft").length ?? 0;
  const inReviewSlots   = slots?.filter((s) => s.status === "in_review").length ?? 0;
  const sentSlots       = slots?.filter((s) => s.status === "sent").length ?? 0;

  return {
    slots: slots ?? [],
    isLoading,
    error,
    createSlot,
    createSlots,
    updateSlotStatus,
    syncSlotFromFeedbackStatus,
    linkEssayToSlot,
    unlinkEssayFromSlot,
    deleteSlot,
    totalSlots,
    approvedSlots,
    notStartedSlots,
    draftSlots,
    inReviewSlots,
    sentSlots,
  };
};