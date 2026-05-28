import type { AtRiskCriteria } from "@/hooks/useAtRiskCriteria";

/**
 * Compute a student's weighted completion score (0–100).
 * Uses criteria.essayWeight and criteria.recWeight so the formula
 * always stays in sync with whatever the principal configured.
 */
export function computeCompletion(
  essaysSubmitted: number,
  totalEssays: number,
  recsSubmitted: number,
  recsRequested: number,
  criteria: AtRiskCriteria,
): number {
  if (totalEssays === 0 && recsRequested === 0) return 0;
  const essayScore = totalEssays > 0 ? (essaysSubmitted / totalEssays) * criteria.essayWeight : 0;
  const recScore   = recsRequested > 0 ? (recsSubmitted / recsRequested) * criteria.recWeight   : 0;
  return Math.round(essayScore + recScore);
}

/**
 * Classify a student's risk level given their completion score and whether
 * they have an upcoming deadline, using the school's configured thresholds.
 */
export function classifyRisk(
  score: number,
  hasUrgentDeadline: boolean,
  criteria: AtRiskCriteria,
): "at-risk" | "needs-attention" | "on-track" {
  if (hasUrgentDeadline) return "at-risk";
  if (score >= criteria.needsAttentionThreshold) return "on-track";
  if (score < criteria.atRiskThreshold) return "at-risk";
  return "needs-attention";
}