import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Save, Send, Star, Strikethrough } from "lucide-react";
import type { AnalysisResult, FeedbackItem } from "@/hooks/useEssayFeedback";
import type { TrackedChange } from "@/hooks/useTrackedChanges";

interface FeedbackPreviewViewProps {
  essayTitle: string;
  studentName: string;
  analysis: AnalysisResult | null;
  personalMessage: string;
  setPersonalMessage: (v: string) => void;
  feedbackItems: FeedbackItem[];
  trackedChanges: TrackedChange[];
  isSaving: boolean;
  onBack: () => void;
  onSaveDraft: () => void;
  onSend: () => void;
}

export const FeedbackPreviewView = ({
  essayTitle, studentName, analysis, personalMessage, setPersonalMessage,
  feedbackItems, trackedChanges, isSaving, onBack, onSaveDraft, onSend,
}: FeedbackPreviewViewProps) => {
  return (
    <>
      <DialogHeader className="p-6 pb-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Edit
          </Button>
          <DialogTitle>Preview Feedback for {studentName}</DialogTitle>
        </div>
      </DialogHeader>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          <div className="text-center pb-4 border-b">
            <h2 className="text-xl font-bold">{essayTitle}</h2>
            <p className="text-muted-foreground">Feedback from your counselor</p>
            {analysis && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Star className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg">{analysis.overallScore}/100</span>
              </div>
            )}
          </div>

          {personalMessage && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-primary mb-2">Personal Note:</p>
                <p className="text-foreground">{personalMessage}</p>
              </CardContent>
            </Card>
          )}

          {trackedChanges.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Strikethrough className="h-4 w-4" />
                  Suggested Edits ({trackedChanges.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {trackedChanges.map(change => (
                  <div key={change.id} className="p-2 rounded border text-sm space-y-0.5">
                    <del className="text-red-500 line-through block">{change.originalText}</del>
                    <ins className="text-green-700 no-underline block font-medium">{change.suggestedText}</ins>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-sm">Detailed Feedback</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {feedbackItems.map((item) => (
                <div key={item.id} className="p-3 rounded-lg border">
                  <div className="flex items-start gap-2">
                    {item.color && (
                      <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: item.color }} />
                    )}
                    <div>
                      {item.criterionName && (
                        <span className="text-xs font-medium text-muted-foreground">{item.criterionName}</span>
                      )}
                      <p className="text-sm">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {analysis?.criteria && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Score Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {analysis.criteria.map((criterion) => (
                  <div key={criterion.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{criterion.name}</span>
                      <span className="font-medium">{criterion.score}/100</span>
                    </div>
                    <Progress value={criterion.score} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <Textarea
          placeholder="Add a personal message to the student (optional)..."
          value={personalMessage}
          onChange={(e) => setPersonalMessage(e.target.value)}
          className="flex-1 resize-none"
          rows={2}
        />
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={onSaveDraft} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
          <Button onClick={onSend} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  );
};
