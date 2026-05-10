import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Plus, Strikethrough, X } from "lucide-react";
import type { FeedbackItem } from "@/hooks/useEssayFeedback";
import type { TrackedChange } from "@/hooks/useTrackedChanges";

interface FeedbackDraftPanelProps {
  trackedChanges: TrackedChange[];
  feedbackItems: FeedbackItem[];
  manualNote: string;
  setManualNote: (v: string) => void;
  onAddManualNote: () => void;
  onRemoveFeedbackItem: (id: string) => void;
  onRemoveTrackedChange: (id: string) => void;
}

export const FeedbackDraftPanel = ({
  trackedChanges, feedbackItems, manualNote, setManualNote,
  onAddManualNote, onRemoveFeedbackItem, onRemoveTrackedChange,
}: FeedbackDraftPanelProps) => {
  return (
    <>
      <div className="border-b shrink-0">
        <div className="px-4 py-2 border-b bg-muted/30">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Strikethrough className="h-3.5 w-3.5" />
            Track Changes ({trackedChanges.length})
          </p>
        </div>
        {trackedChanges.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3 px-4">
            Select text in the essay to suggest a replacement
          </p>
        ) : (
          <div className="p-3 space-y-1.5 max-h-40 overflow-y-auto">
            {trackedChanges.map(change => (
              <div key={change.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 group/tc text-xs">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <del className="text-red-500 line-through block truncate">{change.originalText}</del>
                  <ins className="text-green-700 no-underline block truncate font-medium">{change.suggestedText}</ins>
                </div>
                <button
                  className="opacity-0 group-hover/tc:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 mt-1"
                  onClick={() => onRemoveTrackedChange(change.id)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-[35%] flex flex-col min-h-0">
        <div className="px-4 py-2 border-b bg-muted/30 shrink-0">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Feedback Draft ({feedbackItems.length})
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {feedbackItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Add comments from above or write a manual note
              </p>
            ) : (
              feedbackItems.map((item) => (
                <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 group/fb">
                  {item.color && (
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.color }} />
                  )}
                  <div className="flex-1 min-w-0">
                    {item.criterionName && (
                      <span className="text-[10px] text-muted-foreground block">{item.criterionName}</span>
                    )}
                    <p className="text-xs leading-snug">{item.text}</p>
                  </div>
                  <button
                    className="opacity-0 group-hover/fb:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => onRemoveFeedbackItem(item.id)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="p-3 border-t space-y-2 shrink-0">
          <Textarea
            placeholder="Add a manual note..."
            value={manualNote}
            onChange={(e) => setManualNote(e.target.value)}
            className="resize-none text-xs min-h-[56px]"
            rows={2}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={onAddManualNote}
            disabled={!manualNote.trim()}
          >
            <Plus className="h-3 w-3 mr-1" />Add Note
          </Button>
        </div>
      </div>
    </>
  );
};
