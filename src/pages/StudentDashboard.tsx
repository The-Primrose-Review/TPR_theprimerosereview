import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StudentEssayFeedback } from "@/components/StudentEssayFeedback";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Calendar,
  Upload,
  MessageSquare,
  AlertCircle,
  Clock,
  TrendingUp,
  Star,
  Award,
  Loader2,
  MapPin,
  Sparkles,
  Trophy,
  Flame,
  Crown,
  Medal,
} from "lucide-react";
import { StudentTour, startStudentTour } from "@/components/StudentTour";

interface ActiveChallenge {
  id: string;
  title: string;
  theme: string;
  description: string;
  ends_at: string;
}

interface ChallengeResult {
  challengeId: string;
  challengeTitle: string;
  weekNumber: number;
  myScore: number;
  myRank: number;
  totalParticipants: number;
  winnerName: string;
  winnerScore: number;
  isWinner: boolean;
}

interface DashboardData {
  studentName: string
  avatarUrl: string | null
  applications: { completed: number; total: number }
  essays: { completed: number; total: number }
  recommendations: { completed: number; total: number }
  upcomingDeadlines: { id: string; title: string; date: string; daysLeft: number; urgency: string }[]
  pendingTasks: { id: string; task: string; due_date: string | null; color: string }[]
}

const StudentDashboard = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [challengePopup, setChallengePopup] = useState<ActiveChallenge | null>(null)
  const [resultsPopup, setResultsPopup] = useState<ChallengeResult | null>(null)

  useEffect(() => {
    fetchDashboardData()
    fetchResultsPopup()
    fetchChallengePopup()
  }, [])

  const fetchChallengePopup = async () => {
    try {
      const { data: challenges } = await supabase
        .from('weekly_challenges')
        .select('id, title, theme, description, ends_at')
        .eq('is_active', true)
        .gt('ends_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)

      const challenge = challenges?.[0]
      if (!challenge) return

      setChallengePopup(challenge)
    } catch {
      // silently ignore — popup is non-critical
    }
  }

  const dismissChallengePopup = () => {
    setChallengePopup(null)
  }

  const fetchResultsPopup = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Find closed challenges from the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
      const { data: closed } = await supabase
        .from('weekly_challenges')
        .select('id, title, week_number, ends_at')
        .eq('is_active', true)
        .lt('ends_at', new Date().toISOString())
        .gt('ends_at', thirtyDaysAgo)
        .order('ends_at', { ascending: false })
        .limit(3)

      if (!closed?.length) return

      for (const challenge of closed) {
        const resultsKey = `seen_results_${challenge.id}`
        if (localStorage.getItem(resultsKey)) continue

        // Check if this student submitted and was scored
        const { data: mySub } = await supabase
          .from('challenge_submissions')
          .select('id, ai_scores')
          .eq('challenge_id', challenge.id)
          .eq('student_id', user.id)
          .maybeSingle()

        if (!mySub?.ai_scores) continue

        // Fetch all scored submissions platform-wide
        const { data: allSubs } = await supabase
          .from('challenge_submissions')
          .select('id, student_id, ai_scores')
          .eq('challenge_id', challenge.id)
          .not('ai_scores', 'is', null)

        if (!allSubs?.length) continue

        const sorted = allSubs.sort((a, b) => b.ai_scores.overallScore - a.ai_scores.overallScore)

        const myRank = sorted.findIndex(s => s.id === mySub.id) + 1
        const winnerSub = sorted[0]

        const { data: winnerProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', winnerSub.student_id)
          .maybeSingle()

        const winnerFullName = winnerProfile?.full_name ?? 'a fellow student'
        const winnerParts = winnerFullName.trim().split(' ')
        const winnerDisplay = winnerParts.length > 1
          ? `${winnerParts[0]} ${winnerParts[winnerParts.length - 1][0]}.`
          : winnerParts[0]

        setResultsPopup({
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          weekNumber: challenge.week_number,
          myScore: mySub.ai_scores.overallScore,
          myRank,
          totalParticipants: sorted.length,
          winnerName: winnerDisplay,
          winnerScore: winnerSub.ai_scores.overallScore,
          isWinner: winnerSub.id === mySub.id,
        })
        return // show one at a time
      }
    } catch {
      // non-critical — silently skip
    }
  }

  const dismissResultsPopup = () => {
    if (resultsPopup) {
      localStorage.setItem(`seen_results_${resultsPopup.challengeId}`, '1')
    }
    setResultsPopup(null)
  }

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

      // Fetch applications, essay statuses, and rec statuses in parallel
      const [{ data: apps }, { data: essayFeedbacks }, { data: recRequests }] = await Promise.all([
        supabase
          .from('applications')
          .select('school_name, application_type, deadline_date, status, required_essays, recommendations_requested')
          .eq('student_id', user.id)
          .order('deadline_date', { ascending: true }),
        supabase
          .from('essay_feedback')
          .select('id, status')
          .eq('student_id', user.id),
        supabase
          .from('recommendation_requests')
          .select('id, status')
          .eq('student_id', user.id),
      ])

      // Fetch pending tasks
      const { data: tasks } = await (supabase
        .from('tasks')
        .select('id, task, due_date, color')
        .eq('student_id', user.id)
        .eq('completed', false)
        .order('due_date', { ascending: true })
        .limit(5) as any)

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
          completed: (essayFeedbacks || []).filter(e => ['sent', 'read', 'approved'].includes(e.status)).length,
          total: (apps || []).reduce((sum, a) => sum + (a.required_essays ?? 0), 0),
        },
        recommendations: {
          completed: (recRequests || []).filter(r => r.status === 'sent').length,
          total: (apps || []).reduce((sum, a) => sum + (a.recommendations_requested ?? 0), 0),
        },
        upcomingDeadlines,
        pendingTasks: (tasks || []).map((t: any) => ({
          id: t.id,
          task: t.task,
          due_date: t.due_date,
          color: t.color ?? 'blue',
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
      {/* Primrose Challenge popup — shown once per challenge per browser */}
      <Dialog open={!!challengePopup} onOpenChange={open => { if (!open) dismissChallengePopup() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-amber-400 flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                <Flame className="h-3 w-3" /> New Challenge Live
              </Badge>
            </div>
            <DialogTitle className="text-xl">{challengePopup?.title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed pt-1 whitespace-pre-line">
              {challengePopup?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs font-semibold text-amber-800 mb-2">Prize</p>
            <div className="space-y-1 text-sm text-amber-700">
              <div className="flex items-start gap-2">
                <Trophy className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                <span>3 hours of admissions consulting with our senior consultants</span>
              </div>
              <p className="text-xs text-amber-600 font-medium pl-5">OR</p>
              <div className="flex items-start gap-2">
                <Trophy className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                <span>A family strategy session with your parents</span>
              </div>
            </div>
          </div>
          <p className="text-sm font-medium text-foreground">Ready to begin? Let's do this!</p>
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2"
              onClick={() => { dismissChallengePopup(); navigate('/weekly-challenge') }}
            >
              <Trophy className="h-4 w-4" /> Start the Challenge
            </Button>
            <Button variant="ghost" onClick={dismissChallengePopup} className="flex-1">
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Challenge results popup — shown once after challenge closes */}
      <Dialog open={!!resultsPopup} onOpenChange={open => { if (!open) dismissResultsPopup() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              {resultsPopup?.isWinner
                ? <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shrink-0"><Crown className="h-5 w-5 text-white" /></div>
                : <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-amber-400 flex items-center justify-center shrink-0"><Trophy className="h-5 w-5 text-white" /></div>
              }
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                Challenge Results
              </Badge>
            </div>
            <DialogTitle className="text-xl">
              {resultsPopup?.isWinner ? '🏆 You won the challenge!' : 'Challenge Results Are In!'}
            </DialogTitle>
            <DialogDescription className="text-sm pt-1">{resultsPopup?.challengeTitle}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {/* Winner callout */}
            {!resultsPopup?.isWinner && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <Crown className="h-4 w-4 text-yellow-600 shrink-0" />
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">{resultsPopup?.winnerName}</span> took first place with a score of <span className="font-semibold">{resultsPopup?.winnerScore}/100</span>
                </p>
              </div>
            )}

            {/* Student's own result */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-3xl font-bold text-primary">{resultsPopup?.myScore}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Your score / 100</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="text-3xl font-bold text-foreground">
                  {resultsPopup?.myRank === 1 ? '🥇' : resultsPopup?.myRank === 2 ? '🥈' : resultsPopup?.myRank === 3 ? '🥉' : `#${resultsPopup?.myRank}`}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">of {resultsPopup?.totalParticipants} students</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 gap-2"
              onClick={() => { dismissResultsPopup(); navigate('/weekly-challenge') }}
            >
              <Trophy className="h-4 w-4" /> See Full Leaderboard
            </Button>
            <Button variant="ghost" onClick={dismissResultsPopup} className="flex-1">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
        <Card className="flex items-center justify-center">
          <CardContent className="p-6 w-full">
            <Button
              id="tour-add-application"
              variant="outline"
              className="h-16 w-full flex-col gap-2 border-primary/30 hover:bg-primary/5"
              onClick={() => navigate('/add-application')}
            >
              <FileText className="h-5 w-5" />
              Add Application
            </Button>
          </CardContent>
        </Card>
        {[
          // { label: 'Applications', icon: Calendar, data: data?.applications },
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

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Action Items
              {(data?.pendingTasks.length ?? 0) > 0 && (
                <span className="ml-1 inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  {data!.pendingTasks.length} pending
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.pendingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending tasks — you're all caught up!
              </p>
            ) : (
              <div className="space-y-2">
                {data?.pendingTasks.map((task) => {
                  const COLOR_MAP: Record<string, string> = {
                    blue:   "bg-blue-500/10 border-blue-300 text-blue-700",
                    purple: "bg-purple-500/10 border-purple-300 text-purple-700",
                    green:  "bg-green-500/10 border-green-300 text-green-700",
                    orange: "bg-orange-500/10 border-orange-300 text-orange-700",
                    pink:   "bg-pink-500/10 border-pink-300 text-pink-700",
                    yellow: "bg-yellow-500/10 border-yellow-300 text-yellow-700",
                  }
                  const color = COLOR_MAP[task.color] ?? COLOR_MAP.blue
                  return (
                    <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border ${color}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{task.task}</p>
                        {task.due_date && (
                          <p className="text-xs opacity-70 mt-0.5">
                            Due: {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => navigate('/student-personal-area?tab=tasks')}
              >
                Manage all tasks in My Work →
              </Button>
            </div>
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
          <div className="grid grid-cols-2 gap-3">
            <Button
              id="tour-upload-essay"
              variant="outline"
              className="h-16 flex-col gap-2"
              onClick={() => navigate('/submit-essay')}
            >
              <Upload className="h-5 w-5" />
              Upload Essay
            </Button>
            {/* <Button
              variant="outline"
              className="h-16 flex-col gap-2 border-primary/30 hover:bg-primary/5"
              onClick={() => navigate('/personal-essay')}
            >
              <Sparkles className="h-5 w-5 text-primary" />
              Personal Essay
            </Button> */}
            {/* <Button variant="outline" className="h-16 flex-col gap-2" onClick={() => navigate('/student-personal-area')}>
              <FileText className="h-5 w-5" />
              View Feedback
            </Button> */}
            <Button variant="outline" className="h-16 flex-col gap-2" onClick={() => navigate('/student-messages')}>
              <MessageSquare className="h-5 w-5" />
              Message Counselor
            </Button>
            {/* <Button
              id="tour-rec-letters"
              variant="outline"
              className="h-16 flex-col gap-2 border-primary/30 hover:bg-primary/5"
              onClick={() => navigate('/student-recommendation-letters')}
            >
              <Award className="h-5 w-5 text-primary" />
              Rec Letters
            </Button> */}
            {/* <Button
              id="tour-add-application"
              variant="outline"
              className="h-16 flex-col gap-2 border-primary/30 hover:bg-primary/5"
              onClick={() => navigate('/add-application')}
            >
              <FileText className="h-5 w-5" />
              Add Application
            </Button> */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentDashboard
