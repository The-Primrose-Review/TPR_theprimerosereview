import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useParentPortalData = () => {
  const { data: assignment, isLoading } = useQuery({
    queryKey: ["parent-assignment"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("parent_student_assignments")
        .select("student_id")
        .eq("parent_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  const studentId = assignment?.student_id ?? null;

  const { data: studentProfile } = useQuery({
    queryKey: ["parent-student-profile", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, school_id")
        .eq("user_id", studentId!)
        .single();
      return data;
    },
  });

  const { data: studentAcademics } = useQuery({
    queryKey: ["parent-student-academics", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("student_profiles")
        .select("grade, gpa, sat_score, act_score, graduation_year")
        .eq("user_id", studentId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: school } = useQuery({
    queryKey: ["parent-school", studentProfile?.school_id],
    enabled: !!studentProfile?.school_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("schools")
        .select("name")
        .eq("id", studentProfile!.school_id!)
        .single();
      return data;
    },
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["parent-applications", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data: appList } = await supabase
        .from("applications")
        .select("*")
        .eq("student_id", studentId!)
        .order("deadline_date", { ascending: true });

      const apps = appList ?? [];
      const appIds = apps.map((a) => a.id);
      if (appIds.length === 0) return apps;

      const { data: slotsData } = await supabase
        .from("application_essays")
        .select("application_id, status")
        .in("application_id", appIds);

      const slotsByApp = new Map<string, { total: number; submitted: number }>();
      for (const slot of slotsData ?? []) {
        const entry = slotsByApp.get(slot.application_id) ?? { total: 0, submitted: 0 };
        entry.total++;
        if (["in_review", "approved"].includes(slot.status)) entry.submitted++;
        slotsByApp.set(slot.application_id, entry);
      }

      return apps.map((app) => {
        const slots = slotsByApp.get(app.id) ?? { total: 0, submitted: 0 };
        return {
          ...app,
          completion_percentage: slots.total > 0
            ? Math.round((slots.submitted / slots.total) * 100)
            : 0,
        };
      });
    },
  });

  const { data: essays = [] } = useQuery({
    queryKey: ["parent-essays", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("essay_feedback")
        .select("id, essay_title, status, created_at, sent_at, updated_at")
        .eq("student_id", studentId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["parent-recommendations", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("recommendation_requests")
        .select("id, referee_name, status, created_at")
        .eq("student_id", studentId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: counselorLink } = useQuery({
    queryKey: ["parent-counselor-link", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("student_counselor_assignments")
        .select("counselor_id")
        .eq("student_id", studentId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: counselorProfile } = useQuery({
    queryKey: ["parent-counselor-profile", counselorLink?.counselor_id],
    enabled: !!counselorLink?.counselor_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", counselorLink!.counselor_id)
        .single();
      return data;
    },
  });

  // Derived values
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const submittedApps = applications.filter(a => a.status === "submitted").length;
  const completedEssays = essays.filter(e => ["sent", "approved"].includes(e.status)).length;
  const completedRecs = recommendations.filter(r => r.status === "submitted").length;

  const urgentApps = applications.filter(a => {
    const d = new Date(a.deadline_date);
    return d >= now && d <= sevenDaysOut && a.status !== "submitted";
  });

  const warningApps = applications.filter(a => {
    const d = new Date(a.deadline_date);
    return d > sevenDaysOut && d <= fourteenDaysOut && a.status !== "submitted";
  });

  const thisWeekEssays = essays.filter(e => new Date(e.created_at) >= weekAgo);
  const thisWeekSubmitted = applications.filter(
    a => a.status === "submitted" && new Date(a.updated_at) >= weekAgo
  );

  const overallProgress =
    applications.length > 0
      ? Math.round(
          applications.reduce((s, a) => s + (a.completion_percentage ?? 0), 0) /
            applications.length
        )
      : 0;

  const journeyStages = [
    { label: "Profile Built",   completed: !!studentProfile?.full_name },
    { label: "College List",    completed: applications.length > 0 },
    { label: "Essays Started",  completed: essays.length > 0 },
    { label: "Apps Submitted",  completed: submittedApps > 0 },
    { label: "Recs Secured",    completed: completedRecs > 0 },
    { label: "Decisions",       completed: false },
  ];

  return {
    isLoading,
    hasStudent: !!studentId,
    studentProfile,
    studentAcademics,
    schoolName: school?.name ?? null,
    applications,
    essays,
    recommendations,
    counselorProfile,
    submittedApps,
    completedEssays,
    completedRecs,
    urgentApps,
    warningApps,
    thisWeekEssays,
    thisWeekSubmitted,
    overallProgress,
    journeyStages,
  };
};
