import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, Users } from "lucide-react";
import { RecCard } from "./RecCard";
import type { useApplicationRecommendations } from "@/hooks/useApplicationRecommendations";
import type { ApplicationRecommendation } from "@/hooks/useApplicationRecommendations";

interface RecommendationsPanelProps {
  recommendations: ApplicationRecommendation[];
  isLoadingRecs: boolean;
  updateRecStatus: ReturnType<typeof useApplicationRecommendations>["updateRecStatus"];
  sentCount: number;
  totalCount: number;
  onClose: () => void;
}

export const RecommendationsPanel = ({
  recommendations, isLoadingRecs, updateRecStatus,
  sentCount, totalCount, onClose,
}: RecommendationsPanelProps) => {
  const navigate = useNavigate();

  const handleAddRec = () => {
    onClose();
    navigate('/student-recommendation-letters?step=form');
  };

  return (
    <div className="pt-2 border-t border-border space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Recommendations</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLoadingRecs ? "…" : `${sentCount}/${totalCount} submitted`}
          </p>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleAddRec}>
          <Plus className="h-3.5 w-3.5 mr-1" />Add
        </Button>
      </div>

      {totalCount > 0 && (
        <Progress value={totalCount > 0 ? (sentCount / totalCount) * 100 : 0} className="h-1.5" />
      )}

      {isLoadingRecs ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-6 text-center">
          <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs font-medium mb-1">No recommendations added yet</p>
          <p className="text-xs text-muted-foreground mb-3">
            Add the referees this application requires.
          </p>
          <Button size="sm" variant="outline" onClick={handleAddRec}>
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
  );
};
