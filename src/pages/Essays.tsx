import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EssayFeedbackModal } from "@/components/EssayFeedbackModal";
import { CounselorFeedbackHistory } from "@/components/CounselorFeedbackHistory";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAssignedStudents } from "@/hooks/useAssignedStudents";

import {
  Search,
  Filter,
  Download,
  MessageSquare,
  Sparkles,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Share,
  BarChart3,
  Star,
  LayoutGrid,
  List,
  Loader2,
  User
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
interface Essay {
  id: string
  title: string
  studentName: string
  studentAvatar: string | null
  studentId: string
  counselorId: string
  prompt: string | null
  wordCount: number
  status: string
  aiScore: number | null
  aiAnalysis: any
  feedbackItems: any
  manualNotes: string | null
  personalMessage: string | null
  content: string
  createdAt: string
  updatedAt: string
  sentAt: string | null
}

// Defined outside Essays so React never sees a new component type on re-render.
// Defining a component inside another function means a new type every render,
// which causes Radix UI to unmount/remount DialogContent and replay its open animation.

const getStatusColor = (status: string) => {
  switch (status) {
    case 'sent': return 'default'
    case 'in_progress': return 'secondary'
    case 'pending': return 'destructive'
    case 'draft': return 'outline'
    default: return 'outline'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'sent': return CheckCircle
    case 'in_progress': return Clock
    case 'pending': return AlertCircle
    case 'draft': return FileText
    default: return FileText
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'sent': return 'Sent'
    case 'in_progress': return 'In Review'
    case 'pending': return 'Needs Attention'
    case 'draft': return 'Draft'
    default: return status
  }
}

interface EssayDialogProps {
  essay: Essay;
  onOpenFeedback: (essay: Essay) => void;
  onUpdateStatus: (essayId: string, status: string) => void;
}

const EssayDialog = ({ essay, onOpenFeedback, onUpdateStatus }: EssayDialogProps) => {
  const StatusIcon = getStatusIcon(essay.status)
  return (
    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {essay.studentName.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{essay.title}</h2>
              <p className="text-sm text-muted-foreground">{essay.studentName}</p>
            </div>
          </div>
          <Badge variant={getStatusColor(essay.status) as any}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {getStatusLabel(essay.status)}
          </Badge>
        </DialogTitle>
      </DialogHeader>

      <Tabs defaultValue="review" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Essay Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {essay.prompt && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Prompt:</p>
                      <p className="text-sm text-muted-foreground">{essay.prompt}</p>
                    </div>
                  )}
                  <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                    {essay.content}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Word Count</span>
                    <span className="font-medium">{essay.wordCount}</span>
                  </div>
                  {essay.aiScore && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">AI Score</span>
                      <span className="font-medium">{essay.aiScore}/100</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium">
                      {new Date(essay.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {essay.sentAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sent</span>
                      <span className="font-medium">
                        {new Date(essay.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Counselor Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {essay.manualNotes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Your Notes:</p>
                  <p className="text-sm text-muted-foreground">{essay.manualNotes}</p>
                </div>
              )}
              {essay.personalMessage && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Personal Message to Student:</p>
                  <p className="text-sm text-muted-foreground">{essay.personalMessage}</p>
                </div>
              )}
              <Button
                size="lg"
                className="w-full"
                onClick={() => onOpenFeedback(essay)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Open Feedback Editor
              </Button>
            </CardContent>
          </Card>
          <CounselorFeedbackHistory essayId={essay.id} />
        </TabsContent>

      </Tabs>

      <div className="flex gap-2 pt-4 border-t border-border">
        <Button className="flex-1" onClick={() => onOpenFeedback(essay)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Send Feedback
        </Button>
      </div>
    </DialogContent>
  )
}

const Essays = () => {
   const queryClient = useQueryClient();
  const [essays, setEssays] = useState<Essay[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("updatedAt")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [feedbackModalEssay, setFeedbackModalEssay] = useState<Essay | null>(null)
  const { toast } = useToast()
  const { data: studentIds = [], isLoading: loadingAssignments } =
  useAssignedStudents();

  useEffect(() => {
    fetchEssays()
  }, [studentIds])

 
const fetchEssays = async () => {
  setLoading(true);

  try {
    // If no assigned students → no essays
    if (!studentIds || studentIds.length === 0) {
      setEssays([]);
      return;
    }

    // Step 1 — fetch essays only for assigned students; exclude drafts (not ready for counselor review)
    const { data: essayData, error } = await supabase
      .from("essay_feedback")
      .select("*")
      .in("student_id", studentIds)
      .neq("status", "draft")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // Step 2 — fetch profiles for those students
    const { data: profilesData, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", studentIds);

    if (profileError) throw profileError;

    // Step 3 — assemble essays
    const assembled: Essay[] = (essayData || []).map((e) => {
      const profile = profilesData?.find(
        (p) => p.user_id === e.student_id
      );

      return {
        id: e.id,
        title: e.essay_title,
        studentName: profile?.full_name || "Unknown Student",
        studentAvatar: profile?.avatar_url || null,
        studentId: e.student_id,
        counselorId: e.counselor_id,
        prompt: e.essay_prompt,
        wordCount:
          e.essay_content?.split(/\s+/).filter(Boolean).length || 0,
        status: e.status,
        aiScore: e.ai_analysis
          ? (e.ai_analysis as any)?.overall_score || null
          : null,
        aiAnalysis: e.ai_analysis,
        feedbackItems: e.feedback_items,
        manualNotes: e.manual_notes,
        personalMessage: e.personal_message,
        content: e.essay_content,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
        sentAt: e.sent_at,
      };
    });

    setEssays(assembled);
  } catch (error: any) {
    toast({
      title: "Failed to load essays",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  const updateEssayStatus = async (essayId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('essay_feedback')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', essayId)

      if (error) throw error

      setEssays(prev => prev.map(e => e.id === essayId ? { ...e, status: newStatus } : e))
      toast({ title: 'Status updated', description: `Essay marked as ${newStatus}` })
    } catch (error: any) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
    }
  }

  // ─── Stats (computed from real data) ─────────────────────────
  const stats = {
    total: essays.length,
    inReview: essays.filter(e => e.status === 'in_progress').length,
    needsAttention: essays.filter(e => e.status === 'pending').length,
    avgScore: essays.length
      ? Math.round(essays.filter(e => e.aiScore).reduce((sum, e) => sum + (e.aiScore || 0), 0) / essays.filter(e => e.aiScore).length) || 0
      : 0
  }

  const filteredEssays = essays.filter(essay => {
    const matchesSearch =
      essay.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      essay.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || essay.status === statusFilter
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    if (sortBy === 'aiScore') return (b.aiScore || 0) - (a.aiScore || 0)
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  if (loading || loadingAssignments) {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Essays</h1>
          <p className="text-muted-foreground">Manage and review student essays</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/essay-analytics'}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Essays', value: stats.total, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'In Review', value: stats.inReview, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Needs Attention', value: stats.needsAttention, icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'Avg AI Score', value: stats.avgScore || '—', icon: Star, color: 'text-ai-accent', bg: 'bg-ai-accent/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${bg} rounded-lg`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by essay title or student name..."
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
                  <SelectItem value="in_progress">In Review</SelectItem>
                  <SelectItem value="pending">Needs Attention</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Latest</SelectItem>
                  <SelectItem value="aiScore">AI Score</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEssays.map(essay => {
            const StatusIcon = getStatusIcon(essay.status)
            return (
              <Dialog key={essay.id}>
                <DialogTrigger asChild>
                  <Card className="group hover:shadow-card-hover transition-all duration-300 hover:scale-[1.01] cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {essay.studentName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                              {essay.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">{essay.studentName}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(essay.status) as any} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {getStatusLabel(essay.status)}
                        </Badge>
                      </div>

                      {essay.aiScore && (
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-muted-foreground">AI Score</span>
                          <span className="text-sm font-medium">{essay.aiScore}/100</span>
                        </div>
                      )}

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {essay.content}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{essay.wordCount} words</span>
                        <span>Updated {new Date(essay.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <EssayDialog essay={essay} onOpenFeedback={setFeedbackModalEssay} onUpdateStatus={updateEssayStatus} />
              </Dialog>
            )
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredEssays.map(essay => {
                const StatusIcon = getStatusIcon(essay.status)
                return (
                  <Dialog key={essay.id}>
                    <DialogTrigger asChild>
                      <div className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {essay.studentName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{essay.title}</h3>
                          <p className="text-sm text-muted-foreground">{essay.studentName}</p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          {essay.aiScore && (
                            <div className="text-center">
                              <div className="font-bold text-primary">{essay.aiScore}</div>
                              <div className="text-xs text-muted-foreground">Score</div>
                            </div>
                          )}
                          <div className="text-center">
                            <div className="font-medium">{essay.wordCount}</div>
                            <div className="text-xs text-muted-foreground">Words</div>
                          </div>
                          <Badge variant={getStatusColor(essay.status) as any} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {getStatusLabel(essay.status)}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {new Date(essay.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    <EssayDialog essay={essay} onOpenFeedback={setFeedbackModalEssay} onUpdateStatus={updateEssayStatus} />
                  </Dialog>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredEssays.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No essays found</h3>
            <p className="text-muted-foreground">
              {essays.length === 0
                ? 'No essays have been submitted yet'
                : 'Try adjusting your search or filters'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Feedback Modal */}
      {feedbackModalEssay && (
        <EssayFeedbackModal
  isOpen={!!feedbackModalEssay}
  onClose={() => { setFeedbackModalEssay(null);
    queryClient.invalidateQueries({ queryKey: ["essays"] }); fetchEssays() }}
  essay={{
    id: feedbackModalEssay.id,
    title: feedbackModalEssay.title,
    studentName: feedbackModalEssay.studentName,
    studentId: feedbackModalEssay.studentId,  // ← make sure this is passed
    prompt: feedbackModalEssay.prompt || '',
    content: feedbackModalEssay.content,
  }}
/>
      )}
    </div>
  )
}

export default Essays
