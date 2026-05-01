import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Filter,
  Bell,
  BellOff,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  Calendar,
  User,
  School,
  Send,
  Eye,
  EyeOff,
  Trash2,
  TrendingUp,
  Archive,
  MoreHorizontal,
  Pause,
} from "lucide-react";

type AppNotification = {
  id: string;
  type: 'essay' | 'application' | 'recommendation' | 'task' | 'message' | 'deadline';
  priority: 'critical' | 'important' | 'informational';
  title: string;
  description: string;
  studentName: string;
  studentId: string;
  studentAvatar?: string;
  timestamp: string;
  read: boolean;
  actionable: boolean;
  linkedPage?: string;
  snoozed?: boolean;
  snoozeUntil?: string;
};

const Notifications = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");
  const [showRead, setShowRead] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // ─────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────
  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return ts;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${Math.round(diffHours)} hour${Math.round(diffHours) !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${Math.round(diffDays)} day${Math.round(diffDays) !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  // ─────────────────────────────────────────
  // Load & Derive Notifications
  // ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const userId = userData.user.id;

      // Get assigned student IDs
      const { data: assignments } = await supabase
        .from("student_counselor_assignments")
        .select("student_id")
        .eq("counselor_id", userId);

      const studentIds = assignments?.map((a) => a.student_id) ?? [];
      if (studentIds.length === 0) return;

      // Load profiles
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", studentIds);

      const profileMap: Record<string, any> = {};
      profileData?.forEach((p) => (profileMap[p.user_id] = p));

      const derived: AppNotification[] = [];

      // ── Applications: urgent flags + upcoming deadlines ──
      const { data: apps } = await supabase
        .from("applications")
        .select("*")
        .in("student_id", studentIds);

      apps?.forEach((app) => {
        const student = profileMap[app.student_id];
        const studentName = student?.full_name ?? "Unknown Student";
        const deadline = new Date(app.deadline_date);
        const now = new Date();
        const daysUntil = Math.ceil(
          (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (app.urgent || daysUntil <= 1) {
          derived.push({
            id: `app-${app.id}`,
            type: "deadline",
            priority: "critical",
            title:
              daysUntil <= 0
                ? "Application Deadline Overdue"
                : "Application Deadline Tomorrow",
            description: `${app.school_name} — ${app.completed_essays}/${app.required_essays} essays complete`,
            studentName,
            studentId: app.student_id,
            studentAvatar: student?.avatar_url,
            timestamp: app.deadline_date,
            read: false,
            actionable: true,
            linkedPage: "/applications",
          });
        } else if (daysUntil <= 7) {
          derived.push({
            id: `app-${app.id}`,
            type: "deadline",
            priority: "important",
            title: `Application Due in ${daysUntil} Days`,
            description: `${app.school_name} — ${app.completed_essays}/${app.required_essays} essays complete`,
            studentName,
            studentId: app.student_id,
            studentAvatar: student?.avatar_url,
            timestamp: app.deadline_date,
            read: false,
            actionable: true,
            linkedPage: "/applications",
          });
        }
      });

      // ── Essay feedback: drafts ready to send ──
      const { data: essays } = await supabase
        .from("essay_feedback")
        .select("*")
        .eq("counselor_id", userId)
        .in("student_id", studentIds);

      essays?.forEach((essay) => {
        if (essay.status !== "pending") return;
        const student = profileMap[essay.student_id];
        const studentName = student?.full_name ?? "Unknown Student";
        derived.push({
          id: `essay-${essay.id}`,
          type: "essay",
          priority: "important",
          title: "New Essay Submitted",
          description: `${essay.essay_title} — submitted for your review`,
          studentName,
          studentId: essay.student_id,
          studentAvatar: student?.avatar_url,
          timestamp: essay.updated_at ?? essay.created_at,
          read: false,
          actionable: true,
          linkedPage: "/essays",
        });
      });

      // ── Recommendation requests: pending / in_progress ──
      const { data: recs } = await supabase
        .from("recommendation_requests")
        .select("*")
        .in("student_id", studentIds)
        .in("status", ["pending", "in_progress"]);

      recs?.forEach((rec) => {
        const student = profileMap[rec.student_id];
        const studentName = student?.full_name ?? "Unknown Student";
        derived.push({
          id: `rec-${rec.id}`,
          type: "recommendation",
          priority: rec.status === "pending" ? "important" : "informational",
          title:
            rec.status === "pending"
              ? "Recommendation Letter Pending"
              : "Recommendation In Progress",
          description: `${rec.referee_name} — letter ${
            rec.status === "pending" ? "not yet started" : "in progress"
          }`,
          studentName,
          studentId: rec.student_id,
          studentAvatar: student?.avatar_url,
          timestamp: rec.updated_at ?? rec.created_at,
          read: rec.status === "in_progress",
          actionable: true,
          linkedPage: "/recommendation-letters",
        });
      });

      // ── Tasks: incomplete ──
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .in("student_id", studentIds)
        .eq("completed", false);

      tasks?.forEach((task) => {
        const student = profileMap[task.student_id];
        const studentName = student?.full_name ?? "Unknown Student";
        const isOverdue =
          task.due_date && new Date(task.due_date) < new Date();
        derived.push({
          id: `task-${task.id}`,
          type: "task",
          priority: isOverdue ? "important" : "informational",
          title: isOverdue ? "Overdue Task" : "Pending Task",
          description: task.task,
          studentName,
          studentId: task.student_id,
          studentAvatar: student?.avatar_url,
          timestamp: task.due_date ?? task.created_at,
          read: !isOverdue,
          actionable: true,
        });
      });

      // ── Messages: unread ──
      const { data: convos } = await supabase
        .from("conversations")
        .select("*")
        .eq("counselor_id", userId);

      const convoIds = convos?.map((c) => c.id) ?? [];
      if (convoIds.length > 0) {
        const { data: unreadMsgs } = await supabase
          .from("messages")
          .select("*")
          .in("conversation_id", convoIds)
          .eq("read", false)
          .neq("sender_id", userId);

        unreadMsgs?.forEach((msg) => {
          const convo = convos?.find((c) => c.id === msg.conversation_id);
          if (!convo) return;
          const student = profileMap[convo.student_id];
          const studentName = student?.full_name ?? "Unknown Student";
          derived.push({
            id: `msg-${msg.id}`,
            type: "message",
            priority:
              convo.status === "urgent" ? "important" : "informational",
            title: "New Unread Message",
            description:
              msg.content.length > 80
                ? msg.content.substring(0, 80) + "..."
                : msg.content,
            studentName,
            studentId: convo.student_id,
            studentAvatar: student?.avatar_url,
            timestamp: msg.created_at,
            read: false,
            actionable: true,
            linkedPage: "/messages",
          });
        });
      }

      // Sort newest first
      derived.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setNotifications(derived);
    };

    load();
  }, []);

  // ─────────────────────────────────────────
  // Daily Digest (derived)
  // ─────────────────────────────────────────
  const dailyDigest = useMemo(() => {
    const active = notifications.filter((n) => !n.snoozed);
    const critical = active.filter((n) => n.priority === "critical");
    const essayDrafts = active.filter((n) => n.type === "essay");
    const pendingRecs = active.filter((n) => n.type === "recommendation");
    const importantCount = active.filter((n) => n.priority === "important").length;

    const priorities: {
      type: string;
      title: string;
      description: string;
      action: string;
    }[] = [];

    if (critical.length > 0) {
      priorities.push({
        type: "critical",
        title: `${critical.length} Critical Deadline${critical.length > 1 ? "s" : ""}`,
        description: critical[0].description,
        action: "Contact students immediately",
      });
    }
    if (essayDrafts.length > 0) {
      priorities.push({
        type: "important",
        title: `${essayDrafts.length} Essay Draft${essayDrafts.length > 1 ? "s" : ""} Awaiting Review`,
        description: `${essayDrafts[0].studentName}${
          essayDrafts.length > 1
            ? ` and ${essayDrafts.length - 1} other${essayDrafts.length > 2 ? "s" : ""}`
            : ""
        } submitted drafts`,
        action: "Schedule review session",
      });
    }
    if (pendingRecs.length > 0) {
      priorities.push({
        type: "important",
        title: `${pendingRecs.length} Pending Recommendation${pendingRecs.length > 1 ? "s" : ""}`,
        description: "Follow up with teachers for pending letters",
        action: "Send reminder emails",
      });
    }

    return {
      summary:
        critical.length > 0
          ? `You have ${critical.length} critical item${critical.length > 1 ? "s" : ""} requiring immediate attention today`
          : importantCount > 0
          ? `You have ${importantCount} important item${importantCount > 1 ? "s" : ""} requiring attention`
          : "All caught up! No urgent items today.",
      priorities: priorities.slice(0, 3),
    };
  }, [notifications]);

  // ─────────────────────────────────────────
  // UI Helpers
  // ─────────────────────────────────────────
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "important": return "warning";
      case "informational": return "secondary";
      default: return "outline";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical": return AlertTriangle;
      case "important": return AlertCircle;
      case "informational": return Bell;
      default: return Bell;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "essay": return FileText;
      case "application": return School;
      case "recommendation": return User;
      case "task": return CheckCircle;
      case "message": return MessageSquare;
      case "deadline": return Calendar;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "essay": return "bg-blue-100 text-blue-700";
      case "application": return "bg-green-100 text-green-700";
      case "recommendation": return "bg-purple-100 text-purple-700";
      case "task": return "bg-orange-100 text-orange-700";
      case "message": return "bg-cyan-100 text-cyan-700";
      case "deadline": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // ─────────────────────────────────────────
  // Filtering
  // ─────────────────────────────────────────
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.studentName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    const matchesPriority =
      priorityFilter === "all" || notification.priority === priorityFilter;
    const matchesStudent =
      studentFilter === "all" || notification.studentName === studentFilter;
    const matchesRead = showRead || !notification.read;

    return (
      matchesSearch &&
      matchesType &&
      matchesPriority &&
      matchesStudent &&
      matchesRead &&
      !notification.snoozed
    );
  });

  // ─────────────────────────────────────────
  // Actions (client-side state mutations)
  // ─────────────────────────────────────────
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const snoozeNotification = (id: string, hours: number = 24) => {
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + hours);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, snoozed: true, snoozeUntil: snoozeUntil.toISOString() }
          : n
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // ─────────────────────────────────────────
  // Derived counts
  // ─────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.read && !n.snoozed).length;
  const criticalCount = notifications.filter(
    (n) => n.priority === "critical" && !n.read && !n.snoozed
  ).length;
  const snoozedCount = notifications.filter((n) => n.snoozed).length;

  const uniqueStudents = Array.from(
    new Set(notifications.map((n) => n.studentName))
  );

  // ─────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on all student progress and deadlines
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm">
            <Archive className="h-4 w-4 mr-2" />
            Archive Old
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Notifications</p>
                <p className="text-2xl font-bold text-foreground">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <BellOff className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-foreground">{criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Clock className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Snoozed</p>
                <p className="text-2xl font-bold text-foreground">{snoozedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Digest */}
      <Card className="border-primary/20 bg-gradient-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Daily Digest
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground font-medium">{dailyDigest.summary}</p>

          {dailyDigest.priorities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dailyDigest.priorities.map((priority, index) => (
                <Card key={index} className="bg-background/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Badge
                        variant={priority.type === "critical" ? "destructive" : "secondary"}
                        className="mt-1"
                      >
                        {priority.type}
                      </Badge>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{priority.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {priority.description}
                        </p>
                        <p className="text-xs font-medium text-primary mt-2">
                          {priority.action}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="essay">Essays</SelectItem>
                  <SelectItem value="application">Applications</SelectItem>
                  <SelectItem value="recommendation">Recommendations</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                  <SelectItem value="deadline">Deadlines</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="informational">Informational</SelectItem>
                </SelectContent>
              </Select>

              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {uniqueStudents.map((student) => (
                    <SelectItem key={student} value={student}>
                      {student}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={showRead ? "default" : "outline"}
                size="sm"
                onClick={() => setShowRead(!showRead)}
              >
                {showRead ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Timeline */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No notifications found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or check back later
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const TypeIcon = getTypeIcon(notification.type);
            const PriorityIcon = getPriorityIcon(notification.priority);

            return (
              <Card
                key={notification.id}
                className={`transition-all duration-200 hover:shadow-md ${
                  !notification.read ? "border-l-4 border-l-primary bg-primary/5" : ""
                } ${
                  notification.priority === "critical" ? "border-destructive/50" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Priority & Type Indicator */}
                    <div className="flex flex-col items-center gap-2">
                      <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <Badge
                        variant={getPriorityColor(notification.priority) as any}
                        className="text-xs"
                      >
                        <PriorityIcon className="h-3 w-3 mr-1" />
                        {notification.priority}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`font-semibold ${
                                !notification.read
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.description}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage
                                  src={notification.studentAvatar}
                                  alt={notification.studentName}
                                />
                                <AvatarFallback className="text-xs">
                                  {notification.studentName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span>{notification.studentName}</span>
                            </div>
                            <span>•</span>
                            <span>{formatTimestamp(notification.timestamp)}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {notification.type}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-4">
                          {notification.actionable && (
                            <>
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>

                              {notification.type === "essay" && (
                                <Button variant="outline" size="sm">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Review
                                </Button>
                              )}

                              {notification.type === "message" && (
                                <Button variant="outline" size="sm">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Reply
                                </Button>
                              )}

                              {(notification.type === "deadline" ||
                                notification.type === "recommendation") && (
                                <Button variant="outline" size="sm">
                                  <Send className="h-3 w-3 mr-1" />
                                  Remind
                                </Button>
                              )}
                            </>
                          )}

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader>
                                <DialogTitle>Notification Actions</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-2">
                                {!notification.read && (
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Read
                                  </Button>
                                )}

                                <Button
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => snoozeNotification(notification.id, 24)}
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  Snooze for 24h
                                </Button>

                                <Button
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => snoozeNotification(notification.id, 168)}
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Snooze for 1 week
                                </Button>

                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-destructive hover:text-destructive"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
