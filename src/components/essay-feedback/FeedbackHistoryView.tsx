import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, History } from "lucide-react";
import type { HistoryEntry } from "@/hooks/useEssayFeedback";

interface FeedbackHistoryViewProps {
  essayTitle: string;
  history: HistoryEntry[];
  isLoadingHistory: boolean;
  onBack: () => void;
  onRestore: (entry: HistoryEntry) => void;
}

export const FeedbackHistoryView = ({
  essayTitle, history, isLoadingHistory, onBack, onRestore,
}: FeedbackHistoryViewProps) => {
  return (
    <>
      <DialogHeader className="p-6 pb-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Editor
          </Button>
          <DialogTitle>Feedback History — {essayTitle}</DialogTitle>
        </div>
      </DialogHeader>

      <ScrollArea className="flex-1 p-6">
        {isLoadingHistory ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No feedback history yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <Card key={entry.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Version {entry.version}</Badge>
                      <Badge variant={entry.status === 'sent' ? 'default' : 'secondary'}>
                        {entry.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {entry.personal_message && (
                    <div className="p-2 bg-primary/10 rounded text-sm">
                      <span className="font-medium text-primary text-xs">Personal Message: </span>
                      {entry.personal_message}
                    </div>
                  )}
                  {entry.manual_notes && (
                    <div className="p-2 bg-muted rounded text-sm">
                      <span className="font-medium text-xs">Notes: </span>
                      {entry.manual_notes}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {entry.feedback_items?.length ?? 0} feedback items
                  </div>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => onRestore(entry)}>
                    Restore this version
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );
};
