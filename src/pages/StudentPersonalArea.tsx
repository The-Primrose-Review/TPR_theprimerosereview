import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudentPersonalArea, type EssayFeedback } from "@/hooks/Usestudentpersonalarea";
import { StudentActionItemsSection } from "@/components/StudentActionItemsSection";
import type { TrackedChange } from "@/components/EssayFeedbackModal";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, GraduationCap } from "lucide-react";
import { useApplications } from "@/hooks/useApplications";
import { ApplicationDetailModal } from "@/components/ApplicationDetailModal";
import jsPDF from "jspdf";
import type { ApplicationWithProfile } from "@/hooks/useApplications";

import {
  FileText,
  Upload,
  MessageSquare,
  CheckCircle,
  Clock,
  Calendar,
  Star,
  History,
  AlertCircle,
  TrendingUp,
  MessageCircle,
  Loader2,
  Strikethrough,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":    return "bg-green-500 text-white";
    case "sent":        return "bg-green-500 text-white";
    case "review":      return "bg-yellow-500 text-white";
    case "in_progress": return "bg-yellow-500 text-white";
    case "draft":       return "bg-blue-500 text-white";
    case "completed":   return "bg-green-500 text-white";
    case "in-progress": return "bg-yellow-500 text-white";
    case "not-started": return "bg-gray-500 text-white";
    default:            return "bg-gray-500 text-white";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
    case "sent":
    case "completed":   return <CheckCircle className="h-4 w-4" />;
    case "review":
    case "in_progress":
    case "in-progress": return <Clock className="h-4 w-4" />;
    case "draft":       return <FileText className="h-4 w-4" />;
    default:            return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusLabel = (status: string) =>
  status.replace(/-/g, " ").replace(/_/g, " ");

// ── Component ─────────────────────────────────────────────────

const StudentPersonalArea = () => {
  const navigate = useNavigate();
  const {
    essays,
    sentFeedback,
    isLoadingEssays,
    isLoadingFeedback,
    getFeedbackForEssay,
  } = useStudentPersonalArea();

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab]           = useState(() => searchParams.get("tab") ?? "essays");
  const [selectedEssay, setSelectedEssay]   = useState<EssayFeedback | null>(null);

  const { applications, isLoading: isLoadingApplications } = useApplications();
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithProfile | null>(null);

  const essayFeedback = selectedEssay
    ? getFeedbackForEssay(selectedEssay.essay_title)
    : [];

  // Collect all tracked changes from sent feedback for this essay
  const trackedChanges = useMemo((): TrackedChange[] => {
    return essayFeedback.flatMap(fb => fb.track_changes ?? []);
  }, [essayFeedback]);

  // Split essay into paragraphs with offsets
  const paragraphData = useMemo(() => {
    const content = selectedEssay?.essay_content ?? '';
    const lines = content.split('\n');
    let offset = 0;
    return lines.map((text, i) => {
      const start = offset;
      const end = offset + text.length;
      offset = end + 1;
      return { text, start, end, index: i };
    });
  }, [selectedEssay?.essay_content]);

  // Map paragraph index → tracked changes in that paragraph
  const paragraphChangeMap = useMemo(() => {
    const map = new Map<number, TrackedChange[]>();
    for (const change of trackedChanges) {
      for (const para of paragraphData) {
        if (change.startIndex >= para.start && change.startIndex <= para.end) {
          map.set(para.index, [...(map.get(para.index) ?? []), change]);
          break;
        }
      }
    }
    return map;
  }, [trackedChanges, paragraphData]);

  // Render a paragraph with tracked changes inline
  const renderParagraph = (paraText: string, paraStart: number, paraChanges: TrackedChange[]) => {
    if (!paraChanges.length) return <span>{paraText}</span>;
    const segments: JSX.Element[] = [];
    let lastIdx = 0;
    const sorted = [...paraChanges]
      .map(c => ({
        change: c,
        relStart: Math.max(0, c.startIndex - paraStart),
        relEnd: Math.min(paraText.length, c.endIndex - paraStart),
      }))
      .filter(a => a.relStart < a.relEnd)
      .sort((a, b) => a.relStart - b.relStart);

    for (const { change, relStart, relEnd } of sorted) {
      if (relStart < lastIdx) continue;
      if (relStart > lastIdx)
        segments.push(<span key={`pre-${change.id}`}>{paraText.slice(lastIdx, relStart)}</span>);
      segments.push(
        <span key={`tc-${change.id}`} className="inline">
          <del className="text-red-500 bg-red-50 line-through px-0.5 rounded-sm">{paraText.slice(relStart, relEnd)}</del>
          <ins className="text-green-700 bg-green-50 no-underline px-0.5 rounded-sm font-medium ml-0.5">{change.suggestedText}</ins>
        </span>
      );
      lastIdx = relEnd;
    }
    if (lastIdx < paraText.length)
      segments.push(<span key="rest">{paraText.slice(lastIdx)}</span>);
    return segments;
  };
  const handleDownloadEssay = (essay: EssayFeedback) => {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(essay.essay_title, 10, 15);

  doc.setFontSize(10);
  doc.text(
    doc.splitTextToSize(essay.essay_content, 180),
    10,
    25
  );

  doc.save(`${essay.essay_title}.pdf`);
};

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Work</h1>
        <p className="text-muted-foreground">
          Manage your essays, tasks, and track your progress
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="essays">Essays</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        {/* ── Essays Tab ── */}
        <TabsContent value="essays" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Essays</h2>
            {/* <Button onClick={() => navigate('/submit-essay')}>
              <Upload className="h-4 w-4 mr-2" />
              Upload New Essay
            </Button>
            <Button variant="outline" onClick={() => navigate('/personal-essay')}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Personal Essay
            </Button> */}
            <div className="flex gap-2">
              <Button onClick={() => navigate('/submit-essay')}>
                <Upload className="h-4 w-4 mr-2" />
                Upload New Essay
              </Button>

              <Button onClick={() => navigate('/personal-essay')}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Personal Essay
              </Button>
            </div>
          </div>

          {isLoadingEssays ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : essays.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No essays yet. Upload your first essay to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {essays.map((essay) => (
                <Card
                  key={essay.id}
                  className="border-l-4 border-l-muted cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setSelectedEssay(essay)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{essay.essay_title}</CardTitle>
                        {essay.essay_prompt && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {essay.essay_prompt}
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusColor(essay.status)}>
                        {getStatusIcon(essay.status)}
                        <span className="ml-1 capitalize">{getStatusLabel(essay.status)}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Word Count</p>
                        <p className="font-medium">{essay.essay_content.split(/\s+/).filter(Boolean).length} words</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p className="font-medium">
                          {new Date(essay.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Feedback</p>
                        <p className="font-medium">
                          {essay.status === "sent" || essay.status === "read"
                            ? "Available"
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {essay.status === "draft" ? (
                        <Button
                          size="sm"
                          className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/submit-essay?draftId=${essay.id}`);
                          }}
                        >
                          Continue Writing
                        </Button>
                      ) : (
                        <>
                          {/* <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                            View Details
                          </Button> */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEssay(essay);
                              }}
                            >
                              View Details
                            </Button>
                          {/* <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                            Download
                          </Button> */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadEssay(essay);
                              }}
                            >
                              Download
                            </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Feedback Tab ── */}
        <TabsContent value="feedback" className="space-y-6">
          <h2 className="text-xl font-semibold">Feedback & Comments</h2>

          {isLoadingFeedback ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sentFeedback.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No feedback yet. Your counselor will review your essays soon.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sentFeedback.map((fb) => (
                <Card key={fb.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Essay Feedback</CardTitle>
                      <Badge variant="outline">{fb.essay_title}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Received{" "}
                      {fb.sent_at
                        ? new Date(fb.sent_at).toLocaleDateString()
                        : new Date(fb.created_at).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Personal message */}
                    {fb.personal_message && (
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <p className="text-xs font-medium text-primary mb-1">Personal Note:</p>
                        <p className="text-sm">{fb.personal_message}</p>
                      </div>
                    )}

                    {/* Score */}
                    {fb.ai_analysis?.overallScore && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="font-semibold">
                          Overall Score: {fb.ai_analysis.overallScore}/100
                        </span>
                      </div>
                    )}

                    {/* Strengths / Improvements */}
                    {(fb.ai_analysis?.strengths || fb.ai_analysis?.improvements) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fb.ai_analysis.strengths && (
                          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                            <h4 className="font-medium text-sm mb-2 text-green-700 dark:text-green-400">
                              Strengths
                            </h4>
                            <ul className="text-sm space-y-1">
                              {fb.ai_analysis.strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {fb.ai_analysis.improvements && (
                          <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
                            <h4 className="font-medium text-sm mb-2 text-orange-700 dark:text-orange-400">
                              Areas to Improve
                            </h4>
                            <ul className="text-sm space-y-1">
                              {fb.ai_analysis.improvements.map((s, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <TrendingUp className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tasks Tab ── */}
        <TabsContent value="tasks" className="space-y-6">
          <StudentActionItemsSection />
        </TabsContent>

        {/* ── Messages Tab ── */}
        <TabsContent value="messages" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Messages with Counselor</h2>
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Start a Conversation</h3>
                <p className="text-muted-foreground mb-4">
                  Send a message to your counselor for help with essays, applications, or any
                  questions.
                </p>
                <Button onClick={() => navigate('/student-messages')}>
                  Check if you have messages
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Applications Tab ── */}
        <TabsContent value="applications" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Applications</h2>
            <Button onClick={() => navigate('/add-application')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </Button>
          </div>

          {isLoadingApplications ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : applications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No applications yet.</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/add-application')}>
                  Add Your First Application
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {applications.map((app) => (
                <Card
  key={app.id}
  className="border-l-4 border-l-primary/30 cursor-pointer hover:shadow-md transition-all"
  onClick={() => setSelectedApplication(app as ApplicationWithProfile)}
>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{app.school_name}</h3>
                        {app.program && (
                          <p className="text-sm text-muted-foreground">{app.program}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Deadline: {new Date(app.deadline_date).toLocaleDateString()}
                          </span>
                          <span>
                            Essays: {app.completed_essays}/{app.required_essays}
                          </span>
                          <span>
                            Recs: {app.recommendations_submitted}/{app.recommendations_requested}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getStatusColor(app.status)}>
                          {getStatusIcon(app.status)}
                          <span className="ml-1 capitalize">{getStatusLabel(app.status)}</span>
                        </Badge>
                        <span className="text-sm font-medium text-primary">
                          {app.completion_percentage}% complete
                        </span>
                        {app.urgent && (
                          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                            ⚠ Urgent
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress value={app.completion_percentage} className="mt-3 h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <ApplicationDetailModal
  application={selectedApplication}
  open={!!selectedApplication}
  onClose={() => setSelectedApplication(null)}
/>
      </Tabs>

      {/* ── Essay Detail Modal ── */}
      <Dialog open={!!selectedEssay} onOpenChange={() => { setSelectedEssay(null); setHoveredFeedbackId(null); }}>
        <DialogContent className="max-w-[95vw] w-[1200px] h-[88vh] p-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg">{selectedEssay?.essay_title}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(selectedEssay?.created_at ?? "").toLocaleDateString()}
                </p>
              </div>
              <Badge className={getStatusColor(selectedEssay?.status ?? "")}>
                {getStatusIcon(selectedEssay?.status ?? "")}
                <span className="ml-1 capitalize">{getStatusLabel(selectedEssay?.status ?? "")}</span>
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 flex overflow-hidden">

            {/* ── Left sidebar: score + criteria ── */}
            {essayFeedback.some(fb => fb.ai_analysis?.overallScore) && (
              <div className="w-[140px] shrink-0 border-r flex flex-col gap-4 p-4 overflow-y-auto">
                {essayFeedback.map(fb => fb.ai_analysis?.overallScore ? (
                  <div key={fb.id}>
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 mb-3">
                      <CardContent className="p-3 text-center">
                        <Star className="h-4 w-4 text-primary mx-auto mb-1" />
                        <div className="text-2xl font-bold text-primary">{fb.ai_analysis!.overallScore}</div>
                        <div className="text-[10px] text-muted-foreground">/100</div>
                      </CardContent>
                    </Card>
                    {Array.isArray(fb.ai_analysis?.criteria) && fb.ai_analysis!.criteria.map((c: any) => (
                      <div key={c.id} className="space-y-1 mb-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                          <span className="text-[10px] text-muted-foreground truncate">{c.name?.split(' & ')[0]}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Progress value={c.score} className="h-1.5 flex-1" />
                          <span className="text-[10px] font-medium w-5 text-right">{c.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null)}
              </div>
            )}

            {/* ── Center: essay with tracked changes ── */}
            <div className="flex-1 flex flex-col min-w-0 border-r">
              {selectedEssay?.essay_prompt && (
                <div className="px-5 py-3 border-b bg-muted/30 shrink-0">
                  <p className="text-xs text-muted-foreground font-medium">Prompt</p>
                  <p className="text-xs mt-0.5">{selectedEssay.essay_prompt}</p>
                </div>
              )}
              {trackedChanges.length > 0 && (
                <div className="px-5 py-2 border-b bg-muted/20 shrink-0">
                  <p className="text-xs text-muted-foreground">
                    Your counselor suggested edits are shown inline —{" "}
                    <del className="text-red-500">original</del>{" "}
                    <ins className="text-green-700 no-underline font-medium">replacement</ins>
                  </p>
                </div>
              )}
              <ScrollArea className="flex-1">
                <div className="p-5">
                  {selectedEssay?.essay_content ? (
                    <div className="space-y-0">
                      {paragraphData.map((para) => {
                        const paraChanges = paragraphChangeMap.get(para.index) ?? [];
                        return (
                          <div key={para.index} className="min-h-[1.5em]">
                            <div className="text-sm leading-relaxed text-foreground">
                              {para.text.trim() === ''
                                ? <span>&nbsp;</span>
                                : renderParagraph(para.text, para.start, paraChanges)
                              }
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No content yet.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* ── Right: feedback panel ── */}
            <div className="w-[320px] shrink-0 flex flex-col">
              <div className="px-4 py-3 border-b bg-primary/5 shrink-0">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Counselor Feedback
                </h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  {essayFeedback.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No feedback yet</p>
                      <p className="text-xs mt-1">Your counselor will review your essay soon</p>
                    </div>
                  ) : (
                    essayFeedback.map((fb) => (
                      <div key={fb.id} className="space-y-2">

                        {/* Personal note */}
                        {fb.personal_message && (
                          <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
                            <p className="text-xs font-semibold text-primary mb-1">Personal Note</p>
                            <p className="text-xs">{fb.personal_message}</p>
                          </div>
                        )}

                        {/* Tracked changes list */}
                        {fb.track_changes?.length > 0 && (
                          <div className="rounded-xl border p-3 space-y-2 bg-muted/20">
                            <p className="text-xs font-semibold flex items-center gap-1.5">
                              <Strikethrough className="h-3.5 w-3.5" />
                              Suggested Edits ({fb.track_changes.length})
                            </p>
                            {fb.track_changes.map((change) => (
                              <div key={change.id} className="space-y-0.5 text-xs border-t pt-1.5 border-border/50">
                                <del className="text-red-500 line-through block">{change.originalText}</del>
                                <ins className="text-green-700 no-underline block font-medium">{change.suggestedText}</ins>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Counselor-added feedback items only */}
                        {fb.feedback_items.map((item, idx) => (
                          <div
                            key={item.id ?? idx}
                            className="p-2.5 rounded-xl border border-border bg-muted/30 space-y-0.5"
                          >
                            {item.criterionName && (
                              <p className="text-[10px] font-medium text-muted-foreground">{item.criterionName}</p>
                            )}
                            <p className="text-xs leading-snug">{item.text}</p>
                          </div>
                        ))}

                        <p className="text-[10px] text-muted-foreground text-right pt-1">
                          Received: {fb.sent_at ? new Date(fb.sent_at).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="p-4 border-t flex gap-2">
           <Button 
    className="flex-1"
    onClick={() => {
      const id = selectedEssay?.id;
      setSelectedEssay(null);
      navigate(`/edit-essay?id=${id}`);
    }}
  >
    <FileText className="h-4 w-4 mr-2" />
    Edit Essay
  </Button>
  <Button variant="outline" className="flex-1">
    <History className="h-4 w-4 mr-2" />
    View History
  </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentPersonalArea;