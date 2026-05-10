import { RefObject } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageCircle } from "lucide-react";
import { buildParagraphSegments } from "@/hooks/useParagraphSegments";
import type { ParagraphSegment } from "@/hooks/useParagraphSegments";
import type { ParagraphData } from "@/hooks/useParagraphSegments";
import type { AnalysisIssue } from "@/hooks/useEssayFeedback";
import type { TrackedChange } from "@/hooks/useTrackedChanges";

interface EssayHighlightPanelProps {
  isAnalyzing: boolean;
  paragraphData: ParagraphData[];
  paragraphIssueMap: Map<number, AnalysisIssue[]>;
  paragraphChangeMap: Map<number, TrackedChange[]>;
  hoveredCommentId: string | null;
  setHoveredCommentId: (id: string | null) => void;
  essayRef: RefObject<HTMLDivElement>;
  handleMouseUp: () => void;
}

export const EssayHighlightPanel = ({
  isAnalyzing, paragraphData, paragraphIssueMap, paragraphChangeMap,
  hoveredCommentId, setHoveredCommentId, essayRef, handleMouseUp,
}: EssayHighlightPanelProps) => {
  const renderSegment = (seg: ParagraphSegment, key: string | number) => {
    if (seg.kind === 'text') return <span key={key}>{seg.text}</span>;
    if (seg.kind === 'ai') {
      const isActive = hoveredCommentId === seg.issue.id;
      return (
        <span
          key={key}
          className="cursor-pointer px-0.5 rounded transition-all"
          style={{
            backgroundColor: `${seg.issue.color}${isActive ? '55' : '25'}`,
            borderBottom: `2px solid ${seg.issue.color}`,
            outline: isActive ? `2px solid ${seg.issue.color}` : undefined,
            outlineOffset: '1px',
          }}
          onMouseEnter={() => setHoveredCommentId(seg.issue.id)}
          onMouseLeave={() => setHoveredCommentId(null)}
        >
          {seg.text}
        </span>
      );
    }
    if (seg.kind === 'change') {
      return (
        <span key={key} className="inline">
          <del className="text-red-500 bg-red-50 line-through px-0.5 rounded-sm">{seg.originalText}</del>
          <ins className="text-green-700 bg-green-50 no-underline px-0.5 rounded-sm font-medium ml-0.5">{seg.suggestedText}</ins>
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 border-r">
      <div className="px-4 py-2 border-b bg-muted/30 shrink-0">
        <p className="text-xs text-muted-foreground">
          {isAnalyzing
            ? "Bear with us, this might take a moment…"
            : "Select any text to suggest a replacement — or hover highlights to see AI comments"}
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isAnalyzing ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Bear with us, please…</p>
              </div>
            </div>
          ) : (
            <div
              ref={essayRef}
              className="space-y-0 select-text cursor-text"
              onMouseUp={handleMouseUp}
            >
              {paragraphData.map((para) => {
                const paraIssues = paragraphIssueMap.get(para.index) ?? [];
                const paraChanges = paragraphChangeMap.get(para.index) ?? [];
                const isEmpty = para.text.trim() === '';
                const segments = buildParagraphSegments(para.text, para.start, paraIssues, paraChanges);
                return (
                  <div key={para.index} className="flex gap-2 group/para min-h-[1.5em]">
                    <div
                      className="flex-1 text-sm leading-relaxed text-foreground"
                      data-para-start={para.start}
                      data-para-index={para.index}
                    >
                      {isEmpty
                        ? <span>&nbsp;</span>
                        : segments.map((seg, i) => renderSegment(seg, i))
                      }
                    </div>
                    <div className="w-6 shrink-0 flex flex-col items-center gap-0.5 pt-0.5">
                      {paraIssues.map((issue) => (
                        <button
                          key={issue.id}
                          className="opacity-0 group-hover/para:opacity-100 transition-opacity rounded-full p-0.5 hover:bg-muted"
                          style={{ color: issue.color }}
                          onMouseEnter={() => setHoveredCommentId(issue.id)}
                          onMouseLeave={() => setHoveredCommentId(null)}
                          title={issue.problemType}
                        >
                          <MessageCircle className="h-3.5 w-3.5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
