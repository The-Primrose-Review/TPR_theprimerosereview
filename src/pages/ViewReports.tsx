import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import {
  Users,
  FileText,
  Calendar,
  Download,
  Share,
  AlertTriangle,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Lightbulb,
  GraduationCap,
  School,
  Loader2,
} from "lucide-react";

const CHART_COLORS = [
  "#3b82f6","#ef4444","#10b981","#f59e0b",
  "#8b5cf6","#06b6d4","#ec4899","#84cc16",
];

interface StudentReport {
  id: string;
  name: string;
  avatar: string | null;
  overallProgress: number;
  essaysCompleted: number;
  totalEssays: number;
  applicationsSubmitted: number;
  totalApplications: number;
  recsReceived: number;
  totalRecs: number;
  riskLevel: "low" | "medium" | "high";
}

const ViewReports = () => {
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rawStudents, setRawStudents] = useState<any[]>([]);
  const [rawApplications, setRawApplications] = useState<any[]>([]);
  const [rawEssays, setRawEssays] = useState<any[]>([]);
  const [rawRecs, setRawRecs] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assignments } = await supabase
        .from("student_counselor_assignments")
        .select("student_id")
        .eq("counselor_id", user.id);

      const studentIds = assignments?.map((a) => a.student_id) ?? [];
      if (studentIds.length === 0) { setLoading(false); return; }

      const [profileRes, appRes, essayRes, recRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", studentIds),
        supabase.from("applications")
          .select("id, student_id, school_name, deadline_date, status, required_essays, completed_essays, recommendations_requested, recommendations_submitted")
          .in("student_id", studentIds),
        supabase.from("essay_feedback").select("id, student_id, status, created_at").in("student_id", studentIds),
        supabase.from("recommendation_requests").select("id, student_id, status").in("student_id", studentIds),
      ]);

      setRawStudents(profileRes.data ?? []);
      setRawApplications(appRes.data ?? []);
      setRawEssays(essayRes.data ?? []);
      setRawRecs(recRes.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  // ── Student reports ──────────────────────────────────────────────────────
  // Mirrors useIndexDashboard exactly: essays (60%) + recs (40%), at-risk only
  // when completionPercentage < 40 AND a deadline is within 30 days.
  const studentReports = useMemo<StudentReport[]>(() => {
    const now = new Date();
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return rawStudents.map((student) => {
      const essays = rawEssays.filter((e) => e.student_id === student.user_id);
      const recs   = rawRecs.filter((r) => r.student_id === student.user_id);
      const apps   = rawApplications.filter((a) => a.student_id === student.user_id);

      // Completion score — same weights as useIndexDashboard
      const totalEssays     = essays.length;
      const essaysCompleted = essays.filter((e) => ["sent", "read", "approved"].includes(e.status)).length;
      const essayScore = totalEssays > 0 ? (essaysCompleted / totalEssays) * 60 : 0;

      const totalRecs     = recs.length;
      const recsCompleted = recs.filter((r) => ["sent", "completed"].includes(r.status)).length;
      const recScore = totalRecs > 0 ? (recsCompleted / totalRecs) * 40 : 0;

      const overallProgress = Math.round(essayScore + recScore);

      // Near-deadline flag — any unsubmitted app due within 30 days
      const hasNearDeadline = apps.some((a) => {
        const d = new Date(a.deadline_date);
        return a.status !== "submitted" && d >= now && d <= in30Days;
      });

      // Same logic as useIndexDashboard: at-risk requires BOTH low score AND near deadline
      const riskLevel: "low" | "medium" | "high" =
        overallProgress >= 60
          ? "low"
          : hasNearDeadline && overallProgress < 40
          ? "high"
          : "medium";

      // For display cards still use applications table counts
      const applicationsSubmitted = apps.filter((a) => a.status === "submitted").length;
      const totalApplications     = apps.length;
      const recsReceived = apps.reduce((sum, a) => sum + (a.recommendations_submitted ?? 0), 0);
      const totalRecsFromApps = apps.reduce((sum, a) => sum + (a.recommendations_requested ?? 0), 0);

      return {
        id: student.user_id,
        name: student.full_name ?? "Unknown",
        avatar: student.avatar_url,
        overallProgress,
        essaysCompleted,
        totalEssays: Math.max(totalEssays, 1),
        applicationsSubmitted,
        totalApplications: Math.max(totalApplications, 1),
        recsReceived,
        totalRecs: Math.max(totalRecsFromApps, 1),
        riskLevel,
      };
    });
  }, [rawStudents, rawEssays, rawRecs, rawApplications]);

  // ── Overview metrics ─────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const submittedEssays = rawEssays.filter((e) =>
      ["pending", "sent", "read"].includes(e.status)
    ).length;
    const upcomingDeadlines = rawApplications.filter((a) => {
      const days = Math.ceil((new Date(a.deadline_date).getTime() - Date.now()) / 86400000);
      return days >= 0 && days <= 30 && a.status !== "submitted";
    }).length;
    const avgProgress = studentReports.length > 0
      ? Math.round(studentReports.reduce((s, r) => s + r.overallProgress, 0) / studentReports.length)
      : 0;
    const atRisk = studentReports.filter((s) => s.riskLevel !== "low").length;
    return { totalStudents: rawStudents.length, submittedEssays, upcomingDeadlines, avgProgress, atRisk };
  }, [rawStudents, rawEssays, rawApplications, studentReports]);

  // ── Application distribution ─────────────────────────────────────────────
  const applicationDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    rawApplications.forEach((a) => {
      counts[a.school_name] = (counts[a.school_name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([school, count], i) => ({ school, applications: count, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 8);
  }, [rawApplications]);

  // ── Deadlines by week (next 6 weeks) ─────────────────────────────────────
  const deadlinesByWeek = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Array.from({ length: 6 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekApps = rawApplications.filter((a) => {
        const d = new Date(a.deadline_date);
        return d >= weekStart && d < weekEnd && a.status !== "submitted";
      });
      return {
        week: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: weekApps.length,
        urgent: weekApps.filter((a) => {
          const days = Math.ceil((new Date(a.deadline_date).getTime() - Date.now()) / 86400000);
          return days <= 3;
        }).length,
      };
    });
  }, [rawApplications]);

  // ── Essay submission trend (past 6 weeks) ────────────────────────────────
  const submissionTrend = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return Array.from({ length: 6 }, (_, i) => {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - (5 - i) * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);
      const count = rawEssays.filter((e) => {
        const d = new Date(e.created_at);
        return d >= weekStart && d < weekEnd;
      }).length;
      return { week: `Week ${i + 1}`, submissions: count };
    });
  }, [rawEssays]);

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const aggregateStats = useMemo(() => {
    const submitted  = rawApplications.filter((a) => a.status === "submitted").length;
    const inProgress = rawApplications.filter((a) => a.status === "in_progress").length;
    const other      = rawApplications.length - submitted - inProgress;
    const recsCompleted = rawRecs.filter((r) => r.status === "completed").length;
    const recsPending   = rawRecs.filter((r) => ["pending", "in_progress"].includes(r.status)).length;
    const essayPending  = rawEssays.filter((e) => e.status === "pending").length;
    const essaySent     = rawEssays.filter((e) => e.status === "sent").length;
    const essayRead     = rawEssays.filter((e) => e.status === "read").length;
    return {
      apps: { submitted, inProgress, other },
      recs: { completed: recsCompleted, pending: recsPending },
      essays: { pending: essayPending, sent: essaySent, read: essayRead },
    };
  }, [rawApplications, rawRecs, rawEssays]);

  // ── Key insights ─────────────────────────────────────────────────────────
  const keyInsights = useMemo(() => {
    const insights: string[] = [];
    const highRisk = studentReports.filter((s) => s.riskLevel === "high").length;
    const medRisk  = studentReports.filter((s) => s.riskLevel === "medium").length;
    const pendingRecs = rawRecs.filter((r) => ["pending", "in_progress"].includes(r.status)).length;
    const urgentDeadlines = rawApplications.filter((a) => {
      const days = Math.ceil((new Date(a.deadline_date).getTime() - Date.now()) / 86400000);
      return days >= 0 && days <= 7 && a.status !== "submitted";
    }).length;
    const pendingEssays = rawEssays.filter((e) => e.status === "pending").length;
    const top = applicationDistribution[0];

    if (highRisk > 0)
      insights.push(`${highRisk} student${highRisk > 1 ? "s are" : " is"} at high risk — schedule urgent check-ins.`);
    if (urgentDeadlines > 0)
      insights.push(`${urgentDeadlines} application${urgentDeadlines > 1 ? "s have" : " has"} a deadline within 7 days.`);
    if (pendingEssays > 0)
      insights.push(`${pendingEssays} essay${pendingEssays > 1 ? "s are" : " is"} awaiting your review and feedback.`);
    if (pendingRecs > 0)
      insights.push(`${pendingRecs} recommendation letter${pendingRecs > 1 ? "s are" : " is"} still pending from teachers.`);
    if (medRisk > 0 && insights.length < 4)
      insights.push(`${medRisk} student${medRisk > 1 ? "s are" : " is"} at medium risk — follow up on their progress.`);
    if (top && insights.length < 4)
      insights.push(`${top.school} is the most applied school with ${top.applications} student${top.applications > 1 ? "s" : ""}.`);
    if (insights.length === 0)
      insights.push("All students are on track — no urgent items detected.");

    return insights.slice(0, 4);
  }, [studentReports, rawRecs, rawApplications, rawEssays, applicationDistribution]);

  const getRiskBadge = (level: string): "destructive" | "secondary" | "default" =>
    level === "high" ? "destructive" : level === "medium" ? "secondary" : "default";

  const handleExport = (format: string, type: string) => {
    toast({ title: `Exporting ${type}`, description: `Your ${type} report is being prepared in ${format.toUpperCase()} format.` });
  };

  const handleShareReport = (studentName: string) => {
    toast({ title: "Report Shared", description: `Parent summary for ${studentName} has been sent via email.` });
  };

  const displayedStudents = selectedStudent === "all"
    ? studentReports
    : studentReports.filter((s) => s.id === selectedStudent);

  const atRiskStudents = studentReports.filter((s) => s.riskLevel !== "low");

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">View Reports</h1>
          <p className="text-muted-foreground">Analytics and insights for your students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("pdf", "Full Report")}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport("excel", "Data Export")}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { icon: Users,       label: "Total Students",      value: metrics.totalStudents,   color: "text-primary" },
          { icon: FileText,    label: "Essays Submitted",    value: metrics.submittedEssays, color: "text-blue-600" },
          { icon: AlertTriangle, label: "At Risk Students",  value: metrics.atRisk,          color: "text-destructive" },
          { icon: Calendar,    label: "Upcoming Deadlines",  value: metrics.upcomingDeadlines, color: "text-orange-600" },
          { icon: Target,      label: "Avg Completion",      value: `${metrics.avgProgress}%`, color: "text-green-600" },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Insights */}
      <Card className="bg-gradient-subtle border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {keyInsights.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {keyInsights.map((insight, i) => (
                <div key={i} className="p-3 bg-background/50 rounded-lg border">
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Reports</TabsTrigger>
          <TabsTrigger value="aggregate">Aggregate Analytics</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Essay Submission Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" />
                  Essay Submission Activity (Last 6 Weeks)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rawEssays.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-16">No essays submitted yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={submissionTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="submissions" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Submissions" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Popular Schools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Popular Schools
                </CardTitle>
              </CardHeader>
              <CardContent>
                {applicationDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-16">No applications yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={applicationDistribution.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="applications"
                        label={({ school, applications }) => `${school}: ${applications}`}
                      >
                        {applicationDistribution.slice(0, 6).map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Deadlines by Week */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Upcoming Deadlines by Week (Next 6 Weeks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rawApplications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-16">No applications yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deadlinesByWeek}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="Total Deadlines" />
                    <Bar dataKey="urgent" fill="#ef4444" name="Urgent (≤3 days)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Individual Reports Tab ── */}
        <TabsContent value="individual" className="space-y-6">
          <div className="flex items-center gap-4">
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {studentReports.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {displayedStudents.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No students assigned yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {displayedStudents.map((student) => (
                <Card key={student.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={student.avatar ?? undefined} alt={student.name} />
                          <AvatarFallback className="text-lg">
                            {student.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-semibold">{student.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">Overall Progress:</span>
                            <Progress value={student.overallProgress} className="w-32 h-2" />
                            <span className="font-medium">{student.overallProgress}%</span>
                          </div>
                          <Badge variant={getRiskBadge(student.riskLevel)} className="mt-2">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {student.riskLevel.toUpperCase()} Risk
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleShareReport(student.name)}>
                          <Share className="h-4 w-4 mr-2" />
                          Share with Parents
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleExport("pdf", `${student.name} Report`)}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Essays</span>
                        </div>
                        <div className="text-lg font-semibold">{student.essaysCompleted}/{student.totalEssays}</div>
                        <Progress value={(student.essaysCompleted / student.totalEssays) * 100} className="h-2 mt-2" />
                      </div>

                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <School className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Applications</span>
                        </div>
                        <div className="text-lg font-semibold">{student.applicationsSubmitted}/{student.totalApplications}</div>
                        <Progress value={(student.applicationsSubmitted / student.totalApplications) * 100} className="h-2 mt-2" />
                      </div>

                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <GraduationCap className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium">Recommendations</span>
                        </div>
                        <div className="text-lg font-semibold">{student.recsReceived}/{student.totalRecs}</div>
                        <Progress value={(student.recsReceived / student.totalRecs) * 100} className="h-2 mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Aggregate Analytics Tab ── */}
        <TabsContent value="aggregate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* School distribution bar chart */}
            <Card>
              <CardHeader>
                <CardTitle>Complete Application Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {applicationDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-20">No applications yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={applicationDistribution} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="school" type="category" width={90} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="applications" fill="#3b82f6" name="Applications" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Essay Submission Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Essay Submissions Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={submissionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="submissions"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                      name="Submissions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Application Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Submitted</span>
                  <span className="font-medium text-green-600">{aggregateStats.apps.submitted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">In Progress</span>
                  <span className="font-medium text-yellow-600">{aggregateStats.apps.inProgress}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Planning</span>
                  <span className="font-medium text-muted-foreground">{aggregateStats.apps.other}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Essay Review Pipeline</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Awaiting Review</span>
                  <span className="font-medium text-orange-600">{aggregateStats.essays.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Feedback Sent</span>
                  <span className="font-medium text-blue-600">{aggregateStats.essays.sent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Read by Student</span>
                  <span className="font-medium text-green-600">{aggregateStats.essays.read}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Recommendation Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completed</span>
                  <span className="font-medium text-green-600">{aggregateStats.recs.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pending / In Progress</span>
                  <span className="font-medium text-yellow-600">{aggregateStats.recs.pending}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Risk Analysis Tab ── */}
        <TabsContent value="risk" className="space-y-6">
          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Students at Risk ({atRiskStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {atRiskStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  All students are on track — no at-risk students right now.
                </p>
              ) : (
                <div className="space-y-4">
                  {atRiskStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={student.avatar ?? undefined} alt={student.name} />
                          <AvatarFallback>
                            {student.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{student.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">Progress:</span>
                            <Progress value={student.overallProgress} className="w-24 h-2" />
                            <span className="text-sm font-medium">{student.overallProgress}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getRiskBadge(student.riskLevel)}>
                          {student.riskLevel.toUpperCase()} Risk
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          {student.essaysCompleted}/{student.totalEssays} essays · {student.applicationsSubmitted}/{student.totalApplications} apps
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Risk Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "High Risk", count: studentReports.filter(s => s.riskLevel === "high").length, variant: "destructive" as const },
                  { label: "Medium Risk", count: studentReports.filter(s => s.riskLevel === "medium").length, variant: "secondary" as const },
                  { label: "On Track",   count: studentReports.filter(s => s.riskLevel === "low").length,    variant: "default" as const },
                ].map(({ label, count, variant }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <Badge variant={variant}>{count} student{count !== 1 ? "s" : ""}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Recommended Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {studentReports.filter(s => s.riskLevel === "high").length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="font-medium text-red-700 dark:text-red-400 mb-1">Immediate Attention</h4>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      Schedule urgent meetings with {studentReports.filter(s => s.riskLevel === "high").map(s => s.name.split(" ")[0]).join(", ")}.
                    </p>
                  </div>
                )}
                {aggregateStats.recs.pending > 0 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <h4 className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">Follow Up Required</h4>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300">
                      {aggregateStats.recs.pending} recommendation letter{aggregateStats.recs.pending > 1 ? "s are" : " is"} still pending from teachers.
                    </p>
                  </div>
                )}
                {aggregateStats.essays.pending > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-1">Essay Reviews Pending</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      {aggregateStats.essays.pending} essay{aggregateStats.essays.pending > 1 ? "s are" : " is"} waiting for your feedback.
                    </p>
                  </div>
                )}
                {studentReports.filter(s => s.riskLevel === "high").length === 0 &&
                 aggregateStats.recs.pending === 0 &&
                 aggregateStats.essays.pending === 0 && (
                  <p className="text-sm text-muted-foreground">No actions required right now — all looks good!</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ViewReports;
