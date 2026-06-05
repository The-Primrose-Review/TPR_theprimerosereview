import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import type { useApplicationEssays } from "@/hooks/useApplicationEssays";

interface AddSlotFormProps {
  applicationId: string;
  onDone: () => void;
  createSlot: ReturnType<typeof useApplicationEssays>["createSlot"];
}

export const AddSlotForm = ({ applicationId, onDone, createSlot }: AddSlotFormProps) => {
  const [label, setLabel] = useState("");
  const [limit, setLimit] = useState("");

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
                word_limit: limit ? parseInt(limit) : undefined,
              },
              { onSuccess: onDone }
            )
          }
        >
          {createSlot.isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            : <Plus className="h-3.5 w-3.5 mr-1" />}
          Add Essay
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
};
