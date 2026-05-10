import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, GraduationCap } from "lucide-react";
import type { ApplicationWithProfile } from "@/hooks/useApplications";

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

interface ApplicationHeaderProps {
  application: ApplicationWithProfile;
  completionPercentage: number;
  totalSlots: number;
  approvedSlots: number;
  notStartedSlots: number;
  draftSlots: number;
  inReviewSlots: number;
}

export const ApplicationHeader = ({
  application, completionPercentage,
  totalSlots, approvedSlots, notStartedSlots, draftSlots, inReviewSlots,
}: ApplicationHeaderProps) => {
  const daysLeft = getDaysUntil(application.deadline_date);
  const isUrgent = daysLeft <= 14;
  const isPast   = daysLeft < 0;

  return (
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
  );
};
