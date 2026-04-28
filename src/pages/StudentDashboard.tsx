import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StudentEssayFeedback } from "@/components/StudentEssayFeedback";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Calendar,
  Upload,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Star,
  Award,
  Loader2,
  MapPin,
} from "lucide-react";
import { StudentTour, startStudentTour } from "@/components/StudentTour";

interface DashboardData {
  studentName: string
  avatarUrl: string | null
  applications: { completed: number; total: number }
  essays: { completed: number; total: number }
  recommendations: { completed: number; total: number }
  upcomingDeadlines: { id: string; title: string; date: string; daysLeft: number; urgency: string }[]
  pendingTasks: { id: string; task: string; due_date: string | null }[]
}

const StudentDashboard = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const handleClick = ()=>{
    navigate("/submit-essay")
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .single()

      // Fetch essays
      const { data: essays } = await supabase
        .from('essay_feedback')
        .select('status')
        .eq('student_id', user.id)

      // Fetch recommendations
      const { data: recs } = await supabase
        .from('recommendation_requests')
        .select('status')
        .eq('student_id', user.id)

      // Fetch applications
      const { data: apps } = await supabase
        .from('applications')
        .select('school_name, application_type, deadline_date, status')
        .eq('student_id', user.id)
        .order('deadline_date', { ascending: true })

      // Fetch pending tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, task, due_date')
        .eq('student_id', user.id)
        .eq('completed', false)
        .order('due_date', { ascending: true })
        .limit(5)

      // Compute upcoming deadlines from applications
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const upcomingDeadlines = (apps || [])
        .filter(a => a.status !== 'submitted')
        .map(a => {
          const date = new Date(a.deadline_date)
          const daysLeft = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          return {
            id: `${a.school_name}-${a.deadline_date}`,
            title: `${a.school_name} — ${a.application_type}`,
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            daysLeft,
            urgency: daysLeft < 0 ? 'critical' : daysLeft <= 7 ? 'critical' : daysLeft <= 21 ? 'important' : 'normal',
          }
        })
        .slice(0, 5)

      setData({
        studentName: profile?.full_name?.split(' ')[0] || 'there',
        avatarUrl: profile?.avatar_url || null,
        applications: {
          completed: (apps || []).filter(a => a.status === 'submitted').length,
          total: (apps || []).length,
        },
        essays: {
          completed: (essays || []).filter(e => e.status === 'sent').length,
          total: (essays || []).length,
        },
        recommendations: {
          completed: (recs || []).filter(r => r.status === 'sent').length,
          total: (recs || []).length,
        },
        upcomingDeadlines,
        pendingTasks: (tasks || []).map(t => ({
          id: t.id,
          task: t.task,
          due_date: t.due_date,
        })),
      })
    } catch (error: any) {
      toast({ title: 'Failed to load dashboard', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-destructive text-destructive-foreground'
      case 'important': return 'bg-orange-500 text-white'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertCircle className="h-4 w-4" />
      case 'important': return <Clock className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const overallProgress = data
    ? Math.round(
        ((data.applications.completed + data.essays.completed + data.recommendations.completed) /
          Math.max(data.applications.total + data.essays.total + data.recommendations.total, 1)) * 100
      )
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <StudentTour />

      {/* Welcome Header */}
      <Card id="tour-welcome" className="bg-gradient-subtle border-none">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={data?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-lg">
                {data?.studentName?.[0] ?? 'S'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                Hi {data?.studentName}, you are {overallProgress}% on track!
              </h1>
              <p className="text-muted-foreground mt-1">
                Keep up the great work! Here's your college application progress.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={startStudentTour}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors border border-border rounded-full px-3 py-1.5 hover:border-primary/40"
              >
                <MapPin className="h-3 w-3" />
                Take the tour
              </button>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <div id="tour-progress" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Applications', icon: Calendar, data: data?.applications },
          { label: 'Essays', icon: FileText, data: data?.essays },
          { label: 'Recommendations', icon: Star, data: data?.recommendations },
        ].map(({ label, icon: Icon, data: d }) => {
          const pct = d && d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0
          return (
            <Card key={label}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{d?.completed ?? 0} of {d?.total ?? 0} completed</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card id="tour-deadlines">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming deadlines — add applications to track them here
              </p>
            ) : (
              <div className="space-y-3">
                {data?.upcomingDeadlines.map(deadline => (
                  <div
                    key={deadline.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${getUrgencyColor(deadline.urgency)}`}>
                        {getUrgencyIcon(deadline.urgency)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{deadline.title}</p>
                        <p className="text-xs text-muted-foreground">{deadline.date}</p>
                      </div>
                    </div>
                    <Badge
                      variant={deadline.urgency === 'critical' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {deadline.daysLeft < 0 ? 'Overdue' : `${deadline.daysLeft}d`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.pendingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending tasks — you're all caught up!
              </p>
            ) : (
              <div className="space-y-3">
                {data?.pendingTasks.map(task => (
                  <div key={task.id} className="p-3 rounded-lg bg-muted/30 border border-muted">
                    <p className="text-sm font-medium text-foreground">{task.task}</p>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Essay Feedback from Counselor */}
      <div id="tour-essay-feedback">
        <StudentEssayFeedback />
      </div>

      {/* Quick Actions */}
      <Card id="tour-quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Button
              id="tour-upload-essay"
              variant="outline"
              className="h-16 flex-col gap-2"
              onClick={() => navigate('/submit-essay')}
            >
              <Upload className="h-5 w-5" />
              Upload Essay
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2" onClick={() => navigate('/student-personal-area')}>
              <FileText className="h-5 w-5" />
              View Feedback
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2">
              <CheckCircle className="h-5 w-5" />
              Check Tasks
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2" onClick={() => navigate('/student-messages')}>
              <MessageSquare className="h-5 w-5" />
              Message Counselor
            </Button>
            <Button
              id="tour-rec-letters"
              variant="outline"
              className="h-16 flex-col gap-2 border-primary/30 hover:bg-primary/5"
              onClick={() => navigate('/student-recommendation-letters')}
            >
              <Award className="h-5 w-5 text-primary" />
              Rec Letters
            </Button>
            <Button
              id="tour-add-application"
              variant="outline"
              className="h-16 flex-col gap-2 border-primary/30 hover:bg-primary/5"
              onClick={() => navigate('/add-application')}
            >
              <FileText className="h-5 w-5" />
              Add Application
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentDashboard
