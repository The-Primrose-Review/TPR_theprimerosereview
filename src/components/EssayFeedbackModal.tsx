import { useState, useEffect, useRef } from "react";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEssayFeedback } from "@/hooks/useEssayFeedback";
import { useTrackedChanges } from "@/hooks/useTrackedChanges";
import { useParagraphSegments } from "@/hooks/useParagraphSegments";
import { FeedbackHistoryView } from "@/components/essay-feedback/FeedbackHistoryView";
import { FeedbackPreviewView } from "@/components/essay-feedback/FeedbackPreviewView";
import { FeedbackEditorView } from "@/components/essay-feedback/FeedbackEditorView";
import type { Essay } from "@/hooks/useEssayFeedback";

export type { Essay };

interface EssayFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  essay: Essay;
}

export const EssayFeedbackModal = ({ isOpen, onClose, essay }: EssayFeedbackModalProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const {
    isAnalyzing, isSaving, analysis,
    feedbackItems, manualNote, setManualNote,
    personalMessage, setPersonalMessage,
    hoveredCommentId, setHoveredCommentId,
    history, isLoadingHistory,
    activeEvent,
    addToFeedback, addManualNote, removeFeedbackItem,
    loadHistory, saveFeedback, restoreVersion,
  } = useEssayFeedback(essay, isOpen, onClose);

  const {
    trackedChanges,
    pendingSelection, setPendingSelection,
    suggestionInput, setSuggestionInput,
    essayRef, popoverRef,
    handleMouseUp, applyTrackedChange, removeTrackedChange,
  } = useTrackedChanges();

  const { paragraphData, paragraphIssueMap, paragraphChangeMap } = useParagraphSegments(
    essay.content,
    analysis,
    trackedChanges,
  );

  useEffect(() => {
    if (hoveredCommentId && commentRefs.current[hoveredCommentId]) {
      commentRefs.current[hoveredCommentId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [hoveredCommentId]);

  const dialogSizeClass = showHistory
    ? "max-w-[700px] h-[80vh] p-0 flex flex-col"
    : showPreview
    ? "max-w-[800px] h-[80vh] p-0 flex flex-col"
    : "max-w-[95vw] w-[1400px] h-[90vh] p-0 flex flex-col";

  return (
    <>
      <CelebrationOverlay event={activeEvent} />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={dialogSizeClass}>

          {showHistory && (
            <FeedbackHistoryView
              essayTitle={essay.title}
              history={history}
              isLoadingHistory={isLoadingHistory}
              onBack={() => setShowHistory(false)}
              onRestore={(entry) => { restoreVersion(entry); setShowHistory(false); }}
            />
          )}

          {showPreview && (
            <FeedbackPreviewView
              essayTitle={essay.title}
              studentName={essay.studentName}
              analysis={analysis}
              personalMessage={personalMessage}
              setPersonalMessage={setPersonalMessage}
              feedbackItems={feedbackItems}
              trackedChanges={trackedChanges}
              isSaving={isSaving}
              onBack={() => setShowPreview(false)}
              onSaveDraft={() => saveFeedback('in_progress', trackedChanges)}
              onSend={() => saveFeedback('sent', trackedChanges)}
            />
          )}

          {!showHistory && !showPreview && (
            <FeedbackEditorView
              essay={essay}
              isAnalyzing={isAnalyzing}
              isSaving={isSaving}
              analysis={analysis}
              feedbackItems={feedbackItems}
              manualNote={manualNote}
              setManualNote={setManualNote}
              hoveredCommentId={hoveredCommentId}
              setHoveredCommentId={setHoveredCommentId}
              trackedChanges={trackedChanges}
              pendingSelection={pendingSelection}
              suggestionInput={suggestionInput}
              setSuggestionInput={setSuggestionInput}
              paragraphData={paragraphData}
              paragraphIssueMap={paragraphIssueMap}
              paragraphChangeMap={paragraphChangeMap}
              essayRef={essayRef}
              popoverRef={popoverRef}
              commentRefs={commentRefs}
              handleMouseUp={handleMouseUp}
              applyTrackedChange={applyTrackedChange}
              addToFeedback={addToFeedback}
              addManualNote={addManualNote}
              removeFeedbackItem={removeFeedbackItem}
              removeTrackedChange={removeTrackedChange}
              saveFeedback={saveFeedback}
              onClearPendingSelection={() => setPendingSelection(null)}
              onShowHistory={() => { loadHistory(); setShowHistory(true); }}
              onShowPreview={() => setShowPreview(true)}
            />
          )}

        </DialogContent>
      </Dialog>
    </>
  );
};
