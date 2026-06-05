import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAtRiskCriteria } from "./useAtRiskCriteria";
import { resolveStudentStatus } from "@/lib/atRiskUtils";

export interface DashboardStatsData {
  totalStudents: number;
  essaysInReview: number;
  upcomingDeadlines: number;
  atRiskStudents: number;
}

export const useDashboardStats = () => {
  const { criteria, isLoading: loadingCriteria } = useAtRiskCriteria();

  return useQuery({
    queryKey: ["dashboard-stats", criteria.atRiskThreshold, criteria.essayWeight, criteria.recWeight],
    enabled: !loadingCriteria,
    queryFn: async (): Promise<DashboardStatsData> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get ALL students in the system via user_roles
      // const { data: studentRoles, error: studentError } = await supabase
      //   .from("user_roles")
      //   .select("user_id")
      //   .eq("role", "student");

    

      // if (studentError) throw studentError;

      // const studentIds = studentRoles?.map((s) => s.user_id) ?? [];
      const { data: assignments, error: assignmentError } = await supabase
  .from("student_counselor_assignments")
  .select("student_id")
  .eq("counselor_id", user.id);

if (assignmentError) throw assignmentError;

const studentIds = assignments?.map((a) => a.student_id) ?? [];

      if (studentIds.length === 0) {
        return {
          totalStudents: 0,
          essaysInReview: 0,
          upcomingDeadlines: 0,
          atRiskStudents: 0,
        };
      }

      

      // Run all counts in parallel
      // const [essaysRes, deadlinesRes, atRiskRes] = await Promise.all([
      //   // Essays currently in review
      //   supabase
      //     .from("essay_feedback")
      //     .select("id", { count: "exact", head: true })
      //     .in("student_id", studentIds)
      //     .in("status", ["draft", "in_progress"]),

      //   // Applications with deadlines in the next 7 days
      //   supabase
      //     .from("applications")
      //     .select("id", { count: "exact", head: true })
      //     .in("student_id", studentIds)
      //     .gte("deadline_date", new Date().toISOString().split("T")[0])
      //     .lte(
      //       "deadline_date",
      //       new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      //         .toISOString()
      //         .split("T")[0]
      //     )
      //     .neq("status", "submitted"),

      //   // At risk: urgent=true or completion < 30%
      //   supabase
      //     .from("applications")
      //     .select("student_id", { count: "exact", head: false })
      //     .in("student_id", studentIds)
      //     .or("urgent.eq.true,completion_percentage.lt.30"),
      // ]);

      // Deduplicate at-risk student IDs
      // const atRiskStudentIds = new Set(
      //   (atRiskRes.data ?? []).map((r) => r.student_id)
      // );

      // return {
      //   totalStudents: studentIds.length,
      //   essaysInReview: essaysRes.count ?? 0,
      //   upcomingDeadlines: deadlinesRes.count ?? 0,
      //   atRiskStudents: atRiskStudentIds.size,
      // };
      // Step 1: essays in review + all applications (parallel — apps needed for appIds)
      const [essaysInReviewRes, applicationsRes] = await Promise.all([
        supabase
          .from("essay_feedback")
          .select("id", { count: "exact", head: true })
          .in("student_id", studentIds)
          .in("status", ["draft", "in_progress", "pending"]),

        supabase
          .from("applications")
          .select("id, student_id, deadline_date, status")
          .in("student_id", studentIds),
      ]);

      const applicationsData = applicationsRes.data ?? [];
      const appIds = applicationsData.map(a => a.id);

      // Step 2: essay slots + recs (parallel — essay slots need appIds from step 1)
      const [essaySlotsRes, recsRes] = await Promise.all([
        appIds.length > 0
          ? supabase
              .from("application_essays")
              .select("application_id, status")
              .in("application_id", appIds)
          : Promise.resolve({ data: [] as { application_id: string; status: string }[], error: null }),

        supabase
          .from("recommendation_requests")
          .select("student_id, status")
          .in("student_id", studentIds),
      ]);

      const perStudent = studentIds.map(studentId => {
        const studentApps = applicationsData.filter(a => a.student_id === studentId);
        const studentAppIds = studentApps.map(a => a.id);
        const studentSlots = (essaySlotsRes.data ?? []).filter(s => studentAppIds.includes(s.application_id));
        const studentRecs = (recsRes.data ?? []).filter(r => r.student_id === studentId);
        return resolveStudentStatus(studentApps, studentSlots, studentRecs, criteria);
      });

      return {
        totalStudents: studentIds.length,
        essaysInReview: essaysInReviewRes.count ?? 0,
        upcomingDeadlines: perStudent.reduce((sum, s) => sum + s.upcomingDeadlines, 0),
        atRiskStudents: perStudent.filter(s => s.status === "at-risk").length,
      };
    },
  });
};

