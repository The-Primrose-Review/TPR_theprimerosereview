import { MutableRefObject } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Plus } from "lucide-react";
import type { AnalysisResult, AnalysisIssue, FeedbackItem } from "@/hooks/useEssayFeedback";

interface IssuesPanelProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  feedbackItems: FeedbackItem[];
  hoveredCommentId: string | null;
  setHoveredCommentId: (id: string | null) => void;
  onAddToFeedback: (issue: AnalysisIssue) => void;
  commentRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
}

export const IssuesPanel = ({
  analysis, isAnalyzing, feedbackItems, hoveredCommentId, setHoveredCommentId,
  onAddToFeedback, commentRefs,
}: IssuesPanelProps) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 border-b">
      <div className="px-4 py-2 border-b bg-muted/30 shrink-0">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" />
          Comments ({analysis?.issues?.length ?? 0})
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isAnalyzing ? (
            [1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)
          ) : !analysis?.issues?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No AI comments yet</p>
            </div>
          ) : (
            analysis.issues.map((issue) => {
              const isActive = hoveredCommentId === issue.id;
              const isAdded = feedbackItems.some(f => f.id === issue.id);
              return (
                <div
                  key={issue.id}
                  ref={el => { commentRefs.current[issue.id] = el; }}
                  className="rounded-xl border p-3 space-y-1.5 transition-all cursor-default"
                  style={{
                    borderColor: isActive ? issue.color : undefined,
                    backgroundColor: isActive ? `${issue.color}12` : undefined,
                    boxShadow: isActive ? `0 0 0 2px ${issue.color}40` : undefined,
                  }}
                  onMouseEnter={() => setHoveredCommentId(issue.id)}
                  onMouseLeave={() => setHoveredCommentId(null)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: issue.color }} />
                      <span className="text-xs font-semibold truncate">{issue.criterionName}</span>
                    </div>
                    <Badge
                      variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'secondary' : 'outline'}
                      className="text-[10px] shrink-0"
                    >
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-foreground">{issue.problemType}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{issue.problemDescription}</p>
                  <div className="pt-1 border-t border-border">
                    <p className="text-xs text-primary leading-snug">💡 {issue.recommendation}</p>
                  </div>
                  {!isAdded ? (
                    <Button size="sm" variant="outline" className="w-full h-6 text-xs mt-1" onClick={() => onAddToFeedback(issue)}>
                      <Plus className="h-3 w-3 mr-1" />Add to Feedback
                    </Button>
                  ) : (
                    <p className="text-[10px] text-green-600 font-medium text-center">✓ Added to feedback</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
