import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAssignedStudents } from "@/hooks/useAssignedStudents";
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  FileText,
  GraduationCap,
  List,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  User,
  School,
  Loader2
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
interface StudentDeadline {
  studentId: string;
  studentName: string;
  progress: number;
  essayCount: number;
  essaysDone: number;
  recCount: number;
  recsDone: number;
}

interface Deadline {
  id: string;
  school: string;
  applicationType: string;
  date: Date;
  daysLeft: number;
  urgency: "overdue" | "critical" | "important" | "upcoming";
  students: StudentDeadline[];
}

// ─── Helpers ──────────────────────────────────────────────────
const computeUrgency = (daysLeft: number): Deadline["urgency"] => {
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 7) return "critical";
  if (daysLeft <= 21) return "important";
  return "upcoming";
};

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case "overdue":   return "bg-destructive text-destructive-foreground";
    case "critical":  return "bg-red-500 text-white";
    case "important": return "bg-yellow-500 text-white";
    case "upcoming":  return "bg-green-500 text-white";
    default:          return "bg-muted text-muted-foreground";
  }
};

const getUrgencyBorder = (urgency: string) => {
  switch (urgency) {
    case "overdue":   return "border-l-4 border-l-destructive";
    case "critical":  return "border-l-4 border-l-red-500";
    case "important": return "border-l-4 border-l-yellow-500";
    case "upcoming":  return "border-l-4 border-l-green-500";
    default:          return "border-l-4 border-l-muted";
  }
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });

// ─── Component ────────────────────────────────────────────────
const CheckDeadlines = () => {
  const [deadlines, setDeadlines]               = useState<Deadline[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [viewMode, setViewMode]                 = useState("list");
  const [selectedDate, setSelectedDate]         = useState(new Date());
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [urgencyFilter, setUrgencyFilter]       = useState("all");
  const [typeFilter, setTypeFilter]             = useState("all");
  const { toast } = useToast();

  const { data: studentIds = [], isLoading: loadingAssignments } =
  useAssignedStudents();

useEffect(() => {
  if (!loadingAssignments) {
    fetchDeadlines();
  }
}, [loadingAssignments, studentIds]);

  const fetchDeadlines = async () => {
  if (loadingAssignments) return;

  if (studentIds.length === 0) {
    setDeadlines([]);
    return;
  }

  setLoading(true);

  try {
    // Fetch applications, profiles, essays, recs in parallel
    const [appsRes, profilesRes, essaysRes, recsRes] = await Promise.all([
      supabase
        .from("applications")
        .select("*")
        .in("student_id", studentIds)
        .order("deadline_date", { ascending: true }),

      supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", studentIds),

      supabase
        .from("essay_feedback")
        .select("student_id, status")
        .in("student_id", studentIds),

      supabase
        .from("recommendation_requests")
        .select("student_id, status")
        .in("student_id", studentIds),
    ]);

    if (appsRes.error) throw appsRes.error;
    if (profilesRes.error) throw profilesRes.error;
    if (essaysRes.error) throw essaysRes.error;
    if (recsRes.error) throw recsRes.error;

    const apps = appsRes.data ?? [];
    const essays = essaysRes.data ?? [];
    const recs = recsRes.data ?? [];

    // ─────────────────────────────────────
    // Build lookup maps (performance fix)
    // ─────────────────────────────────────
    const profileMap = new Map(
      (profilesRes.data ?? []).map((p) => [
        p.user_id,
        p.full_name ?? "Unknown",
      ])
    );

    const essayMap = new Map<string, typeof essays>();
    essays.forEach((e) => {
      if (!essayMap.has(e.student_id)) essayMap.set(e.student_id, []);
      essayMap.get(e.student_id)!.push(e);
    });

    const recMap = new Map<string, typeof recs>();
    recs.forEach((r) => {
      if (!recMap.has(r.student_id)) recMap.set(r.student_id, []);
      recMap.get(r.student_id)!.push(r);
    });

    // ─────────────────────────────────────
    // Group by school + type + deadline
    // ─────────────────────────────────────
    const deadlineMap = new Map<string, Deadline>();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const app of apps) {
      const key = `${app.school_name}__${app.application_type}__${app.deadline_date}`;
      const date = new Date(app.deadline_date);

      const daysLeft = Math.round(
        (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const studentEssays = essayMap.get(app.student_id) ?? [];
      const studentRecs = recMap.get(app.student_id) ?? [];

      const essaysDone = studentEssays.filter(
        (e) => ["sent", "read", "approved"].includes(e.status)
      ).length;

      const recsDone = studentRecs.filter(
        (r) => r.status === "sent"
      ).length;

      const total = studentEssays.length + studentRecs.length;
      const done = essaysDone + recsDone;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;

      const studentEntry: StudentDeadline = {
        studentId: app.student_id,
        studentName: profileMap.get(app.student_id) ?? "Unknown",
        progress,
        essayCount: studentEssays.length,
        essaysDone,
        recCount: studentRecs.length,
        recsDone,
      };

      if (deadlineMap.has(key)) {
        deadlineMap.get(key)!.students.push(studentEntry);
      } else {
        deadlineMap.set(key, {
          id: app.id,
          school: app.school_name,
          applicationType: app.application_type,
          date,
          daysLeft,
          urgency: computeUrgency(daysLeft),
          students: [studentEntry],
        });
      }
    }
    setDeadlines(Array.from(deadlineMap.values()));
  } catch (error: any) {
    toast({
      title: "Failed to load deadlines",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  const filteredDeadlines = deadlines.filter((d) => {
    const matchesUrgency = urgencyFilter === "all" || d.urgency === urgencyFilter;
    const matchesType    = typeFilter === "all" || d.applicationType === typeFilter;
    return matchesUrgency && matchesType;
  });

  const atRiskStudents = deadlines
    .filter((d) => d.urgency === "critical" || d.urgency === "overdue")
    .flatMap((d) => d.students.filter((s) => s.progress < 70))
    .filter((s, i, arr) => arr.findIndex((x) => x.studentId === s.studentId) === i);

  // ─── Calendar helpers ──────────────────────────────────────
  const generateCalendarDays = () => {
    const year     = selectedDate.getFullYear();
    const month    = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const start    = new Date(firstDay);
    start.setDate(start.getDate() - firstDay.getDay());

    const days    = [];
    const current = new Date(start);

    for (let i = 0; i < 42; i++) {
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        deadlines: filteredDeadlines.filter(
          (d) => d.date.toDateString() === current.toDateString()
        ),
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Check Deadlines</h1>
          <p className="text-muted-foreground">Track application deadlines and student progress</p>
        </div>
        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList>
            <TabsTrigger value="month" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" /> Month
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" /> List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* At Risk Alert */}
      {atRiskStudents.length > 0 && (
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              At Risk Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 dark:text-red-300 mb-3">
              {atRiskStudents.length} student{atRiskStudents.length > 1 ? "s are" : " is"} not ready for upcoming critical deadlines:
            </p>
            <div className="flex flex-wrap gap-2">
              {atRiskStudents.map((student) => (
                <Badge key={student.studentId} variant="destructive" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {student.studentName} ({student.progress}%)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Application Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="early-decision">Early Decision</SelectItem>
                <SelectItem value="early-action">Early Action</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="ucas">UCAS</SelectItem>
                <SelectItem value="rolling">Rolling</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main View */}
        <div className="lg:col-span-3">
          <Tabs value={viewMode} onValueChange={setViewMode}>

            {/* Month View */}
            <TabsContent value="month">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                      Today
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                        {day}
                      </div>
                    ))}
                    {generateCalendarDays().map((day, index) => (
                      <div
                        key={index}
                        className={`min-h-20 p-1 border border-border ${!day.isCurrentMonth ? "bg-muted/30 text-muted-foreground" : ""}`}
                      >
                        <div className="text-sm font-medium mb-1">{day.date.getDate()}</div>
                        <div className="space-y-1">
                          {day.deadlines.slice(0, 2).map((deadline) => (
                            <div
                              key={deadline.id}
                              className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getUrgencyColor(deadline.urgency)}`}
                              onClick={() => setSelectedDeadline(deadline)}
                            >
                              {deadline.school}
                            </div>
                          ))}
                          {day.deadlines.length > 2 && (
                            <div className="text-xs text-muted-foreground">+{day.deadlines.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* List View */}
            <TabsContent value="list">
              {filteredDeadlines.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No deadlines found</h3>
                    <p className="text-sm text-muted-foreground">
                      Add applications for your students to track their deadlines here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredDeadlines.map((deadline) => (
                    <Card
                      key={deadline.id}
                      className={`${getUrgencyBorder(deadline.urgency)} hover:shadow-md transition-shadow cursor-pointer`}
                      onClick={() => setSelectedDeadline(deadline)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{deadline.school}</h3>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <School className="h-4 w-4" />
                              {deadline.applicationType}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <CalendarIcon className="h-3 w-3" />
                              {formatDate(deadline.date)}
                            </p>
                          </div>
                          <Badge className={getUrgencyColor(deadline.urgency)}>
                            {deadline.daysLeft > 0
                              ? `${deadline.daysLeft} days left`
                              : `${Math.abs(deadline.daysLeft)} days overdue`}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2">Students ({deadline.students.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {deadline.students.map((student) => (
                              <div
                                key={student.studentId}
                                className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {student.studentName.split(" ").map((n) => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{student.studentName}</span>
                                <span className={`text-xs font-medium ${
                                  student.progress < 50 ? "text-red-600" :
                                  student.progress < 80 ? "text-yellow-600" : "text-green-600"
                                }`}>
                                  {student.progress}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No deadlines yet</p>
              ) : (
                <div className="space-y-3">
                  {filteredDeadlines
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .slice(0, 8)
                    .map((deadline) => (
                      <div
                        key={deadline.id}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${getUrgencyBorder(deadline.urgency)}`}
                        onClick={() => setSelectedDeadline(deadline)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">{deadline.school}</h4>
                          <Badge variant="outline" className={`text-xs ${getUrgencyColor(deadline.urgency)}`}>
                            {deadline.daysLeft > 0 ? `${deadline.daysLeft}d` : "Overdue"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{deadline.applicationType}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(deadline.date)}</p>
                        <div className="flex items-center gap-1 mt-2">
                          {deadline.students.slice(0, 3).map((student) => (
                            <Avatar key={student.studentId} className="h-5 w-5">
                              <AvatarFallback className="text-xs">{student.studentName[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                          {deadline.students.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{deadline.students.length - 3}</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deadline Detail Modal */}
      {selectedDeadline && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedDeadline.school}</CardTitle>
                  <p className="text-muted-foreground">{selectedDeadline.applicationType}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <CalendarIcon className="h-4 w-4" />
                    {formatDate(selectedDeadline.date)}
                    <Badge className={getUrgencyColor(selectedDeadline.urgency)}>
                      {selectedDeadline.daysLeft > 0
                        ? `${selectedDeadline.daysLeft} days left`
                        : `${Math.abs(selectedDeadline.daysLeft)} days overdue`}
                    </Badge>
                  </p>
                </div>
                <Button variant="outline" onClick={() => setSelectedDeadline(null)}>Close</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedDeadline.students.map((student) => (
                  <Card key={student.studentId}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {student.studentName.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{student.studentName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">Progress:</span>
                            <Progress value={student.progress} className="w-24 h-2" />
                            <span className="text-sm font-medium">{student.progress}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4" /> Essays
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {student.essaysDone} of {student.essayCount} completed
                          </p>
                          <Progress
                            value={student.essayCount > 0 ? (student.essaysDone / student.essayCount) * 100 : 0}
                            className="h-2 mt-1"
                          />
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2 mb-2">
                            <GraduationCap className="h-4 w-4" /> Recommendations
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {student.recsDone} of {student.recCount} received
                          </p>
                          <Progress
                            value={student.recCount > 0 ? (student.recsDone / student.recCount) * 100 : 0}
                            className="h-2 mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CheckDeadlines;