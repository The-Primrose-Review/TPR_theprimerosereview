import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Mail, Users } from "lucide-react";
import type { useApplicationRecommendations } from "@/hooks/useApplicationRecommendations";
import type { ApplicationRecommendation } from "@/hooks/useApplicationRecommendations";

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

interface RecCardProps {
  rec: ApplicationRecommendation;
  updateRecStatus: ReturnType<typeof useApplicationRecommendations>["updateRecStatus"];
}

export const RecCard = ({ rec, updateRecStatus }: RecCardProps) => (
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
