
export type EssaySlotStatus =
  | "not_started"
  | "draft"
  | "in_review"
  | "sent"
  | "approved";

/** A single required-essay slot belonging to one application */
export interface ApplicationEssaySlot {
  id: string;
  application_id: string;
  student_id: string;

  // The requirement itself
  essay_label: string;       // e.g. "Why Us?", "Personal Statement"
  essay_prompt: string | null;
  word_limit: number | null;

  // Link to the written draft (null = student hasn't started yet)
  essay_feedback_id: string | null;

  status: EssaySlotStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/** Slot enriched with the linked essay_feedback row (joined in the hook) */
export interface ApplicationEssaySlotWithDraft extends ApplicationEssaySlot {
  essay_feedback: {
    id: string;
    essay_title: string;
    essay_content: string;
    essay_prompt: string | null;
    status: string;
    ai_analysis: unknown | null;
    personal_message: string | null;
    created_at: string;
    updated_at: string;
    sent_at: string | null;
  } | null;
}

/** Payload for creating a new slot when the student adds an application */
export interface CreateApplicationEssaySlotPayload {
  application_id: string;
  essay_label: string;
  essay_prompt?: string;
  word_limit?: number;
  display_order?: number;
}

/** Payload for linking an existing essay_feedback row to a slot */
export interface LinkEssayToSlotPayload {
  slotId: string;
  essayFeedbackId: string;
}

/** Status transition map — what statuses can follow the current one */
export const SLOT_STATUS_TRANSITIONS: Record<EssaySlotStatus, EssaySlotStatus[]> = {
  not_started: ["draft"],
  draft:       ["in_review", "not_started"],
  in_review:   ["sent", "approved", "draft"],
  sent:        ["draft", "approved"],
  approved:    ["in_review"],
};

export const SLOT_STATUS_LABELS: Record<EssaySlotStatus, string> = {
  not_started: "Not Started",
  draft:       "Draft",
  in_review:   "In Review",
  sent:        "Feedback Received",
  approved:    "Approved",
};

export const SLOT_STATUS_COLORS: Record<EssaySlotStatus, string> = {
  not_started: "bg-gray-100 text-gray-600",
  draft:       "bg-blue-100 text-blue-700",
  in_review:   "bg-yellow-100 text-yellow-700",
  sent:        "bg-purple-100 text-purple-700",
  approved:    "bg-green-100 text-green-700",
};