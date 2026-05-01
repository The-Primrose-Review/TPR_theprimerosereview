import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  CheckCircle,
  AlertCircle,
  School,
  BarChart3,
  Target,
  Send,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Loader2,
  User,
} from "lucide-react";
import { useApplications, type ApplicationWithProfile } from "@/hooks/useApplications";

// ── Helpers ───────────────────────────────────────────────────

const safeDivide = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

const getDeadlineStatus = (deadline: string) => {
  const daysUntil = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 7) return "urgent";
  if (daysUntil <= 30) return "upcoming";
  return "future";
};

const getDeadlineColor = (deadline: string) => {
  switch (getDeadlineStatus(deadline)) {
    case "overdue": return "text-destructive";
    case "urgent":  return "text-yellow-500";
    case "upcoming": return "text-foreground";
    default:        return "text-muted-foreground";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "submitted":  return "default";
    case "accepted":   return "default";   // consider a green variant if your theme has one
    case "in-progress": return "secondary";
    case "waitlisted": return "secondary";
    case "rejected":   return "destructive";
    case "not-started": return "outline";
    default:           return "outline";
  }
};



const getApplicationTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    "early-decision": "Early Decision",
    "early-action":   "Early Action",
    regular:          "Regular",
    ucas:             "UCAS",
    rolling:          "Rolling",
  };
  return labels[type] ?? type;
};

const getInitials = (name: string | null | undefined) =>
  name ? name.split(" ").map((n) => n[0]).join("") : "?";

const buildRecipients = (appsToSend: ApplicationWithProfile[]) => {
  const byStudent = new Map<string, { name: string; list: ApplicationWithProfile[] }>();
  for (const app of appsToSend) {
    const name = app.profiles?.full_name ?? "Student";
    if (!byStudent.has(app.student_id)) byStudent.set(app.student_id, { name, list: [] });
    byStudent.get(app.student_id)!.list.push(app);
  }
  return Array.from(byStudent.entries()).map(([studentId, { name, list }]) => ({
    studentId,
    studentName: name,
    applications: list.map((a) => ({
      schoolName: a.school_name,
      applicationType: a.application_type,
      deadlineDate: a.deadline_date,
      daysLeft: Math.ceil((new Date(a.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      completionPct: a.completion_percentage,
      completedEssays: a.completed_essays,
      requiredEssays: a.required_essays,
      recsSubmitted: a.recommendations_submitted,
      recsRequested: a.recommendations_requested,
    })),
  }));
};

// ── Component ─────────────────────────────────────────────────

const Applications = () => {
  const { applications, isLoading, error } = useApplications();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm]           = useState("");
  const [statusFilter, setStatusFilter]       = useState("all");
  const [sortBy, setSortBy]                   = useState("deadline");
  const [selectedIds, setSelectedIds]         = useState<string[]>([]);
  const [viewMode, setViewMode]               = useState<"student" | "school">("student");
  const [sendingReminders, setSendingReminders]     = useState(false);
  const [sendingReminderFor, setSendingReminderFor] = useState<string | null>(null);

  // ── Loading / Error states ────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 gap-3 text-destructive">
        <AlertCircle className="h-6 w-6" />
        <p>Failed to load applications. Please refresh and try again.</p>
      </div>
    );
  }

  // ── Filter + sort ─────────────────────────────────────────
  const filtered = applications
    .filter((app) => {
      const name = app.profiles?.full_name ?? "";
      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.program ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "deadline":    return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
        case "completion":  return b.completion_percentage - a.completion_percentage;
        case "school":      return a.school_name.localeCompare(b.school_name);
        default:            return 0;
      }
    });

  // ── Analytics ─────────────────────────────────────────────
  const totalApplications  = applications.length;
  const uniqueSchools      = new Set(applications.map((a) => a.school_name)).size;
  const urgentCount        = applications.filter(
    (a) => a.urgent || getDeadlineStatus(a.deadline_date) === "urgent"
  ).length;
  const avgCompletion = applications.length
    ? Math.round(applications.reduce((s, a) => s + a.completion_percentage, 0) / applications.length)
    : 0;

  const schoolStats = Array.from(new Set(applications.map((a) => a.school_name))).map((school) => {
    const schoolApps = applications.filter((a) => a.school_name === school);
    return {
      school,
      count: schoolApps.length,
      avgCompletion: Math.round(
        schoolApps.reduce((s, a) => s + a.completion_percentage, 0) / schoolApps.length
      ),
      urgent: schoolApps.filter((a) => a.urgent).length,
    };
  });

  // ── Selection helpers ─────────────────────────────────────
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSelectAll = () =>
    setSelectedIds(
      selectedIds.length === filtered.length ? [] : filtered.map((a) => a.id)
    );

  // ── Reminder helpers ──────────────────────────────────────
  const invokeReminders = async (appsToSend: ApplicationWithProfile[]) => {
    const recipients = buildRecipients(appsToSend);
    if (recipients.length === 0) {
      toast({ title: "Nothing to send", description: "No students match the reminder criteria." });
      return;
    }
    const { error: fnError } = await supabase.functions.invoke("send-application-reminder", {
      body: { recipients },
    });
    if (fnError) {
      toast({ title: "Failed to send reminders", description: fnError.message, variant: "destructive" });
    } else {
      toast({ title: "Reminders sent!", description: `Emails sent to ${recipients.length} student${recipients.length !== 1 ? "s" : ""}.` });
    }
  };

  const sendBulkReminders = async () => {
    setSendingReminders(true);
    // Smart filter: not yet submitted, and has an upcoming deadline (≤30 days) or is behind (<60%)
    const urgentApps = applications.filter((app) => {
      if (app.status === "submitted") return false;
      const status = getDeadlineStatus(app.deadline_date);
      return app.urgent || status === "urgent" || status === "upcoming" || app.completion_percentage < 60;
    });
    await invokeReminders(urgentApps);
    setSendingReminders(false);
  };

  const sendSelectedReminders = async () => {
    setSendingReminders(true);
    await invokeReminders(filtered.filter((app) => selectedIds.includes(app.id)));
    setSendingReminders(false);
  };

  const sendSingleReminder = async (app: ApplicationWithProfile) => {
    setSendingReminderFor(app.id);
    await invokeReminders([app]);
    setSendingReminderFor(null);
  };

  const handleExportPDF = () => {
  const doc = new jsPDF();

  const tableData = filtered.map((app) => [
    app.profiles?.full_name || "—",
    app.school_name,
    app.program || "-",
    app.application_type,
    app.deadline_date,
    `${app.completed_essays}/${app.required_essays}`,
    `${app.recommendations_submitted}/${app.recommendations_requested}`,
    app.status,
    `${app.completion_percentage}%`,
  ]);

  autoTable(doc, {
    head: [[
      "Student",
      "School",
      "Program",
      "Type",
      "Deadline",
      "Essays",
      "Recs",
      "Status",
      "Progress"
    ]],
    body: tableData,
  });

  doc.save("applications.pdf");
};

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Applications</h1>
          <p className="text-muted-foreground">Track and manage all student college applications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={sendBulkReminders} disabled={sendingReminders}>
            {sendingReminders
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <Send className="h-4 w-4 mr-2" />}
            Send Reminders
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", value: totalApplications, icon: FileText, color: "primary" },
          { label: "Schools",            value: uniqueSchools,      icon: School,   color: "secondary" },
          { label: "Urgent",             value: urgentCount,        icon: AlertTriangle, color: "yellow-500" },
          { label: "Avg Completion",     value: `${avgCompletion}%`, icon: TrendingUp, color: "primary" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${color}/10 rounded-lg`}>
                  <Icon className={`h-5 w-5 text-${color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "student" | "school")}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="student">Student View</TabsTrigger>
            <TabsTrigger value="school">School View</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[250px]"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="completion">Completion</SelectItem>
                <SelectItem value="school">School</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Student View ── */}
        <TabsContent value="student" className="space-y-4">
          {selectedIds.length > 0 && (
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium">{selectedIds.length} selected</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={sendSelectedReminders} disabled={sendingReminders}>
                    {sendingReminders
                      ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      : <Send className="h-4 w-4 mr-2" />}
                    Send Reminders
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.length === filtered.length && filtered.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>School / Program</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Essays</TableHead>
                      <TableHead>Recs</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((app) => (
                      <TableRow
                        key={app.id}
                        className={`hover:bg-muted/50 ${app.urgent ? "border-l-4 border-l-yellow-500" : ""}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(app.id)}
                            onCheckedChange={() => toggleSelect(app.id)}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={app.profiles?.avatar_url ?? undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(app.profiles?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-medium text-foreground">
                              {app.profiles?.full_name ?? "—"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className="font-medium text-foreground">{app.school_name}</p>
                          {app.program && (
                            <p className="text-sm text-muted-foreground">{app.program}</p>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">
                            {getApplicationTypeLabel(app.application_type)}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className={getDeadlineColor(app.deadline_date)}>
                            <p className="font-medium">{app.deadline_date}</p>
                            {app.urgent && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertCircle className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs text-yellow-500">Urgent</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {app.completed_essays}/{app.required_essays}
                            </span>
                            <Progress
                              value={safeDivide(app.completed_essays, app.required_essays)}
                              className="w-16 h-2"
                            />
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {app.recommendations_submitted}/{app.recommendations_requested}
                            </span>
                            <Progress
                              value={safeDivide(app.recommendations_submitted, app.recommendations_requested)}
                              className="w-16 h-2"
                            />
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={getStatusColor(app.status) as any}>
                            {app.status.replace("-", " ")}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={app.completion_percentage} className="w-16 h-2" />
                            <span className="text-sm font-medium">{app.completion_percentage}%</span>
                          </div>
                        </TableCell>

                        {/* <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={app.profiles?.avatar_url ?? undefined} />
                                    <AvatarFallback>
                                      {getInitials(app.profiles?.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h2 className="text-xl font-bold">{app.school_name}</h2>
                                    <p className="text-sm text-muted-foreground">
                                      {app.profiles?.full_name ?? "Student"} {app.program ? `— ${app.program}` : ""}
                                    </p>
                                  </div>
                                </DialogTitle>
                              </DialogHeader>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                      <Target className="h-5 w-5" />
                                      Overview
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-muted-foreground">Type</p>
                                        <p className="font-medium">{getApplicationTypeLabel(app.application_type)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Deadline</p>
                                        <p className={`font-medium ${getDeadlineColor(app.deadline_date)}`}>
                                          {app.deadline_date}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <Badge variant={getStatusColor(app.status) as any}>
                                          {app.status.replace("-", " ")}
                                        </Badge>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Progress</p>
                                        <p className="font-medium">{app.completion_percentage}%</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                      <BarChart3 className="h-5 w-5" />
                                      Requirements
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div>
                                      <div className="flex justify-between mb-2">
                                        <span className="text-sm">Essays</span>
                                        <span className="text-sm">{app.completed_essays}/{app.required_essays}</span>
                                      </div>
                                      <Progress value={safeDivide(app.completed_essays, app.required_essays)} className="h-2" />
                                    </div>
                                    <div>
                                      <div className="flex justify-between mb-2">
                                        <span className="text-sm">Recommendations</span>
                                        <span className="text-sm">{app.recommendations_submitted}/{app.recommendations_requested}</span>
                                      </div>
                                      <Progress value={safeDivide(app.recommendations_submitted, app.recommendations_requested)} className="h-2" />
                                    </div>
                                    {app.ai_score_avg !== null && app.ai_score_avg > 0 && (
                                      <div>
                                        <div className="flex justify-between mb-2">
                                          <span className="text-sm">Avg AI Score</span>
                                          <span className="text-sm">{app.ai_score_avg}/100</span>
                                        </div>
                                        <Progress value={app.ai_score_avg} className="h-2" />
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>

                              <div className="flex gap-2 pt-4 border-t border-border">
                                <Button className="flex-1">
                                  <User className="h-4 w-4 mr-2" />
                                  View Student Profile
                                </Button>
                                <Button variant="outline" className="flex-1">
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Essays
                                </Button>
                                <Button variant="outline">
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Reminder
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell> */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {app.completion_percentage === 100 && app.status !== 'submitted' && (
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ready
                              </Badge>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={app.profiles?.avatar_url ?? undefined} />
                                      <AvatarFallback>
                                        {getInitials(app.profiles?.full_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h2 className="text-xl font-bold">{app.school_name}</h2>
                                      <p className="text-sm text-muted-foreground">
                                        {app.profiles?.full_name ?? "Student"} {app.program ? `— ${app.program}` : ""}
                                      </p>
                                    </div>
                                  </DialogTitle>
                                </DialogHeader>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        Overview
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm text-muted-foreground">Type</p>
                                          <p className="font-medium">{getApplicationTypeLabel(app.application_type)}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Deadline</p>
                                          <p className={`font-medium ${getDeadlineColor(app.deadline_date)}`}>
                                            {app.deadline_date}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Status</p>
                                          <Badge variant={getStatusColor(app.status) as any}>
                                            {app.status.replace("-", " ")}
                                          </Badge>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Progress</p>
                                          <p className="font-medium">{app.completion_percentage}%</p>
                                        </div>
                                      </div>
                                      {app.completion_percentage === 100 && app.status !== 'submitted' && (
                                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                          <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <p className="text-sm font-medium text-green-600">
                                              Ready to submit!
                                            </p>
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            All essays and recommendations are complete.
                                          </p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Requirements
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div>
                                        <div className="flex justify-between mb-2">
                                          <span className="text-sm">Essays</span>
                                          <span className="text-sm">{app.completed_essays}/{app.required_essays}</span>
                                        </div>
                                        <Progress value={safeDivide(app.completed_essays, app.required_essays)} className="h-2" />
                                      </div>
                                      <div>
                                        <div className="flex justify-between mb-2">
                                          <span className="text-sm">Recommendations</span>
                                          <span className="text-sm">{app.recommendations_submitted}/{app.recommendations_requested}</span>
                                        </div>
                                        <Progress value={safeDivide(app.recommendations_submitted, app.recommendations_requested)} className="h-2" />
                                      </div>
                                      {app.ai_score_avg !== null && app.ai_score_avg > 0 && (
                                        <div>
                                          <div className="flex justify-between mb-2">
                                            <span className="text-sm">Avg AI Score</span>
                                            <span className="text-sm">{app.ai_score_avg}/100</span>
                                          </div>
                                          <Progress value={app.ai_score_avg} className="h-2" />
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-border">
                                  <Button className="flex-1">
                                    <User className="h-4 w-4 mr-2" />
                                    View Student Profile
                                  </Button>
                                  <Button variant="outline" className="flex-1">
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Essays
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => sendSingleReminder(app)}
                                    disabled={sendingReminderFor === app.id}
                                  >
                                    {sendingReminderFor === app.id
                                      ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      : <Send className="h-4 w-4 mr-2" />}
                                    Send Reminder
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── School View ── */}
        <TabsContent value="school" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                School Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schoolStats.map((stat) => (
                  <div
                    key={stat.school}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">{stat.school}</h3>
                      <p className="text-sm text-muted-foreground">{stat.count} application{stat.count !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Avg Completion</p>
                        <p className="font-semibold text-foreground">{stat.avgCompletion}%</p>
                      </div>
                      {stat.urgent > 0 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {stat.urgent} urgent
                        </Badge>
                      )}
                      <Progress value={stat.avgCompletion} className="w-24 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {filtered.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No applications found</h3>
            <p className="text-muted-foreground">
              {applications.length === 0
                ? "No applications have been added yet."
                : "Try adjusting your search or filters."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Applications;