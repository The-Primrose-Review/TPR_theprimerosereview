import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DimensionScore {
  score: number;
  insight: string;
}

export interface LabFeedback {
  authenticity: DimensionScore;
  specificity: DimensionScore;
  voice: DimensionScore;
  narrativeStrength: DimensionScore;
  memorability: DimensionScore;
  overallLabel: 'Strong Hook' | 'Promising' | 'Needs Work' | 'Blends In';
  overallSummary: string;
  suggestedActions: string[];
}

export interface Direction {
  title: string;
  angle: string;
  example: string;
  explanation: {
    why: string;
    what: string;
  };
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

export type ExploreState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; directions: Direction[] }
  | { status: 'error'; message: string };

export const usePrimroseLab = () => {
  const [analyzeState, setAnalyzeState] = useState<AnalyzeState>({ status: 'idle' });
  const [suggestState, setSuggestState] = useState<SuggestState>({ status: 'idle' });
  const [exploreState, setExploreState] = useState<ExploreState>({ status: 'idle' });
  const [versions, setVersions] = useState<LabVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [studentContext, setStudentContext] = useState<string | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const parts: string[] = [];

      // Onboarding answers
      const { data: onboarding } = await supabase
        .from('onboarding_answers')
        .select('personal_story, inspiration, background, career_goals, personal_strengths')
        .eq('user_id', user.id)
        .maybeSingle();

      if (onboarding) {
        if (onboarding.personal_story) parts.push(`Personal story: ${onboarding.personal_story}`);
        if (onboarding.inspiration) parts.push(`Inspirations: ${onboarding.inspiration}`);
        if (onboarding.background) parts.push(`Background: ${onboarding.background}`);
        if (onboarding.career_goals) parts.push(`Goals: ${onboarding.career_goals}`);
        if (onboarding.personal_strengths) parts.push(`Strengths: ${onboarding.personal_strengths}`);
      }

      // Voice insights from Eva conversation (most recent session)
      const { data: voiceRow } = await supabase
        .from('voice_insights')
        .select('insights')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (voiceRow?.insights && Array.isArray(voiceRow.insights) && voiceRow.insights.length > 0) {
        const insightLines = voiceRow.insights.map((i: any) => `${i.category}: ${i.content}`);
        parts.push(`Eva conversation insights:\n${insightLines.join('\n')}`);
      }

      if (parts.length > 0) setStudentContext(parts.join('\n'));
    };
    fetchContext();
  }, []);

  const analyze = async (text: string) => {
    setAnalyzeState({ status: 'analyzing' });
    setSuggestState({ status: 'idle' });
    setExploreState({ status: 'idle' });
    try {
      const { data, error } = await supabase.functions.invoke('lab-feedback', {
        body: { text, mode: 'analyze', studentContext },
      });
      if (error || !data?.authenticity) {
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

  const exploreDirections = async (text: string) => {
    setExploreState({ status: 'loading' });
    setSuggestState({ status: 'idle' });
    try {
      const { data, error } = await supabase.functions.invoke('lab-feedback', {
        body: { text, mode: 'explore', studentContext },
      });
      if (error || !data?.directions) {
        setExploreState({ status: 'error', message: 'Could not load directions. Please try again.' });
        return;
      }
      setExploreState({ status: 'success', directions: data.directions });
    } catch {
      setExploreState({ status: 'error', message: 'Could not load directions. Please try again.' });
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
    setExploreState({ status: 'idle' });
  };

  return {
    analyzeState,
    suggestState,
    exploreState,
    versions,
    activeVersionId,
    setActiveVersionId,
    analyze,
    getSuggestions,
    exploreDirections,
    saveVersion,
    resetAnalysis,
  };
};
