import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Star,
  MessageSquare,
  Clock,
  CheckCircle,
  Eye,
  Loader2,
  Strikethrough,
} from "lucide-react";
import { format } from "date-fns";
import type { TrackedChange } from "@/components/EssayFeedbackModal";

interface FeedbackItem {
  id: string;
  text: string;
  source: 'ai' | 'manual';
  criterionName?: string;
  color?: string;
}

interface CriterionScore {
  id: string;
  name: string;
  score: number;
  color: string;
}

interface AnalysisResult {
  overallScore: number;
  criteria: CriterionScore[];
  issues: any[];
}

interface EssayFeedback {
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

interface TeacherFeedbackItem {
  shareId: string;
  essayId: string;
  essayTitle: string;
  essayContent: string;
  feedbackItems: FeedbackItem[];
  trackChanges: TrackedChange[];
  aiAnalysis: AnalysisResult | null;
  personalMessage: string | null;
  sentAt: string;
}

export const StudentEssayFeedback = () => {
  const [feedbackList, setFeedbackList] = useState<EssayFeedback[]>([]);
  const [teacherFeedbackList, setTeacherFeedbackList] = useState<TeacherFeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackSource, setFeedbackSource] = useState<'counselor' | 'teacher'>('counselor');
  const { toast } = useToast();

  useEffect(() => {
    loadFeedback();

    const channel = supabase
      .channel('student-feedback')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'essay_feedback' }, () => {
        loadFeedback();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'essay_teacher_shares' }, () => {
        loadFeedback();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadFeedback = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [counselorResult, teacherSharesResult] = await Promise.all([
        supabase.from('essay_feedback').select('*').in('status', ['sent', 'read', 'approved']).order('sent_at', { ascending: false }),
        (supabase as any)
          .from('essay_teacher_shares')
          .select('id, essay_feedback_id, feedback_items, track_changes, ai_analysis, personal_message, sent_at')
          .eq('student_id', user.id)
          .eq('teacher_status', 'reviewed'),
      ]);

      if (counselorResult.error) throw counselorResult.error;

      const typedCounselorData = (counselorResult.data || []).map((item: any) => ({
        id: item.id,
        essay_title: item.essay_title,
        essay_content: item.essay_content,
        essay_prompt: item.essay_prompt,
        ai_analysis: item.ai_analysis as unknown as AnalysisResult | null,
        feedback_items: (item.feedback_items as unknown as FeedbackItem[]) || [],
        personal_message: item.personal_message,
        track_changes: (item.track_changes as unknown as TrackedChange[]) || [],
        status: item.status,
        created_at: item.created_at,
        sent_at: item.sent_at,
      }));
      setFeedbackList(typedCounselorData);

      const teacherShares = teacherSharesResult.data || [];
      if (teacherShares.length > 0) {
        const essayIds = teacherShares.map((s: any) => s.essay_feedback_id);
        const { data: essays } = await supabase
          .from('essay_feedback')
          .select('id, essay_title, essay_content')
          .in('id', essayIds);

        const mapped: TeacherFeedbackItem[] = teacherShares.map((share: any) => {
          const essay = essays?.find((e: any) => e.id === share.essay_feedback_id);
          return {
            shareId: share.id,
            essayId: share.essay_feedback_id,
            essayTitle: essay?.essay_title ?? 'Untitled',
            essayContent: essay?.essay_content ?? '',
            feedbackItems: (share.feedback_items as FeedbackItem[]) || [],
            trackChanges: (share.track_changes as TrackedChange[]) || [],
            aiAnalysis: share.ai_analysis as AnalysisResult | null,
            personalMessage: share.personal_message ?? null,
            sentAt: share.sent_at,
          };
        });
        setTeacherFeedbackList(mapped);

        // Default to teacher tab if no counselor feedback
        if (typedCounselorData.length === 0) setFeedbackSource('teacher');
      } else {
        setTeacherFeedbackList([]);
      }
    } catch (error) {
      console.error("Error loading feedback:", error);
      toast({ title: "Error", description: "Could not load feedback", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (feedbackId: string) => {
    try {
      await supabase.from('essay_feedback').update({ status: 'read' }).eq('id', feedbackId);
      loadFeedback();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (feedbackList.length === 0 && teacherFeedbackList.length === 0) {
    return null;
  }

  const showToggle = feedbackList.length > 0 && teacherFeedbackList.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Essay Feedback
        </h2>
        {showToggle && (
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setFeedbackSource('counselor')}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all ${
                feedbackSource === 'counselor'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Counselor
            </button>
            <button
              onClick={() => setFeedbackSource('teacher')}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all ${
                feedbackSource === 'teacher'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Teacher
            </button>
          </div>
        )}
      </div>

      {/* Counselor Feedback */}
      {feedbackSource === 'counselor' && (
        <div className="grid gap-4">
          {feedbackList.map((feedback) => (
            <Card
              key={feedback.id}
              className={`transition-all hover:shadow-md ${
                feedback.status === 'sent' ? 'border-primary/50 bg-primary/5' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{feedback.essay_title}</h3>
                      {feedback.status === 'sent' && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                      {feedback.status === 'read' && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Read
                        </Badge>
                      )}
                    </div>
                    {feedback.ai_analysis && (
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-primary" />
                          <span className="font-bold text-lg">{feedback.ai_analysis.overallScore}/100</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {feedback.feedback_items.length} feedback items
                        </span>
                      </div>
                    )}
                    {feedback.personal_message && (
                      <p className="text-sm text-muted-foreground italic line-clamp-2 mb-3">
                        "{feedback.personal_message}"
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {feedback.sent_at && format(new Date(feedback.sent_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (feedback.status === 'sent') markAsRead(feedback.id);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[800px] h-[80vh] p-0 flex flex-col">
                      <DialogHeader className="p-6 pb-4">
                        <DialogTitle>{feedback.essay_title}</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="flex-1 p-6 pt-0">
                        <FeedbackDetailContent
                          aiAnalysis={feedback.ai_analysis}
                          personalMessage={feedback.personal_message}
                          personalMessageLabel="Message from your counselor:"
                          feedbackItems={feedback.feedback_items}
                          trackChanges={feedback.track_changes}
                          essayContent={feedback.essay_content}
                          changeAuthorLabel="counselor"
                        />
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Teacher Feedback */}
      {feedbackSource === 'teacher' && (
        <div className="grid gap-4">
          {teacherFeedbackList.map((tf) => (
            <Card key={tf.shareId} className="transition-all hover:shadow-md border-blue-200/50 bg-blue-50/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{tf.essayTitle}</h3>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Teacher</Badge>
                    </div>
                    {tf.aiAnalysis && (
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-primary" />
                          <span className="font-bold text-lg">{tf.aiAnalysis.overallScore}/100</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {tf.feedbackItems.length} feedback items
                        </span>
                      </div>
                    )}
                    {tf.personalMessage && (
                      <p className="text-sm text-muted-foreground italic line-clamp-2 mb-3">
                        "{tf.personalMessage}"
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {tf.sentAt && format(new Date(tf.sentAt), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[800px] h-[80vh] p-0 flex flex-col">
                      <DialogHeader className="p-6 pb-4">
                        <DialogTitle>{tf.essayTitle}</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="flex-1 p-6 pt-0">
                        <FeedbackDetailContent
                          aiAnalysis={tf.aiAnalysis}
                          personalMessage={tf.personalMessage}
                          personalMessageLabel="Message from your teacher:"
                          feedbackItems={tf.feedbackItems}
                          trackChanges={tf.trackChanges}
                          essayContent={tf.essayContent}
                          changeAuthorLabel="teacher"
                        />
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface FeedbackDetailContentProps {
  aiAnalysis: AnalysisResult | null;
  personalMessage: string | null;
  personalMessageLabel: string;
  feedbackItems: FeedbackItem[];
  trackChanges: TrackedChange[];
  essayContent: string;
  changeAuthorLabel: string;
}

const FeedbackDetailContent = ({
  aiAnalysis,
  personalMessage,
  personalMessageLabel,
  feedbackItems,
  trackChanges,
  essayContent,
  changeAuthorLabel,
}: FeedbackDetailContentProps) => (
  <div className="space-y-6">
    {aiAnalysis && (
      <div className="text-center pb-4 border-b">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
          <Star className="h-6 w-6 text-primary" />
          <span className="font-bold text-2xl">{aiAnalysis.overallScore}/100</span>
        </div>
      </div>
    )}

    {personalMessage && (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-primary mb-2">{personalMessageLabel}</p>
          <p className="text-foreground">{personalMessage}</p>
        </CardContent>
      </Card>
    )}

    {aiAnalysis?.criteria && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {aiAnalysis.criteria.map((criterion) => (
            <div key={criterion.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: criterion.color }} />
                  <span>{criterion.name}</span>
                </div>
                <span className="font-medium">{criterion.score}/100</span>
              </div>
              <Progress value={criterion.score} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    )}

    {trackChanges?.length > 0 && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Strikethrough className="h-4 w-4" />
            Suggested Edits ({trackChanges.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            Your {changeAuthorLabel} suggested the following changes to your essay:
          </p>
          <div className="p-3 bg-muted/30 rounded-lg text-sm leading-relaxed">
            {(() => {
              const changes = [...trackChanges].sort((a, b) => a.startIndex - b.startIndex);
              const parts: React.ReactNode[] = [];
              let lastIdx = 0;
              for (const change of changes) {
                if (change.startIndex < lastIdx) continue;
                if (change.startIndex > lastIdx) {
                  parts.push(<span key={`t-${lastIdx}`}>{essayContent.slice(lastIdx, change.startIndex)}</span>);
                }
                parts.push(
                  <span key={`c-${change.id}`} className="inline">
                    <del className="text-red-500 bg-red-50 line-through px-0.5 rounded-sm">{change.originalText}</del>
                    <ins className="text-green-700 bg-green-50 no-underline px-0.5 rounded-sm font-medium ml-0.5">{change.suggestedText}</ins>
                  </span>
                );
                lastIdx = change.endIndex;
              }
              if (lastIdx < essayContent.length) {
                parts.push(<span key="t-end">{essayContent.slice(lastIdx)}</span>);
              }
              return <p className="whitespace-pre-wrap">{parts}</p>;
            })()}
          </div>
        </CardContent>
      </Card>
    )}

    {feedbackItems.length > 0 && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Detailed Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedbackItems.map((item, index) => (
            <div key={item.id || index} className="p-3 rounded-lg border">
              <div className="flex items-start gap-2">
                {item.color && (
                  <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: item.color }} />
                )}
                <div>
                  {item.criterionName && (
                    <span className="text-xs font-medium text-muted-foreground block mb-1">{item.criterionName}</span>
                  )}
                  <p className="text-sm">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )}
  </div>
);
