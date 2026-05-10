import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import type { PendingSelection } from "@/hooks/useTrackedChanges";

interface SuggestionPopoverProps {
  pendingSelection: PendingSelection;
  suggestionInput: string;
  setSuggestionInput: (v: string) => void;
  popoverRef: RefObject<HTMLDivElement>;
  onApply: () => void;
  onCancel: () => void;
}

export const SuggestionPopover = ({
  pendingSelection, suggestionInput, setSuggestionInput, popoverRef, onApply, onCancel,
}: SuggestionPopoverProps) => {
  return (
    <div
      ref={popoverRef}
      className="fixed z-[200] bg-white border border-border rounded-xl shadow-2xl p-3 w-72"
      style={{
        top: Math.max(8, pendingSelection.rect.top - 140),
        left: Math.min(pendingSelection.rect.left, window.innerWidth - 300),
      }}
    >
      <p className="text-xs text-muted-foreground mb-1">Replace selected text:</p>
      <p className="text-xs font-medium text-red-600 line-through mb-2 truncate">
        "{pendingSelection.selectedText}"
      </p>
      <input
        autoFocus
        className="w-full text-sm border border-border rounded-lg px-2.5 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
        placeholder="Type your suggestion..."
        value={suggestionInput}
        onChange={(e) => setSuggestionInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && suggestionInput.trim()) onApply();
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 h-7 text-xs" onClick={onApply} disabled={!suggestionInput.trim()}>
          Apply Change
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
