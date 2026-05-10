import { useState, useEffect, useRef } from "react";

export interface TrackedChange {
  id: string;
  originalText: string;
  suggestedText: string;
  startIndex: number;
  endIndex: number;
}

export interface PendingSelection {
  startIndex: number;
  endIndex: number;
  selectedText: string;
  rect: DOMRect;
}

export function useTrackedChanges() {
  const [trackedChanges, setTrackedChanges] = useState<TrackedChange[]>([]);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [suggestionInput, setSuggestionInput] = useState("");

  const essayRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Dismiss popover on click outside
  useEffect(() => {
    if (!pendingSelection) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPendingSelection(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pendingSelection]);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !essayRef.current) return;

    const selectedText = sel.toString();
    if (!selectedText.trim()) return;

    const range = sel.getRangeAt(0);

    let startNode: Node | null = range.startContainer;
    let startParaDiv: Element | null = null;
    while (startNode && startNode !== essayRef.current) {
      if (startNode instanceof Element && startNode.hasAttribute('data-para-start')) {
        startParaDiv = startNode;
        break;
      }
      startNode = startNode.parentNode;
    }

    let endNode: Node | null = range.endContainer;
    let endParaDiv: Element | null = null;
    while (endNode && endNode !== essayRef.current) {
      if (endNode instanceof Element && endNode.hasAttribute('data-para-start')) {
        endParaDiv = endNode;
        break;
      }
      endNode = endNode.parentNode;
    }

    // Only allow single-paragraph selections
    if (!startParaDiv || startParaDiv !== endParaDiv) return;

    const paraStart = parseInt(startParaDiv.getAttribute('data-para-start') || '0');

    const preRange = document.createRange();
    preRange.setStart(startParaDiv, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
    const offsetWithinPara = preRange.toString().length;

    const globalStart = paraStart + offsetWithinPara;
    const globalEnd = globalStart + selectedText.length;

    const rect = range.getBoundingClientRect();
    setPendingSelection({ startIndex: globalStart, endIndex: globalEnd, selectedText, rect });
    setSuggestionInput("");
  };

  const applyTrackedChange = () => {
    if (!pendingSelection || !suggestionInput.trim()) return;

    const newChange: TrackedChange = {
      id: `tc-${Date.now()}`,
      originalText: pendingSelection.selectedText,
      suggestedText: suggestionInput.trim(),
      startIndex: pendingSelection.startIndex,
      endIndex: pendingSelection.endIndex,
    };

    setTrackedChanges(prev => [...prev, newChange]);
    setPendingSelection(null);
    setSuggestionInput("");
    window.getSelection()?.removeAllRanges();
  };

  const removeTrackedChange = (id: string) => {
    setTrackedChanges(prev => prev.filter(c => c.id !== id));
  };

  return {
    trackedChanges,
    pendingSelection,
    setPendingSelection,
    suggestionInput,
    setSuggestionInput,
    essayRef,
    popoverRef,
    handleMouseUp,
    applyTrackedChange,
    removeTrackedChange,
  };
}
