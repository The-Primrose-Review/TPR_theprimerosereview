import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DimensionScore {
  score: number;
  insight: string;
}

export interface LabFeedback {
  clarity: DimensionScore;
  originality: DimensionScore;
  emotionalPull: DimensionScore;
  curiosity: DimensionScore;
  overallLabel: 'Strong Hook' | 'Promising' | 'Needs Work' | 'Blends In';
  overallSummary: string;
  suggestedActions: string[];
}

export interface LabVersion {
  id: string;
  label: string;
  text: string;
  feedback: LabFeedback;
  createdAt: Date;
}

type AnalyzeState =
  | { status: 'idle' }
  | { status: 'analyzing' }
  | { status: 'success'; feedback: LabFeedback }
  | { status: 'error'; message: string };

type SuggestState =
  | { status: 'idle' }
  | { status: 'loading'; action: string }
  | { status: 'success'; action: string; suggestions: string[] }
  | { status: 'error'; message: string };

export const usePrimroseLab = () => {
  const [analyzeState, setAnalyzeState] = useState<AnalyzeState>({ status: 'idle' });
  const [suggestState, setSuggestState] = useState<SuggestState>({ status: 'idle' });
  const [versions, setVersions] = useState<LabVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

  const analyze = async (text: string) => {
    setAnalyzeState({ status: 'analyzing' });
    setSuggestState({ status: 'idle' });
    try {
      const { data, error } = await supabase.functions.invoke('lab-feedback', {
        body: { text, mode: 'analyze' },
      });
      if (error || !data?.clarity) {
        setAnalyzeState({ status: 'error', message: 'Something went wrong. Please try again.' });
        return;
      }
      setAnalyzeState({ status: 'success', feedback: data as LabFeedback });
    } catch {
      setAnalyzeState({ status: 'error', message: 'Something went wrong. Please try again.' });
    }
  };

  const getSuggestions = async (text: string, action: string) => {
    setSuggestState({ status: 'loading', action });
    try {
      const { data, error } = await supabase.functions.invoke('lab-feedback', {
        body: { text, mode: 'suggest', action },
      });
      if (error || !data?.suggestions) {
        setSuggestState({ status: 'error', message: 'Could not load suggestions.' });
        return;
      }
      setSuggestState({ status: 'success', action, suggestions: data.suggestions });
    } catch {
      setSuggestState({ status: 'error', message: 'Could not load suggestions.' });
    }
  };

  const saveVersion = (text: string, feedback: LabFeedback) => {
    const id = crypto.randomUUID();
    const newVersion: LabVersion = {
      id,
      label: `V${versions.length + 1}`,
      text,
      feedback,
      createdAt: new Date(),
    };
    setVersions(prev => [...prev, newVersion]);
    setActiveVersionId(id);
    return newVersion;
  };

  const resetAnalysis = () => {
    setAnalyzeState({ status: 'idle' });
    setSuggestState({ status: 'idle' });
  };

  return {
    analyzeState,
    suggestState,
    versions,
    activeVersionId,
    setActiveVersionId,
    analyze,
    getSuggestions,
    saveVersion,
    resetAnalysis,
  };
};
