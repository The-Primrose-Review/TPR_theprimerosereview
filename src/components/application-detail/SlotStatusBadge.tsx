import { CheckCircle, Clock, FileText, AlertCircle, MessageSquare } from "lucide-react";
import { SLOT_STATUS_LABELS, SLOT_STATUS_COLORS } from "@/types/applicationEssays";
import type { EssaySlotStatus } from "@/types/applicationEssays";

export const SlotStatusBadge = ({ status }: { status: EssaySlotStatus }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${SLOT_STATUS_COLORS[status]}`}>
    {status === "approved"    && <CheckCircle className="h-3 w-3" />}
    {status === "in_review"   && <Clock className="h-3 w-3" />}
    {status === "sent"        && <MessageSquare className="h-3 w-3" />}
    {status === "draft"       && <FileText className="h-3 w-3" />}
    {status === "not_started" && <AlertCircle className="h-3 w-3" />}
    {SLOT_STATUS_LABELS[status]}
  </span>
);
