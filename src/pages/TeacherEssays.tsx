import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useTeacherEssays, useUpdateTeacherEssayNotes, type TeacherEssay } from "@/hooks/useTeacherEssays";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  MessageSquare,
  BarChart3,
  ScanText,
  Loader2,
  Star,
  Save,
} from "lucide-react";

const SUPABASE_URL = "https://fkvfngdwblbalrompzdj.supabase.co";

const statusConfig = {
  pending: { label: "Pending", icon: AlertCircle, cls: "border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/20" },
  reviewing: { label: "Reviewing", icon: Clock, cls: "border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/20" },
  reviewed: { label: "Reviewed", icon: CheckCircle, cls: "border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
};

interface EssayDetailProps {
  essay: TeacherEssay;
  onClose: () => void;
}

const EssayDetail = ({ essay, onClose }: EssayDetailProps) => {
  const [notes, setNotes] = useState(essay.teacherNotes ?? "");
  const [teacherStatus, setTeacherStatus] = useState(essay.teacherStatus);
  const [analysisResult, setAnalysisResult] = useState<any>(essay.aiAnalysis ?? null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const updateMutation = useUpdateTeacherEssayNotes();

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        shareId: essay.shareId,
        teacherNotes: notes,
        teacherStatus,
      });
      toast.success("Notes saved");
      onClose();
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const handleAnalyse = async () => {
    if (!essay.content.trim()) return;
    setIsAnalysing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-essay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ essayContent: essay.content, prompt: essay.prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
      } else {
        toast.error("Analysis failed. Please try again.");
      }
    } catch {
      toast.error("Couldn't analyse the essay right now.");
    } finally {
      setIsAnalysing(false);
    }
  };

  const cfg = statusConfig[teacherStatus as keyof typeof statusConfig] ?? statusConfig.pending;
  const StatusIcon = cfg.icon;

  return (
    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gradient-to-br from-violet-400 to-purple-600 text-white text-xs font-semibold">
                {essay.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-base font-bold">{essay.title}</p>
              <p className="text-xs text-muted-foreground font-normal">{essay.studentName}</p>
            </div>
          </div>
        </DialogTitle>
      </DialogHeader>

      <Tabs defaultValue="essay" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="essay">Essay</TabsTrigger>
          <TabsTrigger value="notes">My Notes</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="essay" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                Essay Content
                <Badge variant="outline" className="ml-auto">{essay.wordCount} words</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {essay.prompt && (
                <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900">
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Prompt</p>
                  <p className="text-sm text-muted-foreground">{essay.prompt}</p>
                </div>
              )}
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{essay.content}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                Your Feedback Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="flex gap-2">
                  {(Object.keys(statusConfig) as (keyof typeof statusConfig)[]).map((s) => {
                    const c = statusConfig[s];
                    const Icon = c.icon;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTeacherStatus(s)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          teacherStatus === s ? c.cls : "border-border text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Notes for student</p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your feedback, observations, or suggestions for this student..."
                  rows={8}
                  className="text-sm resize-none"
                />
              </div>
              <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full bg-purple-600 hover:bg-purple-700">
                {updateMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Save Notes</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  AI Analysis
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAnalyse}
                  disabled={isAnalysing}
                  className="h-7 text-xs"
                >
                  {isAnalysing ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Analysing…</>
                  ) : (
                    <><ScanText className="h-3 w-3 mr-1" />Run Analysis</>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!analysisResult && !isAnalysing && (
                <div className="text-center py-8">
                  <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Click "Run Analysis" to get an AI breakdown.</p>
                </div>
              )}
              {isAnalysing && (
                <div className="flex flex-col items-center py-10 gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-purple-500" />
                  <p className="text-sm text-muted-foreground">Analysing essay…</p>
                </div>
              )}
              {analysisResult && !isAnalysing && (
                <div className="space-y-4">
                  {analysisResult.overallScore && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Score</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analysisResult.overallScore} className="w-24 h-2" />
                        <span className="text-sm font-bold text-purple-600">
                          {analysisResult.overallScore}/100
                        </span>
                      </div>
                    </div>
                  )}
                  {analysisResult.criteria?.map((c: any) => (
                    <div key={c.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{c.name}</span>
                        <span className="font-medium">{c.score}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${c.score}%`, backgroundColor: c.color }}
                        />
                      </div>
                    </div>
                  ))}
                  {analysisResult.issues?.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Issues</p>
                      {analysisResult.issues.map((issue: any) => (
                        <div key={issue.id} className="p-3 rounded-lg border text-xs space-y-1" style={{ borderLeftColor: issue.color, borderLeftWidth: 3 }}>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold" style={{ color: issue.color }}>{issue.criterionName}</span>
                            <Badge variant="outline" className="text-xs">{issue.severity}</Badge>
                          </div>
                          <p className="font-medium text-foreground">{issue.problemType}</p>
                          <p className="text-muted-foreground">{issue.problemDescription}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
};

const TeacherEssays = () => {
  const { data: essays = [], isLoading } = useTeacherEssays();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openEssay, setOpenEssay] = useState<TeacherEssay | null>(null);

  const filtered = essays
    .filter((e) => {
      const matchSearch =
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || e.teacherStatus === statusFilter;
      return matchSearch && matchStatus;
    });

  const stats = {
    total: essays.length,
    pending: essays.filter((e) => e.teacherStatus === "pending").length,
    reviewed: essays.filter((e) => e.teacherStatus === "reviewed").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Essays</h1>
        <p className="text-muted-foreground">Student essays shared with you for review</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", icon: FileText },
          { label: "Pending", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20", icon: Clock },
          { label: "Reviewed", value: stats.reviewed, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20", icon: CheckCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by essay title or student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Essay list */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">
              {essays.length === 0 ? "No essays yet" : "No essays match your filters"}
            </p>
            <p className="text-xs text-muted-foreground">
              {essays.length === 0
                ? "Essays will appear here when students share them with you."
                : "Try adjusting your search or status filter."}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((essay) => {
          const cfg = statusConfig[essay.teacherStatus as keyof typeof statusConfig] ?? statusConfig.pending;
          const StatusIcon = cfg.icon;
          return (
            <Dialog key={essay.shareId} onOpenChange={(open) => !open && setOpenEssay(null)}>
              <DialogTrigger asChild>
                <Card
                  className="cursor-pointer hover:shadow-md transition-all group"
                  onClick={() => setOpenEssay(essay)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-violet-400 to-purple-600 text-white text-xs font-semibold">
                          {essay.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-purple-600 transition-colors">
                          {essay.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{essay.studentName}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs shrink-0 flex items-center gap-1 ${cfg.cls}`}>
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{essay.content}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{essay.wordCount} words</span>
                      <div className="flex items-center gap-2">
                        {essay.aiScore && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-500" />
                            {essay.aiScore}/100
                          </span>
                        )}
                        <span>Shared {new Date(essay.sharedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              {openEssay?.shareId === essay.shareId && (
                <EssayDetail essay={essay} onClose={() => setOpenEssay(null)} />
              )}
            </Dialog>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherEssays;
