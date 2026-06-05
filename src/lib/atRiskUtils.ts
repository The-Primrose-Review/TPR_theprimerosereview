import type { AtRiskCriteria } from "@/hooks/useAtRiskCriteria";

export type StudentStatus = "on-track" | "needs-attention" | "at-risk" | "not-started";

export interface StudentRiskResult {
  status: StudentStatus;
  completionPercentage: number;
  hasNearDeadline: boolean;
  upcomingDeadlines: number;
  reasons: string[];
}

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Single source of truth for student risk classification.
 * Pass data pre-filtered to this student; function handles
 * not-started guard, completion, deadlines, and tooltip reasons.
 */
export function resolveStudentStatus(
  studentApplications: { deadline_date: string | null; status: string }[],
  studentEssaySlots: { status: string }[],
  studentRecs: { status: string }[],
  criteria: AtRiskCriteria,
): StudentRiskResult {
  if (studentApplications.length === 0) {
    return { status: "not-started", completionPercentage: 0, hasNearDeadline: false, upcomingDeadlines: 0, reasons: [] };
  }

  const now = new Date();
  const cutoff = new Date(Date.now() + FOURTEEN_DAYS_MS);

  const totalEssays = studentEssaySlots.length;
  const essaysSubmitted = studentEssaySlots.filter(s => ["in_review", "approved"].includes(s.status)).length;
  const recsRequested = studentRecs.length;
  const recsSubmitted = studentRecs.filter(r => r.status === "sent").length;

  const completionPercentage = computeCompletion(essaysSubmitted, totalEssays, recsSubmitted, recsRequested, criteria);

  const upcomingDeadlines = studentApplications.filter(a =>
    a.status !== "sent" &&
    a.deadline_date &&
    new Date(a.deadline_date) >= now &&
    new Date(a.deadline_date) <= cutoff
  ).length;

  const hasNearDeadline = upcomingDeadlines > 0;
  const status = classifyRisk(completionPercentage, hasNearDeadline, criteria) as StudentStatus;

  const reasons: string[] = [];
  if (hasNearDeadline) reasons.push("Application deadline within 14 days");
  if (completionPercentage < criteria.atRiskThreshold)
    reasons.push(`Completion at ${completionPercentage}% — below ${criteria.atRiskThreshold}% threshold`);
  // Trigger boolean checks — commented out pending principal decision
  // if (criteria.triggerNoEssays && essaysSubmitted === 0 && totalEssays > 0)
  //   reasons.push(`No essays submitted (0/${totalEssays})`);
  // if (criteria.triggerLowCompletion && completionPercentage < criteria.atRiskThreshold)
  //   reasons.push(`Completion critically low (${completionPercentage}%)`);
  // if (criteria.triggerNoRecs && recsSubmitted === 0 && recsRequested > 0)
  //   reasons.push("No recommendation letters received");
  if (reasons.length === 0) reasons.push("Overall progress requires attention");

  return { status, completionPercentage, hasNearDeadline, upcomingDeadlines, reasons };
}

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