import { MutableRefObject, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Star, AlertTriangle, Save, Send, Eye, History } from "lucide-react";
import { EssayHighlightPanel } from "./EssayHighlightPanel";
import { IssuesPanel } from "./IssuesPanel";
import { FeedbackDraftPanel } from "./FeedbackDraftPanel";
import { SuggestionPopover } from "./SuggestionPopover";
import type { Essay, AnalysisResult, AnalysisIssue, FeedbackItem } from "@/hooks/useEssayFeedback";
import type { TrackedChange, PendingSelection } from "@/hooks/useTrackedChanges";
import type { ParagraphData } from "@/hooks/useParagraphSegments";

interface FeedbackEditorViewProps {
  essay: Essay;
  isAnalyzing: boolean;
  isSaving: boolean;
  analysis: AnalysisResult | null;
  feedbackItems: FeedbackItem[];
  manualNote: string;
  setManualNote: (v: string) => void;
  hoveredCommentId: string | null;
  setHoveredCommentId: (id: string | null) => void;
  trackedChanges: TrackedChange[];
  pendingSelection: PendingSelection | null;
  suggestionInput: string;
  setSuggestionInput: (v: string) => void;
  paragraphData: ParagraphData[];
  paragraphIssueMap: Map<number, AnalysisIssue[]>;
  paragraphChangeMap: Map<number, TrackedChange[]>;
  essayRef: RefObject<HTMLDivElement>;
  popoverRef: RefObject<HTMLDivElement>;
  commentRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  handleMouseUp: () => void;
  applyTrackedChange: () => void;
  addToFeedback: (issue: AnalysisIssue) => void;
  addManualNote: () => void;
  removeFeedbackItem: (id: string) => void;
  removeTrackedChange: (id: string) => void;
  saveFeedback: (status: 'draft' | 'in_progress' | 'sent', trackedChanges: TrackedChange[]) => void;
  onClearPendingSelection: () => void;
  onShowHistory: () => void;
  onShowPreview: () => void;
}

export const FeedbackEditorView = ({
  essay, isAnalyzing, isSaving, analysis,
  feedbackItems, manualNote, setManualNote,
  hoveredCommentId, setHoveredCommentId,
  trackedChanges, pendingSelection,
  suggestionInput, setSuggestionInput,
  paragraphData, paragraphIssueMap, paragraphChangeMap,
  essayRef, popoverRef, commentRefs,
  handleMouseUp, applyTrackedChange,
  addToFeedback, addManualNote, removeFeedbackItem, removeTrackedChange,
  saveFeedback, onClearPendingSelection, onShowHistory, onShowPreview,
}: FeedbackEditorViewProps) => {
  return (
    <>
      <DialogHeader className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center justify-between">
          <DialogTitle className="text-lg">
            {essay.title} — {essay.studentName}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onShowHistory}>
              <History className="h-3.5 w-3.5 mr-1.5" />History
            </Button>
            <Button variant="outline" size="sm" onClick={onShowPreview}>
              <Eye className="h-3.5 w-3.5 mr-1.5" />Preview
            </Button>
            <Button variant="outline" size="sm" onClick={() => saveFeedback('in_progress', trackedChanges)} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save Draft
            </Button>
            <Button size="sm" onClick={() => saveFeedback('sent', trackedChanges)} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
              Send to Student
            </Button>
          </div>
        </div>
      </DialogHeader>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: AI scores */}
        <div className="w-[150px] shrink-0 border-r flex flex-col gap-4 p-4 overflow-y-auto">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-primary" />AI Score
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {isAnalyzing
                ? <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary" />
                : <div className="text-3xl font-bold text-center text-primary">{analysis?.overallScore ?? '—'}</div>
              }
            </CardContent>
          </Card>

          {analysis?.issues && (
            <Card>
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-warning" />Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-2xl font-bold text-center text-warning">{analysis.issues.length}</div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs">Criteria</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {isAnalyzing
                ? [1, 2, 3, 4, 5].map(i => <div key={i} className="h-7 bg-muted animate-pulse rounded" />)
                : analysis?.criteria
                  ? analysis.criteria.map((c) => (
                      <div key={c.id} className="space-y-1">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                          <span className="text-[10px] text-muted-foreground truncate">{c.name.split(' & ')[0]}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Progress value={c.score} className="h-1.5 flex-1" />
                          <span className="text-[10px] font-medium w-5 text-right">{c.score}</span>
                        </div>
                      </div>
                    ))
                  : <p className="text-xs text-muted-foreground text-center py-2">No analysis</p>
              }
            </CardContent>
          </Card>
        </div>

        <EssayHighlightPanel
          isAnalyzing={isAnalyzing}
          paragraphData={paragraphData}
          paragraphIssueMap={paragraphIssueMap}
          paragraphChangeMap={paragraphChangeMap}
          hoveredCommentId={hoveredCommentId}
          setHoveredCommentId={setHoveredCommentId}
          essayRef={essayRef}
          handleMouseUp={handleMouseUp}
        />

        <div className="w-[320px] shrink-0 flex flex-col">
          <IssuesPanel
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            feedbackItems={feedbackItems}
            hoveredCommentId={hoveredCommentId}
            setHoveredCommentId={setHoveredCommentId}
            onAddToFeedback={addToFeedback}
            commentRefs={commentRefs}
          />
          <FeedbackDraftPanel
            trackedChanges={trackedChanges}
            feedbackItems={feedbackItems}
            manualNote={manualNote}
            setManualNote={setManualNote}
            onAddManualNote={addManualNote}
            onRemoveFeedbackItem={removeFeedbackItem}
            onRemoveTrackedChange={removeTrackedChange}
          />
        </div>
      </div>

      {pendingSelection && (
        <SuggestionPopover
          pendingSelection={pendingSelection}
          suggestionInput={suggestionInput}
          setSuggestionInput={setSuggestionInput}
          popoverRef={popoverRef}
          onApply={applyTrackedChange}
          onCancel={onClearPendingSelection}
        />
      )}
    </>
  );
};
