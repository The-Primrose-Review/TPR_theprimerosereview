import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Send } from "lucide-react";
import { useApplicationEssays } from "@/hooks/useApplicationEssays";
import { useSubmitApplication } from "@/hooks/useSubmitApplication";
import { useApplicationRecommendations } from "@/hooks/useApplicationRecommendations";
import { ApplicationHeader } from "@/components/application-detail/ApplicationHeader";
import { EssaysPanel } from "@/components/application-detail/EssaysPanel";
import { RecommendationsPanel } from "@/components/application-detail/RecommendationsPanel";
import type { ApplicationWithProfile } from "@/hooks/useApplications";

export const ApplicationDetailModal = ({
  application,
  open,
  onClose,
}: {
  application: ApplicationWithProfile | null;
  open: boolean;
  onClose: () => void;
}) => {
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitNotes, setSubmitNotes]             = useState("");

  const {
    slots, isLoading, createSlot, deleteSlot,
    totalSlots, approvedSlots, notStartedSlots, draftSlots, inReviewSlots,
    completionPercentage,
  } = useApplicationEssays(application?.id ?? null);

  const { submitApplication } = useSubmitApplication();

  const {
    recommendations, isLoading: isLoadingRecs,
    updateRecStatus, sentCount, totalCount,
  } = useApplicationRecommendations(application?.id ?? null);

  if (!application) return null;

  const allFeedbackSent =
    totalSlots > 0 &&
    slots.every((s) => s.essay_feedback !== null && s.essay_feedback.status === "sent");

  const isAlreadySubmitted = application.status === "sent";

  const handleSubmit = () => {
    submitApplication.mutate(
      {
        applicationId: application.id,
        studentId: application.student_id,
        slots,
        notes: submitNotes || undefined,
      },
      { onSuccess: () => { setShowSubmitConfirm(false); onClose(); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">

        <ApplicationHeader
          application={application}
          completionPercentage={completionPercentage}
          totalSlots={totalSlots}
          approvedSlots={approvedSlots}
          notStartedSlots={notStartedSlots}
          draftSlots={draftSlots}
          inReviewSlots={inReviewSlots}
        />

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-6 py-5 space-y-4">
            <EssaysPanel
              application={application}
              slots={slots}
              isLoading={isLoading}
              createSlot={createSlot}
              deleteSlot={deleteSlot}
              totalSlots={totalSlots}
              allFeedbackSent={allFeedbackSent}
              isAlreadySubmitted={isAlreadySubmitted}
              showSubmitConfirm={showSubmitConfirm}
              submitNotes={submitNotes}
              setSubmitNotes={setSubmitNotes}
              onSubmit={handleSubmit}
              onCancelSubmit={() => setShowSubmitConfirm(false)}
              submitIsPending={submitApplication.isPending}
              onClose={onClose}
            />

            <RecommendationsPanel
              recommendations={recommendations}
              isLoadingRecs={isLoadingRecs}
              updateRecStatus={updateRecStatus}
              sentCount={sentCount}
              totalCount={totalCount}
              onClose={onClose}
            />
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between gap-3 bg-muted/20">
          <p className="text-xs text-muted-foreground truncate">{application.notes ?? ""}</p>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
            {isAlreadySubmitted ? (
              <Button size="sm" disabled>
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />Submitted
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!allFeedbackSent}
                onClick={() => setShowSubmitConfirm((v) => !v)}
                title={!allFeedbackSent ? "All essays must have counselor feedback before submitting" : undefined}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />Submit Application
              </Button>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};
