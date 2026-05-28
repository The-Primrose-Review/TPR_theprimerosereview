import { Button } from "@/components/ui/button";
import { BookOpen, PenLine, Trash2 } from "lucide-react";
import { FeedbackBanner } from "./FeedbackBanner";
import { SlotStatusBadge } from "./SlotStatusBadge";
import type { ApplicationEssaySlotWithDraft, EssaySlotStatus } from "@/types/applicationEssays";

interface SlotCardProps {
  slot: ApplicationEssaySlotWithDraft;
  onStartWriting: (s: ApplicationEssaySlotWithDraft) => void;
  onEditDraft: (s: ApplicationEssaySlotWithDraft) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export const SlotCard = ({ slot, onStartWriting, onEditDraft, onDelete, isDeleting }: SlotCardProps) => {
  const draft        = slot.essay_feedback;
  const hasDraft     = !!slot.essay_feedback_id;
  const isDraft      = draft?.status === "draft";
  const isPending    = draft?.status === "pending" || draft?.status === "in_review";
  const feedbackSent = draft?.status === "sent" || draft?.status === "read";

  return (
    <div className="group relative border border-border rounded-xl p-4 bg-card hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10 shrink-0">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{slot.essay_label}</p>
            {slot.word_limit && (
              <p className="text-xs text-muted-foreground mt-0.5">{slot.word_limit} word limit</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SlotStatusBadge status={slot.status as EssaySlotStatus} />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(slot.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {slot.essay_prompt && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 pl-9">{slot.essay_prompt}</p>
      )}

      {hasDraft && draft && isDraft && (
        <div className="pl-9 mb-2">
          <div className="bg-muted/60 rounded-lg p-2.5 text-xs">
            <p className="font-medium truncate mb-0.5">{draft.essay_title}</p>
            <p className="text-muted-foreground line-clamp-1">{draft.essay_content}</p>
            <div className="flex gap-3 mt-1.5 text-muted-foreground">
              <span>{draft.essay_content.split(/\s+/).filter(Boolean).length} words</span>
              <span>Edited {new Date(draft.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs mt-2" onClick={() => onEditDraft(slot)}>
            <PenLine className="h-3 w-3 mr-1.5" />Continue Writing
          </Button>
        </div>
      )}

      {hasDraft && draft && isPending && (
        <div className="pl-9 mb-2">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-xs">
            <p className="font-medium truncate mb-0.5">{draft.essay_title}</p>
            <p className="text-blue-600/80 mt-1">Submitted — awaiting feedback</p>
          </div>
        </div>
      )}

      {hasDraft && feedbackSent && (
        <FeedbackBanner slot={slot} onEdit={() => onEditDraft(slot)} />
      )}

      {!hasDraft && (
        <div className="pl-9 mt-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStartWriting(slot)}>
            <PenLine className="h-3 w-3 mr-1.5" />Start Writing
          </Button>
        </div>
      )}
    </div>
  );
};
