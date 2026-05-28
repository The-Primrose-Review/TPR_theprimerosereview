import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAtRiskCriteria } from "./useAtRiskCriteria";
import { computeCompletion, classifyRisk } from "@/lib/atRiskUtils";

export interface DashboardStudent {
  id: string;
  name: string;
  gpa: number | null;
  satScore: number | null;
  completionPercentage: number;
  essaysSubmitted: number;
  totalEssays: number;
  upcomingDeadlines: number;
  status: "on-track" | "needs-attention" | "at-risk";
  lastActivity: string;
}

export interface DashboardEssay {
  id: string;
  title: string;
  studentName: string;
  prompt: string | null;
  wordCount: number;
  status: string;
  lastUpdated: string;
}

export const useIndexDashboard = () => {
  const { criteria, isLoading: loadingCriteria } = useAtRiskCriteria();

  // ── Students needing attention ─────────────────────────────
  const {
    data: students = [],
    isLoading: isLoadingStudents,
  } = useQuery({
    queryKey: ["dashboard-students", criteria.atRiskThreshold, criteria.needsAttentionThreshold, criteria.essayWeight, criteria.recWeight],
    enabled: !loadingCriteria,
    queryFn: async (): Promise<DashboardStudent[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Use user_roles instead of assignments
      // const { data: studentRoles } = await supabase
      //   .from("user_roles")
      //   .select("user_id")
      //   .eq("role", "student");

      // const studentIds = studentRoles?.map((r) => r.user_id) ?? [];
      const { data: assignments } = await supabase
        .from("student_counselor_assignments")
        .select("student_id")
        .eq("counselor_id", user.id);

      const studentIds = assignments?.map((a) => a.student_id) ?? [];
      if (studentIds.length === 0) return [];

      // Fetch all data in parallel
      const [profilesRes, studentProfilesRes, essaySlotsRes, recsRes, applicationsRes] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("user_id, full_name, updated_at")
            .in("user_id", studentIds),

          supabase
            .from("student_profiles")
            .select("user_id, gpa, sat_score")
            .in("user_id", studentIds),

          // application_essays joined through applications to scope by student
          (supabase
            .from("application_essays")
            .select("id, status, updated_at, applications!inner(student_id)") as any)
            .in("applications.student_id", studentIds),

          supabase
            .from("recommendation_requests")
            .select("student_id, status")
            .in("student_id", studentIds),

          supabase
            .from("applications")
            .select("student_id, deadline_date, status")
            .in("student_id", studentIds),
        ]);

      const profileMap = new Map(
        (profilesRes.data ?? []).map((p) => [p.user_id, p])
      );
      const studentProfileMap = new Map(
        (studentProfilesRes.data ?? []).map((p) => [p.user_id, p])
      );

      // Flatten essay slots: attach student_id from the nested applications join
      const allSlots = (essaySlotsRes.data ?? []).map((row: any) => ({
        studentId: row.applications.student_id as string,
        status:    row.status as string,
        updatedAt: row.updated_at as string,
      }));

      const now = new Date();

      return studentIds.map((id): DashboardStudent => {
        const profile = profileMap.get(id);
        const sp = studentProfileMap.get(id);
        const slots = allSlots.filter((s: { studentId: string; status: string; updatedAt: string }) => s.studentId === id);
        const recs = (recsRes.data ?? []).filter((r) => r.student_id === id);
        const studentApps = (applicationsRes.data ?? []).filter((a) => a.student_id === id);

        const totalEssays = slots.length;
        const essaysSubmitted = slots.filter((s: { status: string }) =>
          ["in_review", "approved"].includes(s.status)
        ).length;
        const recsRequested = recs.length;
        const recsSubmitted = recs.filter((r) => r.status === "sent").length;

        const completionPercentage = computeCompletion(essaysSubmitted, totalEssays, recsSubmitted, recsRequested, criteria);

        const fourteenDaysFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const hasNearDeadline = studentApps.some(
          (a) =>
            a.status !== "sent" &&
            a.deadline_date &&
            new Date(a.deadline_date) <= fourteenDaysFromNow
        );

        const status = classifyRisk(completionPercentage, hasNearDeadline, criteria) as DashboardStudent["status"];

        // Last activity = most recent essay slot updated_at
        const lastEssayUpdate = slots
          .map((s: { updatedAt: string }) => new Date(s.updatedAt).getTime())
          .sort((a: number, b: number) => b - a)[0];

        const lastActivity = lastEssayUpdate
          ? formatRelativeTime(lastEssayUpdate)
          : "No activity";

        return {
          id,
          name: profile?.full_name ?? "Unknown Student",
          gpa: sp?.gpa ?? null,
          satScore: sp?.sat_score ?? null,
          completionPercentage,
          essaysSubmitted,
          totalEssays,
          upcomingDeadlines: studentApps.filter(
            (a) => a.status !== "sent" && a.deadline_date && new Date(a.deadline_date) <= fourteenDaysFromNow
          ).length,
          status,
          lastActivity,
        };
      });
    },
  });

  // ── Essays for review ──────────────────────────────────────
  const {
    data: essays = [],
    isLoading: isLoadingEssays,
  } = useQuery({
    queryKey: ["dashboard-essays"],
    queryFn: async (): Promise<DashboardEssay[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Use user_roles instead of assignments
      // const { data: studentRoles } = await supabase
      //   .from("user_roles")
      //   .select("user_id")
      //   .eq("role", "student");

      // const studentIds = studentRoles?.map((r) => r.user_id) ?? [];
      const { data: assignments } = await supabase
        .from("student_counselor_assignments")
        .select("student_id")
        .eq("counselor_id", user.id);

      const studentIds = assignments?.map((a) => a.student_id) ?? [];
      if (studentIds.length === 0) return [];

      // Fetch essays without join (avoids foreign key issue)
      const { data, error } = await supabase
        .from("essay_feedback")
        .select("id, essay_title, essay_prompt, essay_content, status, updated_at, student_id")
        .in("student_id", studentIds)
        .in("status", ["draft", "in_progress","pending"])
        .order("updated_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      // Fetch profiles separately
      const profileIds = [...new Set((data ?? []).map((e) => e.student_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", profileIds);

      return (data ?? []).map((e): DashboardEssay => ({
        id: e.id,
        title: e.essay_title,
        studentName:
          profilesData?.find((p) => p.user_id === e.student_id)?.full_name ??
          "Unknown Student",
        prompt: e.essay_prompt,
        wordCount: e.essay_content
          ? e.essay_content.split(/\s+/).filter(Boolean).length
          : 0,
        status: e.status,
        lastUpdated: formatRelativeTime(new Date(e.updated_at).getTime()),
      }));
    },
  });

  const studentsNeedingAttention = students.filter(
    (s) => s.status === "needs-attention"
  );

  const studentsAtRisk = students.filter(
    (s) => s.status === "at-risk"
  );

  return {
    students: studentsNeedingAttention,
    studentsAtRisk,
    allStudents: students,
    essays,
    isLoadingStudents,
    isLoadingEssays,
  };
};

// ── Utility ───────────────────────────────────────────────────
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}