import { useState, useEffect, useMemo } from "react";
import { useAtRiskCriteria, AtRiskCriteria } from "@/hooks/useAtRiskCriteria";
import { computeCompletion, classifyRisk } from "@/lib/atRiskUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  GraduationCap,
  FileText,
  Calendar,
  MessageSquare,
  BarChart3,
  Target,
  Trophy,
  LayoutGrid,
  List,
  Loader2,
  Send
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────────────
interface Student {
  id: string
  name: string
  email: string | null
  avatar_url: string | null
  school_name: string | null
  gpa: number | null
  sat_score: number | null
  act_score: number | null
  graduation_year: number | null
  // computed
  completionPercentage: number
  status: 'on-track' | 'needs-attention' | 'at-risk'
  lastActivity: string
  // related data
  essaysSubmitted: number
  totalEssays: number
  recommendationsSubmitted: number
  recommendationsRequested: number
  upcomingDeadlines: number
  hasNearDeadline: boolean
  targetSchools: string[]
  extracurriculars: string[]
  tasks: { id: string; task: string; due_date: string | null; completed: boolean }[]
  meetingNotes: { id: string; meeting_date: string; summary: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────
const computeStatus = (completion: number, criteria: AtRiskCriteria, hasNearDeadline: boolean): Student['status'] =>
  classifyRisk(completion, hasNearDeadline, criteria);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'on-track': return 'default'
    case 'needs-attention': return 'secondary'
    case 'at-risk': return 'destructive'
    default: return 'outline'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'on-track': return CheckCircle
    case 'needs-attention': return Clock
    case 'at-risk': return AlertTriangle
    default: return User
  }
}

const getRiskReasons = (student: Student, criteria: AtRiskCriteria): string[] => {
  const reasons: string[] = []
  if (student.hasNearDeadline)
    reasons.push('Deadline within the next 30 days')
  if (criteria.triggerNoEssays && student.essaysSubmitted === 0 && student.totalEssays > 0)
    reasons.push(`No essays submitted (0/${student.totalEssays})`)
  if (criteria.triggerLowCompletion && student.completionPercentage < criteria.atRiskThreshold)
    reasons.push(`Completion critically low (${student.completionPercentage}%)`)
  if (criteria.triggerNoRecs && student.recommendationsSubmitted === 0 && student.recommendationsRequested > 0)
    reasons.push('No recommendation letters received')
  if (reasons.length === 0)
    reasons.push('Overall progress requires attention')
  return reasons
}

const AtRiskBadge = ({ student, criteria }: { student: Student; criteria: AtRiskCriteria }) => {
  const StatusIcon = getStatusIcon(student.status)
  const reasons = student.status === 'at-risk' ? getRiskReasons(student, criteria) : []

  return (
    <div className="relative inline-block group/risk">
      <Badge variant={getStatusColor(student.status) as any} className="flex items-center gap-1 w-fit cursor-default">
        <StatusIcon className="h-3 w-3" />
        {student.status.replace('-', ' ')}
      </Badge>
      {student.status === 'at-risk' && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[9999]
                        hidden group-hover/risk:block
                        w-56 bg-destructive text-destructive-foreground
                        text-xs rounded-xl shadow-lg px-3 py-2.5 space-y-1.5
                        pointer-events-none">
          {/* Arrow pointing up */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2
                          border-4 border-transparent border-b-destructive" />
          <p className="font-semibold mb-1">Why at risk:</p>
          {reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">•</span>
              <span className="leading-snug">{r}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const Students = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [gpaFilter, setGpaFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const { toast } = useToast()
  const { criteria } = useAtRiskCriteria()

  useEffect(() => {
    fetchStudents()
  }, [])

  // Recompute completion + status live whenever criteria changes
  const displayStudents = useMemo(() =>
    students.map(s => {
      const completionPercentage = computeCompletion(
        s.essaysSubmitted, s.totalEssays,
        s.recommendationsSubmitted, s.recommendationsRequested,
        criteria
      )
      return { ...s, completionPercentage, status: computeStatus(completionPercentage, criteria, s.hasNearDeadline) }
    }),
    [students, criteria]
  )

  const fetchStudents = async () => {
    setLoading(true)
    try {
      // Get logged-in counselor
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // Get all students assigned to this counselor
      // const { data: studentRoles, error: rolesError } = await supabase
      //   .from('user_roles')
      //   .select('user_id')
      //   .eq('role', 'student')

      // if (rolesError) throw rolesError
      // if (!studentRoles.length) { setStudents([]); return }

      // const studentIds = studentRoles.map(s => s.user_id)

      // Get students assigned to this counselor
      const { data: assignments, error: assignmentError } = await supabase
        .from('student_counselor_assignments')
        .select('student_id')
        .eq('counselor_id', user.id)

      if (assignmentError) throw assignmentError
      if (!assignments || assignments.length === 0) {
        setStudents([])
        return
      }

      const studentIds = assignments.map(a => a.student_id)

      // Fetch profiles + school for all students
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url, schools(name)')
        .in('user_id', studentIds)

      if (profileError) throw profileError

      // Fetch student_profiles (gpa, scores etc)
      const { data: studentProfiles, error: spError } = await supabase
        .from('student_profiles')
        .select('user_id, gpa, sat_score, act_score, graduation_year')
        .in('user_id', studentIds)

      if (spError) throw spError

      // Fetch essays
      const { data: essays, error: essayError } = await supabase
        .from('essay_feedback')
        .select('student_id, status')
        .in('student_id', studentIds)

      if (essayError) throw essayError

      // Fetch recommendations
      const { data: recs, error: recError } = await supabase
        .from('recommendation_requests')
        .select('student_id, status')
        .in('student_id', studentIds)

      if (recError) throw recError

      // Fetch target schools
      const { data: targetSchools, error: tsError } = await supabase
        .from('target_schools')
        .select('student_id, school_name')
        .in('student_id', studentIds)

      if (tsError) throw tsError

      // Fetch extracurriculars
      const { data: extracurriculars, error: ecError } = await supabase
        .from('extracurriculars')
        .select('student_id, activity')
        .in('student_id', studentIds)

      if (ecError) throw ecError

      // Fetch tasks
      const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('id, student_id, task, due_date, completed')
        .in('student_id', studentIds)

      if (taskError) throw taskError

      // Fetch meeting notes
      const { data: meetingNotes, error: mnError } = await supabase
        .from('meeting_notes')
        .select('id, student_id, meeting_date, summary')
        .in('student_id', studentIds)
        .order('meeting_date', { ascending: false })

      if (mnError) throw mnError

      // ── Assemble students ────────────────────────────────────
      const assembled: Student[] = studentIds.map(studentId => {
        const profile = profiles.find(p => p.user_id === studentId)
        const sp = studentProfiles.find(s => s.user_id === studentId)

        const studentEssays = essays.filter(e => e.student_id === studentId)
        const totalEssays = studentEssays.length
        const essaysSubmitted = studentEssays.filter(e => e.status === 'sent').length

        const studentRecs = recs.filter(r => r.student_id === studentId)
        const recommendationsRequested = studentRecs.length
        const recommendationsSubmitted = studentRecs.filter(r => r.status === 'sent').length

        const completion = computeCompletion(essaysSubmitted, totalEssays, recommendationsSubmitted, recommendationsRequested, criteria)

        // upcoming deadlines = incomplete tasks with a due date in the future
        const studentTasks = tasks.filter(t => t.student_id === studentId)
        const now = new Date()
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        const upcomingDeadlines = studentTasks.filter(t =>
          !t.completed && t.due_date && new Date(t.due_date) > now
        ).length
        const hasNearDeadline = studentTasks.some(t =>
          !t.completed && t.due_date &&
          new Date(t.due_date) >= now && new Date(t.due_date) <= thirtyDaysFromNow
        )

        return {
          id: studentId,
          name: profile?.full_name || 'Unknown',
          email: profile?.email || null,
          avatar_url: profile?.avatar_url || null,
          school_name: (profile?.schools as any)?.name || null,
          gpa: sp?.gpa || null,
          sat_score: sp?.sat_score || null,
          act_score: sp?.act_score || null,
          graduation_year: sp?.graduation_year || null,
          completionPercentage: completion,
          status: computeStatus(completion, criteria, hasNearDeadline),
          lastActivity: 'recently',
          essaysSubmitted,
          totalEssays,
          recommendationsSubmitted,
          recommendationsRequested,
          upcomingDeadlines,
          hasNearDeadline,
          targetSchools: targetSchools.filter(ts => ts.student_id === studentId).map(ts => ts.school_name),
          extracurriculars: extracurriculars.filter(ec => ec.student_id === studentId).map(ec => ec.activity),
          tasks: studentTasks.map(t => ({ id: t.id, task: t.task, due_date: t.due_date, completed: t.completed })),
          meetingNotes: meetingNotes.filter(mn => mn.student_id === studentId).map(mn => ({
            id: mn.id, meeting_date: mn.meeting_date, summary: mn.summary
          })),
        }
      })

      setStudents(assembled)
    } catch (error: any) {
      toast({ title: 'Failed to load students', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }


  const filteredStudents = displayStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter
    const matchesGPA = gpaFilter === 'all' ||
      (gpaFilter === 'high' && (student.gpa ?? 0) >= 3.7) ||
      (gpaFilter === 'medium' && (student.gpa ?? 0) >= 3.0 && (student.gpa ?? 0) < 3.7) ||
      (gpaFilter === 'low' && (student.gpa ?? 0) < 3.0)
    return matchesSearch && matchesStatus && matchesGPA
  })

  const handleExportStudentsPDF = () => {
  const doc = new jsPDF();

  const tableData = filteredStudents.map((student) => [
    student.name,
    student.email || "-",
    student.school_name || "-",
    student.gpa ?? "-",
    student.sat_score ? `SAT: ${student.sat_score}` :
    student.act_score ? `ACT: ${student.act_score}` : "-",
    `${student.essaysSubmitted}/${student.totalEssays}`,
    `${student.recommendationsSubmitted}/${student.recommendationsRequested}`,
    student.upcomingDeadlines,
    `${student.completionPercentage}%`,
    student.status,
  ]);

  autoTable(doc, {
    head: [[
      "Name",
      "Email",
      "School",
      "GPA",
      "Test Score",
      "Essays",
      "Recs",
      "Deadlines",
      "Progress",
      "Status"
    ]],
    body: tableData,
  });

  doc.save("students_report.pdf");
};

  // ─── Student Detail Dialog (shared between list + grid) ──────
  const StudentDialog = ({ student }: { student: Student }) => {
    const StatusIcon = getStatusIcon(student.status)
    const [isSendingAlert, setIsSendingAlert] = useState(false)

    const handleSendAtRiskAlert = async () => {
      setIsSendingAlert(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const [{ data: counselorProfile }, { data: parentProfile }] = await Promise.all([
          supabase.from('profiles').select('full_name, email').eq('user_id', user.id).maybeSingle(),
          supabase.from('student_profiles').select('parent_name, parent_email').eq('user_id', student.id).maybeSingle(),
        ])

        // Build risk reasons from real student data
        const reasons: string[] = []
        if (student.essaysSubmitted === 0 && student.totalEssays > 0) {
          reasons.push(`No essays submitted yet (0 of ${student.totalEssays})`)
        }
        if (student.completionPercentage < criteria.atRiskThreshold) {
          reasons.push(`Application completion is critically low (${student.completionPercentage}%)`)
        }
        if (student.upcomingDeadlines >= 3) {
          reasons.push(`${student.upcomingDeadlines} upcoming deadlines require action`)
        }
        if (student.recommendationsSubmitted === 0 && student.recommendationsRequested > 0) {
          reasons.push('No recommendation letters received yet')
        }
        if (reasons.length === 0) reasons.push('Student progress requires your attention')

        const { data: { session } } = await supabase.auth.getSession();
        console.log('[send-at-risk-alert] Calling edge function', {
          studentEmail: student.email,
          studentName: student.name,
          parentEmail: parentProfile?.parent_email,
          counselorEmail: counselorProfile?.email,
          riskReasons: reasons,
        });
        const res = await fetch(
          "https://fkvfngdwblbalrompzdj.supabase.co/functions/v1/send-at-risk",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              studentEmail: student.email,
              studentName: student.name,
              parentEmail: parentProfile?.parent_email || null,
              parentName: parentProfile?.parent_name || null,
              counselorEmail: counselorProfile?.email || null,
              counselorName: counselorProfile?.full_name || 'Your counselor',
              riskReasons: reasons,
              appUrl: window.location.origin,
            }),
          }
        );
        console.log('[send-at-risk-alert] Done', res.status);
        toast({ title: 'At-Risk Alert Sent', description: `Alert sent to ${student.name} and their parent.` })
      } catch (error: any) {
        toast({ title: 'Failed to send alert', description: error.message, variant: 'destructive' })
      } finally {
        setIsSendingAlert(false)
      }
    }

    return (
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.avatar_url ?? undefined} alt={student.name} />
              <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{student.name}</h2>
              <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                {student.email && <span>{student.email}</span>}
                {student.school_name && <span>· {student.school_name}</span>}
                {student.graduation_year && <span>· Class of {student.graduation_year}</span>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getStatusColor(student.status) as any}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {student.status.replace('-', ' ')}
                </Badge>
                {student.status === 'at-risk' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleSendAtRiskAlert}
                    disabled={isSendingAlert}
                  >
                    {isSendingAlert
                      ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      : <Send className="h-3 w-3 mr-1" />}
                    Send Alert
                  </Button>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="essays">Essays</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            {/* <TabsTrigger value="meetings">Meetings</TabsTrigger> */}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Academic Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GPA</span>
                    <span className="font-semibold">{student.gpa ?? '—'}</span>
                  </div>
                  {student.sat_score && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SAT Score</span>
                      <span className="font-semibold">{student.sat_score}</span>
                    </div>
                  )}
                  {student.act_score && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ACT Score</span>
                      <span className="font-semibold">{student.act_score}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Target Schools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {student.targetSchools.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {student.targetSchools.map((school, i) => (
                        <Badge key={i} variant="outline">{school}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No target schools added yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Extracurriculars
                </CardTitle>
              </CardHeader>
              <CardContent>
                {student.extracurriculars.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {student.extracurriculars.map((activity, i) => (
                      <Badge key={i} variant="secondary">{activity}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No extracurriculars added yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Overall Progress</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Completion</span>
                    <span className="font-semibold">{student.completionPercentage}%</span>
                  </div>
                  <Progress value={student.completionPercentage} className="h-3" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Essays
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold">{student.essaysSubmitted}/{student.totalEssays}</div>
                  <div className="text-sm text-muted-foreground">Submitted</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" /> Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold">{student.recommendationsSubmitted}/{student.recommendationsRequested}</div>
                  <div className="text-sm text-muted-foreground">Received</div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-warning" /> Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center p-4">
                <div className="text-3xl font-bold text-warning">{student.upcomingDeadlines}</div>
                <div className="text-sm text-muted-foreground">Tasks due in the future</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="essays" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Essay Status</CardTitle></CardHeader>
              <CardContent>
                {student.totalEssays > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {student.essaysSubmitted} of {student.totalEssays} essays completed
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No essays on file yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Active Tasks</CardTitle></CardHeader>
              <CardContent>
                {student.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {student.tasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <div className="font-medium">{task.task}</div>
                          {task.due_date && (
                            <div className="text-sm text-muted-foreground">Due: {task.due_date}</div>
                          )}
                        </div>
                        <Badge variant={task.completed ? 'default' : 'outline'}>
                          {task.completed ? 'Completed' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tasks assigned yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* <TabsContent value="meetings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Meeting History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {student.meetingNotes.length > 0 ? (
                  <div className="space-y-3">
                    {student.meetingNotes.map(note => (
                      <div key={note.id} className="p-4 border border-border rounded-lg">
                        <div className="font-medium mb-2">{note.meeting_date}</div>
                        <div className="text-sm text-muted-foreground">{note.summary}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No meeting notes yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent> */}
        </Tabs>

        <div className="flex gap-2 pt-4 border-t border-border">
          {/* <Button className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Meeting Note
          </Button> */}
          <Button variant="outline" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </DialogContent>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">
            {students.length} student{students.length !== 1 ? 's' : ''} on your roster
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportStudentsPDF}>
          <Download className="h-4 w-4 mr-2" />
          Export Reports
        </Button>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search students by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="on-track">On Track</SelectItem>
                  <SelectItem value="needs-attention">Needs Attention</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                </SelectContent>
              </Select>
              <Select value={gpaFilter} onValueChange={setGpaFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="GPA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All GPA</SelectItem>
                  <SelectItem value="high">3.7+ High</SelectItem>
                  <SelectItem value="medium">3.0-3.7</SelectItem>
                  <SelectItem value="low">Below 3.0</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExportStudentsPDF}>
                <Filter className="h-4 w-4" />
              </Button>
              <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'list' | 'grid')}>
                <ToggleGroupItem value="list"><List className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="grid"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List View */}
      {viewMode === 'list' && (
        <Card className="overflow-visible">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>GPA</TableHead>
                <TableHead>Test Score</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Essays</TableHead>
                <TableHead>Deadlines</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map(student => {
                return (
                  <Dialog key={student.id}>
                    <DialogTrigger asChild>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.avatar_url ?? undefined} />
                              <AvatarFallback className="text-xs">
                                {student.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              {student.school_name && (
                                <div className="text-xs text-muted-foreground">{student.school_name}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{student.gpa ?? '—'}</TableCell>
                        <TableCell>
                          {student.sat_score ? `SAT: ${student.sat_score}` : student.act_score ? `ACT: ${student.act_score}` : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={student.completionPercentage} className="h-2 w-16" />
                            <span className="text-sm text-muted-foreground">{student.completionPercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{student.essaysSubmitted}/{student.totalEssays}</TableCell>
                        <TableCell>{student.upcomingDeadlines}</TableCell>
                        <TableCell>
                          <AtRiskBadge student={student} criteria={criteria} />
                        </TableCell>
                      </TableRow>
                    </DialogTrigger>
                    <StudentDialog student={student} />
                  </Dialog>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStudents.map(student => {
            return (
              <Dialog key={student.id}>
                <DialogTrigger asChild>
                  <Card className="group hover:shadow-card-hover transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={student.avatar_url ?? undefined} />
                            <AvatarFallback>
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                              {student.name}
                            </h3>
                            <div className="text-sm text-muted-foreground">
                              {student.gpa && <span>GPA: {student.gpa}</span>}
                              {student.sat_score && <span> · SAT: {student.sat_score}</span>}
                              {student.act_score && <span> · ACT: {student.act_score}</span>}
                            </div>
                          </div>
                        </div>
                        <AtRiskBadge student={student} criteria={criteria} />
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Application Progress</span>
                          <span className="text-sm text-muted-foreground">{student.completionPercentage}%</span>
                        </div>
                        <Progress value={student.completionPercentage} className="h-2" />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="font-medium">{student.essaysSubmitted}/{student.totalEssays}</div>
                          <div className="text-muted-foreground">Essays</div>
                        </div>
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="font-medium">{student.recommendationsSubmitted}/{student.recommendationsRequested}</div>
                          <div className="text-muted-foreground">Recs</div>
                        </div>
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="font-medium">{student.upcomingDeadlines}</div>
                          <div className="text-muted-foreground">Deadlines</div>
                        </div>
                      </div>

                      {student.school_name && (
                        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                          {student.school_name}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <StudentDialog student={student} />
              </Dialog>
            )
          })}
        </div>
      )}

      {filteredStudents.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No students found</h3>
            <p className="text-muted-foreground">
              {students.length === 0
                ? 'Add your first student using the Add Student page'
                : 'Try adjusting your search terms or filters'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Students
