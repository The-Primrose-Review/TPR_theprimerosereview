import { Button } from "@/components/ui/button";
import { MessageSquare, Star, PenLine } from "lucide-react";
import type { ApplicationEssaySlotWithDraft } from "@/types/applicationEssays";

interface FeedbackBannerProps {
  slot: ApplicationEssaySlotWithDraft;
  onEdit: () => void;
}

export const FeedbackBanner = ({ slot, onEdit }: FeedbackBannerProps) => {
  const fb = slot.essay_feedback;
  if (!fb) return null;
  const aiScore = (fb.ai_analysis as Record<string, unknown>)?.overallScore as number | null ?? null;

  return (
    <div className="mt-3 pl-9 space-y-2">
      <div className="flex items-start gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
        <MessageSquare className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-0.5">
            Feedback received
            {fb.sent_at && (
              <span className="font-normal text-green-600/70 ml-1">
                · {new Date(fb.sent_at).toLocaleDateString()}
              </span>
            )}
          </p>
          {aiScore && (
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                Score: {aiScore}/100
              </span>
            </div>
          )}
          {fb.personal_message && (
            <p className="text-xs text-green-700/80 dark:text-green-300/80 line-clamp-2 italic">
              "{fb.personal_message}"
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onEdit}>
          <PenLine className="h-3 w-3 mr-1.5" />Edit Essay
        </Button>
      </div>
    </div>
  );
};
