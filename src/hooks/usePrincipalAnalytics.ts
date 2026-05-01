import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePrincipalSchool } from "./usePrincipalSchool";
import { useAtRiskCriteria } from "./useAtRiskCriteria";
import { computeCompletion, classifyRisk } from "@/lib/atRiskUtils";

const CHART_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#ec4899","#84cc16"];

export interface LeaderStudent {
  id: string;
  name: string;
  avatarUrl: string | null;
  completionScore: number;
  riskLevel: "at-risk" | "needs-attention" | "on-track";
}

export interface LeaderCounselor {
  id: string;
  name: string;
  avatarUrl: string | null;
  avgCompletion: number;
  studentCount: number;
  atRiskCount: number;
}

export interface PrincipalAnalyticsData {
  avgSchoolCompletion: number;
  submissionTrend: { week: string; submissions: number }[];
  deadlinesByWeek: { week: string; count: number; urgent: number }[];
  riskDistribution: { name: string; value: number; color: string }[];
  appStatusDistribution: { name: string; value: number; color: string }[];
  schoolDistribution: { school: string; applications: number; color: string }[];
  completionBuckets: { range: string; count: number; fill: string }[];
  counselorPerf: { name: string; fullName: string; avgCompletion: number; atRiskCount: number; studentCount: number; fill: string }[];
  topStudents: LeaderStudent[];
  topCounselors: LeaderCounselor[];
  insights: string[];
}

function emptyData(): PrincipalAnalyticsData {
  return {
    avgSchoolCompletion: 0,
    submissionTrend: Array.from({ length: 6 }, (_, i) => ({ week: `Wk ${i + 1}`, submissions: 0 })),
    deadlinesByWeek: [],
    riskDistribution: [],
    appStatusDistribution: [],
    schoolDistribution: [],
    completionBuckets: [],
    counselorPerf: [],
    topStudents: [],
    topCounselors: [],
    insights: ["No students enrolled yet — data will appear once students join."],
  };
}

export const usePrincipalAnalytics = () => {
  const { data: school, isLoading: loadingSchool } = usePrincipalSchool();
  const { criteria, isLoading: loadingCriteria } = useAtRiskCriteria();

  return useQuery({
    queryKey: [
      "principal-analytics",
      school?.schoolId,
      criteria.atRiskThreshold,
      criteria.needsAttentionThreshold,
      criteria.essayWeight,
      criteria.recWeight,
    ],
    enabled: !!school?.schoolId && !loadingSchool && !loadingCriteria,
    queryFn: async (): Promise<PrincipalAnalyticsData> => {
      const schoolId = school!.schoolId;

      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("school_id", schoolId);

      const allProfileIds = allProfiles?.map(p => p.user_id) ?? [];
      if (allProfileIds.length === 0) return emptyData();

      const [studentRolesRes, counselorRolesRes] = await Promise.all([
        supabase.from("user_roles").select("user_id").eq("role", "student").in("user_id", allProfileIds),
        supabase.from("user_roles").select("user_id").eq("role", "counselor").in("user_id", allProfileIds),
      ]);

      const studentIds  = studentRolesRes.data?.map(r => r.user_id) ?? [];
      const counselorIds = counselorRolesRes.data?.map(r => r.user_id) ?? [];

      if (studentIds.length === 0) return emptyData();

      const todayStr    = new Date().toISOString().split("T")[0];
      const in30DaysStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const [essaysRes, appsRes, recsRes, assignmentsRes] = await Promise.all([
        supabase.from("essay_feedback").select("student_id, status, created_at").in("student_id", studentIds),
        supabase.from("applications").select("student_id, school_name, deadline_date, status").in("student_id", studentIds),
        supabase.from("recommendation_requests").select("student_id, status").in("student_id", studentIds),
        supabase.from("student_counselor_assignments").select("student_id, counselor_id").in("student_id", studentIds),
      ]);

      const allEssays   = essaysRes.data   ?? [];
      const allApps     = appsRes.data     ?? [];
      const allRecs     = recsRes.data     ?? [];
      const assignments = assignmentsRes.data ?? [];

      const profileMap = new Map((allProfiles ?? []).map(p => [p.user_id, p]));

      // ── Per-student completion ────────────────────────────
      const essayMap = new Map<string, { total: number; done: number }>();
      const recMap   = new Map<string, { total: number; done: number }>();

      for (const e of allEssays) {
        if (!essayMap.has(e.student_id)) essayMap.set(e.student_id, { total: 0, done: 0 });
        const en = essayMap.get(e.student_id)!;
        en.total++;
        if (["sent", "read", "approved"].includes(e.status)) en.done++;
      }
      for (const r of allRecs) {
        if (!recMap.has(r.student_id)) recMap.set(r.student_id, { total: 0, done: 0 });
        const en = recMap.get(r.student_id)!;
        en.total++;
        if (r.status === "sent") en.done++;
      }

      const urgentSet = new Set(
        allApps
          .filter(a => a.status !== "submitted" && a.deadline_date >= todayStr && a.deadline_date <= in30DaysStr)
          .map(a => a.student_id)
      );

      const scoreOf = (sid: string) => {
        const e = essayMap.get(sid) ?? { total: 0, done: 0 };
        const r = recMap.get(sid)   ?? { total: 0, done: 0 };
        return computeCompletion(e.done, e.total, r.done, r.total, criteria);
      };

      const riskOf = (sid: string) =>
        classifyRisk(scoreOf(sid), urgentSet.has(sid), criteria);

      // ── School avg completion ─────────────────────────────
      const allScores = studentIds.map(scoreOf);
      const avgSchoolCompletion = allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0;

      // ── Risk distribution ─────────────────────────────────
      let onTrack = 0, needsAttn = 0, atRisk = 0;
      for (const sid of studentIds) {
        const r = riskOf(sid);
        if (r === "at-risk") atRisk++;
        else if (r === "needs-attention") needsAttn++;
        else onTrack++;
      }
      const riskDistribution = [
        { name: "On Track",        value: onTrack,   color: "#10b981" },
        { name: "Needs Attention", value: needsAttn, color: "#f59e0b" },
        { name: "At Risk",         value: atRisk,    color: "#ef4444" },
      ].filter(d => d.value > 0);

      // ── Completion buckets (histogram) ────────────────────
      const BUCKETS = [
        { range: "0–20%",   min: 0,  max: 20,  fill: "#ef4444" },
        { range: "21–40%",  min: 21, max: 40,  fill: "#f97316" },
        { range: "41–60%",  min: 41, max: 60,  fill: "#f59e0b" },
        { range: "61–80%",  min: 61, max: 80,  fill: "#84cc16" },
        { range: "81–100%", min: 81, max: 100, fill: "#10b981" },
      ];
      const completionBuckets = BUCKETS.map(b => ({
        range: b.range,
        fill: b.fill,
        count: allScores.filter(s => s >= b.min && s <= b.max).length,
      }));

      // ── App status distribution ───────────────────────────
      const appStatusDistribution = [
        { name: "Submitted",   value: allApps.filter(a => a.status === "submitted").length,   color: "#10b981" },
        { name: "In Progress", value: allApps.filter(a => a.status === "in_progress").length, color: "#3b82f6" },
        { name: "Pending",     value: allApps.filter(a => !["submitted","in_progress"].includes(a.status)).length, color: "#9ca3af" },
      ].filter(d => d.value > 0);

      // ── Popular target schools ────────────────────────────
      const schoolCounts: Record<string, number> = {};
      for (const a of allApps) {
        if (a.school_name) schoolCounts[a.school_name] = (schoolCounts[a.school_name] ?? 0) + 1;
      }
      const schoolDistribution = Object.entries(schoolCounts)
        .map(([school, applications], i) => ({ school, applications, color: CHART_COLORS[i % CHART_COLORS.length] }))
        .sort((a, b) => b.applications - a.applications)
        .slice(0, 8);

      // ── Essay submission trend (last 6 weeks) ─────────────
      const nowTs = new Date();
      nowTs.setHours(23, 59, 59, 999);
      const submissionTrend = Array.from({ length: 6 }, (_, i) => {
        const weekEnd = new Date(nowTs);
        weekEnd.setDate(weekEnd.getDate() - (5 - i) * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 7);
        return {
          week: `Wk ${i + 1}`,
          submissions: allEssays.filter(e => {
            const d = new Date(e.created_at);
            return d >= weekStart && d < weekEnd;
          }).length,
        };
      });

      // ── Deadlines by week (next 6 weeks) ──────────────────
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const deadlinesByWeek = Array.from({ length: 6 }, (_, i) => {
        const wStart = new Date(todayDate);
        wStart.setDate(wStart.getDate() + i * 7);
        const wEnd = new Date(wStart);
        wEnd.setDate(wEnd.getDate() + 7);
        const week = allApps.filter(a => {
          const d = new Date(a.deadline_date);
          return d >= wStart && d < wEnd && a.status !== "submitted";
        });
        return {
          week: wStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          count: week.length,
          urgent: week.filter(a => {
            const days = Math.ceil((new Date(a.deadline_date).getTime() - Date.now()) / 86400000);
            return days <= 3;
          }).length,
        };
      });

      // ── Counselor→students map ────────────────────────────
      const cStudentMap = new Map<string, string[]>();
      for (const cid of counselorIds) cStudentMap.set(cid, []);
      for (const a of assignments) {
        if (cStudentMap.has(a.counselor_id)) cStudentMap.get(a.counselor_id)!.push(a.student_id);
      }

      // ── Counselor performance ─────────────────────────────
      const counselorPerf = counselorIds
        .map((cid, i) => {
          const sids   = cStudentMap.get(cid) ?? [];
          const scores = sids.map(scoreOf);
          const avg    = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
          const name   = profileMap.get(cid)?.full_name ?? "Unknown";
          return {
            name:           name.split(" ")[0],
            fullName:       name,
            avgCompletion:  avg,
            atRiskCount:    sids.filter(s => riskOf(s) === "at-risk").length,
            studentCount:   sids.length,
            fill:           CHART_COLORS[i % CHART_COLORS.length],
          };
        })
        .filter(c => c.studentCount > 0)
        .sort((a, b) => b.avgCompletion - a.avgCompletion);

      // ── Leaderboards ──────────────────────────────────────
      const topStudents: LeaderStudent[] = studentIds
        .map(sid => ({
          id:              sid,
          name:            profileMap.get(sid)?.full_name ?? "Unknown",
          avatarUrl:       profileMap.get(sid)?.avatar_url ?? null,
          completionScore: scoreOf(sid),
          riskLevel:       riskOf(sid),
        }))
        .sort((a, b) => b.completionScore - a.completionScore)
        .slice(0, 3);

      const topCounselors: LeaderCounselor[] = counselorIds
        .map(cid => {
          const sids   = cStudentMap.get(cid) ?? [];
          const scores = sids.map(scoreOf);
          const avg    = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
          return {
            id:            cid,
            name:          profileMap.get(cid)?.full_name ?? "Unknown",
            avatarUrl:     profileMap.get(cid)?.avatar_url ?? null,
            avgCompletion: avg,
            studentCount:  sids.length,
            atRiskCount:   sids.filter(s => riskOf(s) === "at-risk").length,
          };
        })
        .filter(c => c.studentCount > 0)
        .sort((a, b) => b.avgCompletion - a.avgCompletion)
        .slice(0, 3);

      // ── Key insights ──────────────────────────────────────
      const insights: string[] = [];
      if (atRisk > 0)
        insights.push(`${atRisk} student${atRisk > 1 ? "s are" : " is"} at risk — urgent counselor follow-up needed.`);
      const urgent7 = allApps.filter(a => {
        const days = Math.ceil((new Date(a.deadline_date).getTime() - Date.now()) / 86400000);
        return days >= 0 && days <= 7 && a.status !== "submitted";
      }).length;
      if (urgent7 > 0)
        insights.push(`${urgent7} application${urgent7 > 1 ? "s have" : " has"} a deadline within 7 days.`);
      const pendingEssays = allEssays.filter(e => e.status === "pending").length;
      if (pendingEssays > 0)
        insights.push(`${pendingEssays} essay${pendingEssays > 1 ? "s are" : " is"} awaiting counselor review.`);
      if (needsAttn > 0 && insights.length < 4)
        insights.push(`${needsAttn} student${needsAttn > 1 ? "s need" : " needs"} attention before deadlines hit.`);
      if (avgSchoolCompletion < criteria.atRiskThreshold && insights.length < 4)
        insights.push(`School avg completion is only ${avgSchoolCompletion}% — below the at-risk threshold.`);
      if (schoolDistribution[0] && insights.length < 4)
        insights.push(`${schoolDistribution[0].school} is the most popular target school.`);
      if (insights.length === 0)
        insights.push("All students are on track — excellent school-wide performance! 🎉");

      return {
        avgSchoolCompletion,
        submissionTrend,
        deadlinesByWeek,
        riskDistribution,
        appStatusDistribution,
        schoolDistribution,
        completionBuckets,
        counselorPerf,
        topStudents,
        topCounselors,
        insights: insights.slice(0, 4),
      };
    },
  });
};
