import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCelebration } from "@/hooks/useCelebration";
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisIssue, AnalysisResult, FeedbackItem } from "@/hooks/useEssayFeedback";

export type { AnalysisIssue, AnalysisResult, FeedbackItem };

export interface TeacherEssayInput {
  shareId: string;
  essayId: string;
  title: string;
  studentName: string;
  studentId: string;
  prompt: string | null;
  content: string;
}

export function useTeacherEssayFeedback(essay: TeacherEssayInput, isOpen: boolean, onClose: () => void) {
  const { toast } = useToast();
  const { celebrate, activeEvent } = useCelebration();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [manualNote, setManualNote] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const init = async () => {
        const alreadyAnalyzed = await loadExistingFeedback();
        if (!alreadyAnalyzed) analyzeEssay();
      };
      init();
    }
  }, [isOpen]);

  const loadExistingFeedback = async (): Promise<boolean> => {
    try {
      const { data, error } = await (supabase as any)
        .from('essay_teacher_shares')
        .select('feedback_items, personal_message, ai_analysis, track_changes')
        .eq('id', essay.shareId)
        .single();

      if (error) throw error;

      if (data) {
        setFeedbackItems((data.feedback_items as unknown as FeedbackItem[]) || []);
        setPersonalMessage(data.personal_message || "");

        if (data.ai_analysis) {
          setAnalysis(data.ai_analysis as unknown as AnalysisResult);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  const analyzeEssay = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-essay', {
        body: { essayContent: essay.content, prompt: essay.prompt }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysis(data);
      toast({
        title: "Analysis Complete",
        description: `Found ${data.issues.length} areas for improvement`,
      });
    } catch (error) {
      console.error("Analysis error — continuing without AI:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addToFeedback = (issue: AnalysisIssue) => {
    const exists = feedbackItems.some(item => item.id === issue.id);
    if (exists) {
      toast({ title: "Already Added", description: "This issue is already in your feedback" });
      return;
    }
    setFeedbackItems(prev => [...prev, {
      id: issue.id,
      text: `[${issue.problemType}] ${issue.problemDescription} Recommendation: ${issue.recommendation}`,
      source: 'ai',
      criterionName: issue.criterionName,
      color: issue.color,
      startIndex: issue.startIndex,
      endIndex: issue.endIndex,
    }]);
    toast({ title: "Added to Feedback" });
  };

  const addManualNote = () => {
    if (!manualNote.trim()) return;
    setFeedbackItems(prev => [...prev, {
      id: `manual-${Date.now()}`,
      text: manualNote,
      source: 'manual',
    }]);
    setManualNote("");
  };

  const removeFeedbackItem = (id: string) => {
    setFeedbackItems(prev => prev.filter(item => item.id !== id));
  };

  const saveFeedback = async (
    status: 'draft' | 'in_progress' | 'sent',
    trackedChanges: { id: string; originalText: string; suggestedText: string; startIndex: number; endIndex: number }[],
  ) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: updateError } = await (supabase as any)
        .from('essay_teacher_shares')
        .update({
          feedback_items:   JSON.parse(JSON.stringify(feedbackItems)),
          track_changes:    JSON.parse(JSON.stringify(trackedChanges)),
          ai_analysis:      analysis ? JSON.parse(JSON.stringify(analysis)) : null,
          personal_message: personalMessage || null,
          teacher_status:   status === 'sent' ? 'reviewed' : 'reviewing',
          sent_at:          status === 'sent' ? new Date().toISOString() : null,
        })
        .eq('id', essay.shareId);

      if (updateError) throw updateError;

      toast({
        title: status === 'sent' ? "Feedback Sent!" : "Draft Saved",
        description: status === 'sent' ? "Feedback has been sent to the student" : "Saved as draft",
      });

      if (status === 'sent') {
        celebrate('feedback_sent');
        try {
          const [{ data: studentProfile }, { data: teacherProfile }] = await Promise.all([
            supabase.from('profiles').select('email').eq('user_id', essay.studentId).maybeSingle(),
            supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle(),
          ]);

          const { data: { session } } = await supabase.auth.getSession();
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-teacher-feedback`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({
                studentEmail:    studentProfile?.email || 'no-email@unknown.com',
                studentName:     essay.studentName,
                teacherName:     teacherProfile?.full_name || 'Your teacher',
                essayLabel:      essay.title,
                personalMessage: personalMessage || '',
                appUrl:          window.location.origin,
              }),
            }
          );
        } catch (notifyError) {
          console.error('Failed to send teacher feedback notification:', notifyError);
        }
        onClose();
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Could not save feedback",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isAnalyzing,
    isSaving,
    analysis,
    feedbackItems,
    manualNote,
    setManualNote,
    personalMessage,
    setPersonalMessage,
    hoveredCommentId,
    setHoveredCommentId,
    activeEvent,
    addToFeedback,
    addManualNote,
    removeFeedbackItem,
    saveFeedback,
  };
}
