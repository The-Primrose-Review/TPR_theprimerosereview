import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  PenLine,
  Trash2,
  Loader2,
  GraduationCap,
  BookOpen,
  ChevronRight,
  MessageSquare,
  Send,
  Star,
  Users,
  Mail,
} from "lucide-react";
import { useApplicationEssays } from "@/hooks/useApplicationEssays";
import { useSubmitApplication } from "@/hooks/useSubmitApplication";
import { useApplicationRecommendations } from "@/hooks/useApplicationRecommendations";
import type { ApplicationRecommendation } from "@/hooks/useApplicationRecommendations";
import type { ApplicationWithProfile } from "@/hooks/useApplications";
import type {
  ApplicationEssaySlotWithDraft,
  EssaySlotStatus,
} from "@/types/applicationEssays";
import {
  SLOT_STATUS_LABELS,
  SLOT_STATUS_COLORS,
} from "@/types/applicationEssays";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getAppStatusColor = (status: string) => {
  switch (status) {
    case "sent":        return "bg-green-500 text-white";
    case "approved":    return "bg-green-500 text-white";
    case "in_progress": return "bg-yellow-500 text-white";
    case "draft":       return "bg-blue-500 text-white";
    default:            return "bg-gray-400 text-white";
  }
};

const getDaysUntil = (dateStr: string) =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

const SlotStatusBadge = ({ status }: { status: EssaySlotStatus }) => (
  <span
    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${SLOT_STATUS_COLORS[status]}`}
  >
    {status === "approved"    && <CheckCircle className="h-3 w-3" />}
    {status === "in_review"   && <Clock className="h-3 w-3" />}
    {status === "draft"       && <FileText className="h-3 w-3" />}
    {status === "not_started" && <AlertCircle className="h-3 w-3" />}
    {SLOT_STATUS_LABELS[status]}
  </span>
);

// ─── Feedback Banner ───────────────────────────────────────────────────────────

const FeedbackBanner = ({
  slot,
  onEdit,
}: {
  slot: ApplicationEssaySlotWithDraft;
  onEdit: () => void;
}) => {
  const fb = slot.essay_feedback;
  if (!fb) return null;
  const aiScore = (fb.ai_analysis as any)?.overallScore ?? null;

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
          <PenLine className="h-3 w-3 mr-1.5" />
          Edit Essay
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={onEdit}>
          <ChevronRight className="h-3 w-3" />
          View Full Feedback
        </Button>
      </div>
    </div>
  );
};

// ─── Add Slot Form ─────────────────────────────────────────────────────────────

const AddSlotForm = ({
  applicationId,
  onDone,
  createSlot,
}: {
  applicationId: string;
  onDone: () => void;
  createSlot: ReturnType<typeof useApplicationEssays>["createSlot"];
}) => {
  const [label, setLabel]   = useState("");
  const [prompt, setPrompt] = useState("");
  const [limit, setLimit]   = useState("");

  return (
    <div className="border border-dashed border-border rounded-xl p-4 space-y-3 bg-muted/30">
      <p className="text-sm font-semibold">New Essay</p>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Label *</label>
        <Input
          placeholder='e.g. "Why Us?" or "Personal Statement"'
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Prompt (optional)</label>
        <Textarea
          placeholder="Paste the full essay prompt…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="text-sm min-h-[64px] resize-none"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Word limit (optional)</label>
        <Input
          type="number"
          placeholder="e.g. 650"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          className="h-8 text-sm w-32"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!label.trim() || createSlot.isPending}
          onClick={() =>
            createSlot.mutate(
              {
                application_id: applicationId,
                essay_label: label.trim(),
                essay_prompt: prompt.trim() || undefined,
                word_limit: limit ? parseInt(limit) : undefined,
              },
              { onSuccess: onDone }
            )
          }
        >
          {createSlot.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
          Add Essay
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
};

// ─── Slot Card ─────────────────────────────────────────────────────────────────

const SlotCard = ({
  slot,
  onStartWriting,
  onEditDraft,
  onDelete,
  isDeleting,
}: {
  slot: ApplicationEssaySlotWithDraft;
  onStartWriting: (s: ApplicationEssaySlotWithDraft) => void;
  onEditDraft: (s: ApplicationEssaySlotWithDraft) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  const draft        = slot.essay_feedback;
  const hasDraft     = !!slot.essay_feedback_id;
  const feedbackSent = draft?.status === "sent";

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

      {/* Draft exists, no feedback yet */}
      {hasDraft && draft && !feedbackSent && (
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
            <PenLine className="h-3 w-3 mr-1.5" />Edit Draft
          </Button>
        </div>
      )}

      {/* Feedback received from counselor */}
      {hasDraft && feedbackSent && (
        <FeedbackBanner slot={slot} onEdit={() => onEditDraft(slot)} />
      )}

      {/* No draft yet */}
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

// ─── Recommendation Helpers ────────────────────────────────────────────────────

const REC_STATUS_STYLES: Record<ApplicationRecommendation["status"], string> = {
  draft:       "bg-gray-100 text-gray-600 border-gray-200",
  pending:     "bg-yellow-500/10 text-yellow-700 border-yellow-300",
  in_progress: "bg-blue-500/10 text-blue-700 border-blue-300",
  sent:        "bg-green-500/10 text-green-700 border-green-300",
};

const REC_STATUS_LABELS: Record<ApplicationRecommendation["status"], string> = {
  draft:       "Draft",
  pending:     "Requested",
  in_progress: "In Progress",
  sent:        "Submitted",
};

const RecCard = ({
  rec,
  updateRecStatus,
}: {
  rec: ApplicationRecommendation;
  updateRecStatus: ReturnType<typeof useApplicationRecommendations>["updateRecStatus"];
}) => (
  <div className="flex items-center justify-between gap-3 p-3 border border-border rounded-xl bg-card">
    <div className="flex items-center gap-3 min-w-0">
      <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
        <Users className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{rec.referee_name}</p>
        {rec.referee_role && (
          <p className="text-xs text-muted-foreground truncate">{rec.referee_role}</p>
        )}
        {rec.teacher_email && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Mail className="h-3 w-3" />{rec.teacher_email}
          </p>
        )}
      </div>
    </div>
    <Select
      value={rec.status}
      onValueChange={(val) =>
        updateRecStatus.mutate({ id: rec.id, status: val as ApplicationRecommendation["status"] })
      }
      disabled={updateRecStatus.isPending}
    >
      <SelectTrigger className={`h-7 w-[120px] text-xs font-medium border rounded-full px-2 ${REC_STATUS_STYLES[rec.status]}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(REC_STATUS_LABELS) as ApplicationRecommendation["status"][]).map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            {REC_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const AddRecForm = ({
  studentId,
  applicationId,
  addRecommendation,
  onDone,
}: {
  studentId: string;
  applicationId: string;
  addRecommendation: ReturnType<typeof useApplicationRecommendations>["addRecommendation"];
  onDone: () => void;
}) => {
  const [name, setName]   = useState("");
  const [role, setRole]   = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="border border-dashed border-border rounded-xl p-4 space-y-3 bg-muted/30">
      <p className="text-sm font-semibold">New Recommendation Request</p>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Referee Name *</label>
        <Input
          placeholder='e.g. "Dr. Sarah Johnson"'
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Role / Title (optional)</label>
        <Input
          placeholder='e.g. "AP Chemistry Teacher"'
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Email (optional)</label>
        <Input
          type="email"
          placeholder="teacher@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!name.trim() || addRecommendation.isPending}
          onClick={() =>
            addRecommendation.mutate(
              {
                student_id:   studentId,
                referee_name: name.trim(),
                referee_role: role.trim() || undefined,
                teacher_email: email.trim() || undefined,
              },
              { onSuccess: onDone }
            )
          }
        >
          {addRecommendation.isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            : <Plus className="h-3.5 w-3.5 mr-1" />}
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
};

// ─── Main Modal ────────────────────────────────────────────────────────────────

export const ApplicationDetailModal = ({
  application,
  open,
  onClose,
}: {
  application: ApplicationWithProfile | null;
  open: boolean;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const [showAddSlot, setShowAddSlot]             = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitNotes, setSubmitNotes]             = useState("");

  const {
    slots, isLoading, createSlot, deleteSlot,
    totalSlots, approvedSlots, notStartedSlots, draftSlots, inReviewSlots,
    completionPercentage,
  } = useApplicationEssays(application?.id ?? null);

  const { submitApplication } = useSubmitApplication();

  const {
    recommendations,
    isLoading: isLoadingRecs,
    addRecommendation,
    updateRecStatus,
    sentCount,
    totalCount,
  } = useApplicationRecommendations(application?.id ?? null);

  if (!application) return null;

  // All slots must have essay_feedback with status === 'sent'
  const allFeedbackSent =
    totalSlots > 0 &&
    slots.every((s) => s.essay_feedback !== null && s.essay_feedback.status === "sent");

  const isAlreadySubmitted = application.status === "sent";
  const daysLeft  = getDaysUntil(application.deadline_date);
  const isUrgent  = daysLeft <= 14;
  const isPast    = daysLeft < 0;

  const handleStartWriting = (slot: ApplicationEssaySlotWithDraft) => {
    onClose();
    navigate(
      `/submit-essay?slotId=${slot.id}&applicationId=${application.id}&label=${encodeURIComponent(slot.essay_label)}${slot.essay_prompt ? `&prompt=${encodeURIComponent(slot.essay_prompt)}` : ""}${slot.word_limit ? `&wordLimit=${slot.word_limit}` : ""}`
    );
  };

  const handleEditDraft = (slot: ApplicationEssaySlotWithDraft) => {
    if (!slot.essay_feedback_id) return;
    onClose();
    navigate(`/edit-essay?id=${slot.essay_feedback_id}&slotId=${slot.id}`);
  };

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

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/10 mt-0.5">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl leading-tight">{application.school_name}</DialogTitle>
              {application.program && (
                <p className="text-sm text-muted-foreground mt-0.5">{application.program}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={getAppStatusColor(application.status)}>
                  {application.status.replace(/_/g, " ")}
                </Badge>
                {application.urgent && (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">⚠ Urgent</Badge>
                )}
                <span className={`text-xs font-medium flex items-center gap-1 ${isPast ? "text-destructive" : isUrgent ? "text-orange-600" : "text-muted-foreground"}`}>
                  <Calendar className="h-3 w-3" />
                  {isPast
                    ? `Deadline passed ${Math.abs(daysLeft)}d ago`
                    : `${daysLeft} days left · ${new Date(application.deadline_date).toLocaleDateString()}`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Overall Progress</span>
              <span className="font-semibold text-foreground">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="flex gap-4 text-xs text-muted-foreground pt-0.5 flex-wrap">
              {notStartedSlots > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />{notStartedSlots} not started</span>}
              {draftSlots > 0      && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />{draftSlots} in draft</span>}
              {inReviewSlots > 0   && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />{inReviewSlots} in review</span>}
              {approvedSlots > 0   && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{approvedSlots} approved</span>}
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-6 py-5 space-y-4">

            {/* Already submitted */}
            {isAlreadySubmitted && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">Application submitted</p>
                  <p className="text-xs text-green-600/80 mt-0.5">You can still edit essays and view feedback below.</p>
                </div>
              </div>
            )}

            {/* All feedback received — ready to submit */}
            {allFeedbackSent && !isAlreadySubmitted && (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <Send className="h-5 w-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">All feedback received — ready to submit!</p>
                  <p className="text-xs text-blue-600/80 mt-0.5">Your counselor has reviewed all essays. You can submit now or continue editing.</p>
                </div>
              </div>
            )}

            {/* Essay slots header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Required Essays</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalSlots === 0 ? "No slots yet — add the essays this school requires" : `${totalSlots} essay${totalSlots > 1 ? "s" : ""} required`}
                </p>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowAddSlot(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add Essay
              </Button>
            </div>

            {showAddSlot && (
              <AddSlotForm applicationId={application.id} onDone={() => setShowAddSlot(false)} createSlot={createSlot} />
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : slots.length === 0 && !showAddSlot ? (
              <div className="border border-dashed border-border rounded-xl p-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">No essays defined yet</p>
                <p className="text-xs text-muted-foreground mb-4">Add the essays this school requires to start tracking progress.</p>
                <Button size="sm" variant="outline" onClick={() => setShowAddSlot(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />Add First Essay
                </Button>
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

            {/* Inline submit confirmation */}
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
                  <Button size="sm" onClick={handleSubmit} disabled={submitApplication.isPending}>
                    {submitApplication.isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      : <Send className="h-3.5 w-3.5 mr-1" />}
                    Confirm Submit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="pt-2 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Recommendations</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isLoadingRecs ? "…" : `${sentCount}/${totalCount} submitted`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => { onClose(); navigate('/student-recommendation-letters?step=form'); }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />Add
                </Button>
              </div>

              {totalCount > 0 && (
                <Progress
                  value={totalCount > 0 ? (sentCount / totalCount) * 100 : 0}
                  className="h-1.5"
                />
              )}

              {isLoadingRecs ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : recommendations.length === 0 && !showAddRec ? (
                <div className="border border-dashed border-border rounded-xl p-6 text-center">
                  <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs font-medium mb-1">No recommendations added yet</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Add the referees this application requires.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => { onClose(); navigate('/student-recommendation-letters?step=form'); }}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />Request Letter
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recommendations.map((rec) => (
                    <RecCard key={rec.id} rec={rec} updateRecStatus={updateRecStatus} />
                  ))}
                </div>
              )}

            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
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