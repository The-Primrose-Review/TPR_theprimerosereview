import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, FileText, Loader2, Plus, Send } from "lucide-react";
import { AddSlotForm } from "./AddSlotForm";
import { SlotCard } from "./SlotCard";
import type { useApplicationEssays } from "@/hooks/useApplicationEssays";
import type { ApplicationWithProfile } from "@/hooks/useApplications";
import type { ApplicationEssaySlotWithDraft } from "@/types/applicationEssays";

interface EssaysPanelProps {
  application: ApplicationWithProfile;
  slots: ApplicationEssaySlotWithDraft[];
  isLoading: boolean;
  createSlot: ReturnType<typeof useApplicationEssays>["createSlot"];
  deleteSlot: ReturnType<typeof useApplicationEssays>["deleteSlot"];
  totalSlots: number;
  allFeedbackSent: boolean;
  isAlreadySubmitted: boolean;
  showSubmitConfirm: boolean;
  submitNotes: string;
  setSubmitNotes: (v: string) => void;
  onSubmit: () => void;
  onCancelSubmit: () => void;
  submitIsPending: boolean;
  onClose: () => void;
}

export const EssaysPanel = ({
  application, slots, isLoading, createSlot, deleteSlot,
  totalSlots, allFeedbackSent, isAlreadySubmitted,
  showSubmitConfirm, submitNotes, setSubmitNotes,
  onSubmit, onCancelSubmit, submitIsPending, onClose,
}: EssaysPanelProps) => {
  const navigate = useNavigate();
  const [showAddSlot, setShowAddSlot] = useState(false);

  const requiredEssays = application.required_essays ?? 0;
  const atEssayLimit   = totalSlots >= requiredEssays && requiredEssays > 0;

  const handleStartWriting = (slot: ApplicationEssaySlotWithDraft) => {
    onClose();
    navigate(
      `/submit-essay?slotId=${slot.id}&applicationId=${application.id}&label=${encodeURIComponent(slot.essay_label)}&schoolName=${encodeURIComponent(application.school_name)}${slot.essay_prompt ? `&prompt=${encodeURIComponent(slot.essay_prompt)}` : ""}${slot.word_limit ? `&wordLimit=${slot.word_limit}` : ""}`
    );
  };

  const handleEditDraft = (slot: ApplicationEssaySlotWithDraft) => {
    if (!slot.essay_feedback_id) return;
    onClose();
    navigate(
      `/submit-essay?draftId=${slot.essay_feedback_id}&slotId=${slot.id}&applicationId=${application.id}&label=${encodeURIComponent(slot.essay_label)}&schoolName=${encodeURIComponent(application.school_name)}${slot.essay_prompt ? `&prompt=${encodeURIComponent(slot.essay_prompt)}` : ""}${slot.word_limit ? `&wordLimit=${slot.word_limit}` : ""}`
    );
  };

  return (
    <div className="space-y-4">
      {isAlreadySubmitted && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Application submitted</p>
            <p className="text-xs text-green-600/80 mt-0.5">You can still edit essays and view feedback below.</p>
          </div>
        </div>
      )}

      {allFeedbackSent && !isAlreadySubmitted && (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <Send className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">All feedback received — ready to submit!</p>
            <p className="text-xs text-blue-600/80 mt-0.5">Your counselor has reviewed all essays. You can submit now or continue editing.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Required Essays</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalSlots === 0
              ? `Add up to ${requiredEssays} essay${requiredEssays !== 1 ? "s" : ""} for this application`
              : `${totalSlots} / ${requiredEssays} essay${requiredEssays !== 1 ? "s" : ""} added`}
          </p>
        </div>
        {!atEssayLimit && (
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowAddSlot(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />Add Essay
          </Button>
        )}
      </div>

      {showAddSlot && !atEssayLimit && (
        <AddSlotForm
          applicationId={application.id}
          onDone={() => setShowAddSlot(false)}
          createSlot={createSlot}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : slots.length === 0 && !showAddSlot ? (
        <div className="border border-dashed border-border rounded-xl p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">No essays defined yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Add the {requiredEssays} essay{requiredEssays !== 1 ? "s" : ""} this school requires to start tracking progress.
          </p>
          {!atEssayLimit && (
            <Button size="sm" variant="outline" onClick={() => setShowAddSlot(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Add First Essay
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              onStartWriting={handleStartWriting}
              onEditDraft={handleEditDraft}
              onDelete={(id) => deleteSlot.mutate(id)}
              isDeleting={deleteSlot.isPending}
            />
          ))}
        </div>
      )}

      {showSubmitConfirm && (
        <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3 bg-blue-50/50 dark:bg-blue-950/20">
          <p className="text-sm font-semibold">Confirm Submission</p>
          <p className="text-xs text-muted-foreground">
            This saves a snapshot of all essay content and marks the application as submitted.
            You can still edit essays after submitting.
          </p>
          <Textarea
            placeholder="Optional notes (e.g. submitted via Common App portal)…"
            value={submitNotes}
            onChange={(e) => setSubmitNotes(e.target.value)}
            className="text-sm min-h-[60px] resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={onSubmit} disabled={submitIsPending}>
              {submitIsPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                : <Send className="h-3.5 w-3.5 mr-1" />}
              Confirm Submit
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelSubmit}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};
