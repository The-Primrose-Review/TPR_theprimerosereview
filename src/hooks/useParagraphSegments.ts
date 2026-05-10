import { useMemo } from "react";
import type { AnalysisIssue, AnalysisResult } from "@/hooks/useEssayFeedback";
import type { TrackedChange } from "@/hooks/useTrackedChanges";

export type ParagraphSegment =
  | { kind: 'text'; text: string }
  | { kind: 'ai'; text: string; issue: AnalysisIssue }
  | { kind: 'change'; originalText: string; suggestedText: string; changeId: string };

export function buildParagraphSegments(
  paraText: string,
  paraStart: number,
  aiIssues: AnalysisIssue[],
  paraChanges: TrackedChange[],
): ParagraphSegment[] {
  if (!aiIssues.length && !paraChanges.length) {
    return [{ kind: 'text', text: paraText }];
  }

  type Ann = {
    relStart: number;
    relEnd: number;
    priority: number;
    issue?: AnalysisIssue;
    change?: TrackedChange;
  };

  const annotations: Ann[] = [];

  for (const issue of aiIssues) {
    const relStart = Math.max(0, issue.startIndex - paraStart);
    const relEnd = Math.min(paraText.length, issue.endIndex - paraStart);
    if (relStart < relEnd) {
      annotations.push({ relStart, relEnd, priority: 1, issue });
    }
  }

  for (const change of paraChanges) {
    const relStart = Math.max(0, change.startIndex - paraStart);
    const relEnd = Math.min(paraText.length, change.endIndex - paraStart);
    if (relStart < relEnd) {
      annotations.push({ relStart, relEnd, priority: 2, change });
    }
  }

  // Sort by start; tracked changes take priority over AI issues on ties
  annotations.sort((a, b) => {
    if (a.relStart !== b.relStart) return a.relStart - b.relStart;
    return b.priority - a.priority;
  });

  const segments: ParagraphSegment[] = [];
  let lastIdx = 0;

  for (const ann of annotations) {
    if (ann.relStart < lastIdx) continue; // skip overlaps
    if (ann.relStart > lastIdx) {
      segments.push({ kind: 'text', text: paraText.slice(lastIdx, ann.relStart) });
    }
    if (ann.issue) {
      segments.push({ kind: 'ai', text: paraText.slice(ann.relStart, ann.relEnd), issue: ann.issue });
    } else if (ann.change) {
      segments.push({
        kind: 'change',
        originalText: paraText.slice(ann.relStart, ann.relEnd),
        suggestedText: ann.change.suggestedText,
        changeId: ann.change.id,
      });
    }
    lastIdx = ann.relEnd;
  }

  if (lastIdx < paraText.length) {
    segments.push({ kind: 'text', text: paraText.slice(lastIdx) });
  }

  return segments;
}

export interface ParagraphData {
  text: string;
  start: number;
  end: number;
  index: number;
}

export function useParagraphSegments(
  essayContent: string,
  analysis: AnalysisResult | null,
  trackedChanges: TrackedChange[],
) {
  const paragraphData = useMemo(() => {
    const lines = essayContent.split('\n');
    let offset = 0;
    return lines.map((text, i) => {
      const start = offset;
      const end = offset + text.length;
      offset = end + 1; // +1 for \n
      return { text, start, end, index: i };
    });
  }, [essayContent]);

  const paragraphIssueMap = useMemo(() => {
    const map = new Map<number, AnalysisIssue[]>();
    if (!analysis?.issues) return map;
    for (const issue of analysis.issues) {
      for (const para of paragraphData) {
        if (issue.startIndex >= para.start && issue.startIndex <= para.end) {
          map.set(para.index, [...(map.get(para.index) ?? []), issue]);
          break;
        }
      }
    }
    return map;
  }, [analysis?.issues, paragraphData]);

  const paragraphChangeMap = useMemo(() => {
    const map = new Map<number, TrackedChange[]>();
    for (const change of trackedChanges) {
      for (const para of paragraphData) {
        if (change.startIndex >= para.start && change.startIndex <= para.end) {
          map.set(para.index, [...(map.get(para.index) ?? []), change]);
          break;
        }
      }
    }
    return map;
  }, [trackedChanges, paragraphData]);

  return { paragraphData, paragraphIssueMap, paragraphChangeMap };
}
