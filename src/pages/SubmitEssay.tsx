import { useState, useEffect, useRef } from "react";
import { useCelebration } from "@/hooks/useCelebration";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import {
  ArrowLeft,
  FileText,
  BookOpen,
  School,
  AlignLeft,
  Hash,
  Loader2,
  CheckCircle,
  Sparkles,
  ScanText,
  MessageSquare,
  X,
} from "lucide-react";

const SUPABASE_URL = "https://fkvfngdwblbalrompzdj.supabase.co";
const WORD_LIMIT_OPTIONS = [250, 500, 650, 750, 1000];

interface CriterionScore {
  id: string;
  name: string;
  score: number;
  color: string;
}

interface AnalysisIssue {
  id: string;
  criterionName: string;
  color: string;
  highlightedText: string;
  problemType: string;
  problemDescription: string;
  recommendation: string;
  severity: "low" | "medium" | "high";
}

interface AnalysisResult {
  overallScore: number;
  criteria: CriterionScore[];
  issues: AnalysisIssue[];
}

const SubmitEssay = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { celebrate, activeEvent } = useCelebration();

  const slotId        = searchParams.get("slotId");
  const applicationId = searchParams.get("applicationId");
  const slotLabel     = searchParams.get("label");
  const slotPrompt    = searchParams.get("prompt");
  const slotWordLimit = searchParams.get("wordLimit");
  const urlDraftId    = searchParams.get("draftId");
  const urlSchoolName = searchParams.get("schoolName");

  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSuccess, setIsSuccess]         = useState(false);
  const [counselorId, setCounselorId]     = useState<string | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(urlDraftId);

  // Form fields
  const [title, setTitle]               = useState(slotLabel ?? "");
  const [prompt, setPrompt]             = useState(slotPrompt ?? "");
  const [content, setContent]           = useState("");
  const [targetSchool, setTargetSchool] = useState(urlSchoolName ?? "");
  const [wordLimit, setWordLimit]       = useState<number | null>(
    slotWordLimit ? parseInt(slotWordLimit) : null
  );
  const [customWordLimit, setCustomWordLimit] = useState("");

  // Word count
  const wordCount          = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
  const effectiveWordLimit = wordLimit ?? (customWordLimit ? parseInt(customWordLimit) : null);
  const isOverLimit        = effectiveWordLimit ? wordCount > effectiveWordLimit : false;

  // Selection-based coaching
  const [selectedText, setSelectedText]         = useState("");
  const [selectionFeedback, setSelectionFeedback] = useState<string | null>(null);
  const [isCoaching, setIsCoaching]             = useState(false);

  // Full essay analysis
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalysing, setIsAnalysing]       = useState(false);

  
  useEffect(() => {
  const fetchCounselor = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: assignment, error } = await supabase
      .from("student_counselor_assignments")
      .select("counselor_id")
      .eq("student_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching counselor assignment:", error);
      return;
    }

    if (assignment?.counselor_id) {
      setCounselorId(assignment.counselor_id);
    } else {
      console.warn("No counselor assigned to this student");
    }
  };

  fetchCounselor();
}, []);

  useEffect(() => {
    
    if (!urlDraftId) return;
    const loadDraft = async () => {
      const { data, error } = await (supabase
        .from("essay_feedback")
        .select("essay_title, essay_prompt, essay_content, target_school, word_limit, status")
        .eq("id", urlDraftId)
        .single() as any);
      if (error || !data || data.status !== "draft") return;
      setTitle(data.essay_title ?? "");
      setPrompt(data.essay_prompt ?? "");
      setContent(data.essay_content ?? "");
      setTargetSchool(data.target_school ?? "");
      const wl = data.word_limit as number | null;
      if (wl && WORD_LIMIT_OPTIONS.includes(wl)) {
        setWordLimit(wl);
      } else if (wl) {
        setWordLimit(null);
        setCustomWordLimit(String(wl));
      }
    };
    loadDraft();
  }, [urlDraftId]);

  // ── Save draft ────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!title.trim()) { toast.error("Please add a title before saving"); return; }

    setIsSavingDraft(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        student_id:    user.id,
        counselor_id:  counselorId,
        essay_title:   title.trim(),
        essay_prompt:  prompt.trim() || null,
        essay_content: content.trim(),
        target_school: targetSchool.trim() || null,
        word_limit:    effectiveWordLimit || null,
        status:        "draft",
      };

      if (currentDraftId) {
        const { error } = await (supabase
          .from("essay_feedback")
          .update(payload as any)
          .eq("id", currentDraftId) as any);
        if (error) throw error;
      } else {
        const { data: draft, error } = await (supabase
          .from("essay_feedback")
          .insert(payload as any)
          .select("id")
          .single() as any);
        if (error) throw error;
        setCurrentDraftId(draft.id);
      }

      toast.success("Draft saved! Continue anytime from My Work → Essays.");
      navigate("/student-personal-area?tab=essays");
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // ── Text selection handler ────────────────────────────────
  const handleSelectionChange = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const text  = el.value.substring(start, end).trim();
    if (text.length > 20) {
      setSelectedText(text);
      setSelectionFeedback(null);
    } else {
      setSelectedText("");
    }
  };

  const handleGetCoaching = async () => {
    if (!selectedText) return;
    setIsCoaching(true);
    setSelectionFeedback(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/coach-essay-section`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ selectedText, essayPrompt: prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectionFeedback(data.feedback ?? null);
      }
    } catch {
      toast.error("Couldn't fetch coaching right now. Try again.");
    } finally {
      setIsCoaching(false);
    }
  };

  // ── Full essay analysis ───────────────────────────────────
  const handleAnalyseEssay = async () => {
    if (!content.trim()) return;
    setIsAnalysing(true);
    setAnalysisResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-essay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ essayContent: content, prompt }),
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

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim())   { toast.error("Please add an essay title");         return; }
    if (!content.trim()) { toast.error("Please add your essay content");     return; }
    if (isOverLimit)     { toast.error("Your essay exceeds the word limit"); return; }
    if (!counselorId)    { toast.error("No counselor found. Please contact support."); return; }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const essayTitle = targetSchool.trim()
        ? `${title.trim()} — ${targetSchool.trim()}`
        : title.trim();

      let essayId: string | null = currentDraftId;

      if (currentDraftId) {
        // Promote existing draft to submitted
        const { error } = await (supabase
          .from("essay_feedback")
          .update({
            essay_title:   essayTitle,
            essay_prompt:  prompt.trim() || null,
            essay_content: content.trim(),
            target_school: targetSchool.trim() || null,
            status:        "pending",
          } as any)
          .eq("id", currentDraftId) as any);
        if (error) throw error;
      } else {
        const { data: essayData, error: essayError } = await supabase
          .from("essay_feedback")
          .insert({
            student_id:    user.id,
            counselor_id:  counselorId,
            essay_title:   essayTitle,
            essay_prompt:  prompt.trim() || null,
            essay_content: content.trim(),
            status:        "pending",
          })
          .select()
          .single();
        if (essayError) throw essayError;
        essayId = essayData?.id ?? null;
      }

      if (slotId && essayId) {
        const { error: slotError } = await supabase
          .from("application_essays")
          .update({
            essay_feedback_id: essayId,
            status:            "draft",
            updated_at:        new Date().toISOString(),
          })
          .eq("id", slotId);

        if (slotError) console.error("Failed to link essay to slot:", slotError);
      }

      setIsSuccess(true);
      toast.success("Essay submitted successfully!");
      celebrate('essay_submitted');

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const [{ data: studentProfile }, { data: counselorProfile }] = await Promise.all([
          supabase.from("profiles").select("full_name, email").eq("user_id", user.id).maybeSingle(),
          supabase.from("profiles").select("full_name, email").eq("user_id", counselorId).maybeSingle(),
        ]);

        await fetch(`${SUPABASE_URL}/functions/v1/send-new-essay-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            counselorEmail:  counselorProfile?.email || "no-email@unknown.com",
            counselorName:   counselorProfile?.full_name || "Counselor",
            studentName:     studentProfile?.full_name || "Your student",
            essayLabel:      essayTitle,
            applicationName: targetSchool.trim() || (slotLabel ?? undefined),
            appUrl:          window.location.origin,
          }),
        });
      } catch (notifyError) {
        console.error("Failed to send essay notification:", notifyError);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit essay");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success ───────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-6">
        <CelebrationOverlay event={activeEvent} />
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Essay Submitted!</h2>
            <p className="text-muted-foreground mt-2">
              {slotId
                ? "Your essay has been linked to your application. Your counselor will review it soon."
                : "Your counselor has received your essay and will review it soon."}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() =>
                applicationId ? navigate(`/student-personal-area?tab=applications`) : navigate(-1)
              }
              className="w-full"
            >
              {applicationId ? "Back to Applications" : "Back to My Work"}
            </Button>
            {!slotId && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsSuccess(false);
                  setTitle("");
                  setPrompt("");
                  setContent("");
                  setTargetSchool("");
                  setWordLimit(null);
                  setCustomWordLimit("");
                  setAnalysisResult(null);
                  setSelectedText("");
                  setSelectionFeedback(null);
                }}
              >
                Submit Another Essay
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const showAnalysisPanel = analysisResult !== null || isAnalysing;

  // ── Form ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-6">
      <div className={`mx-auto space-y-6 transition-all duration-300 ${showAnalysisPanel ? "max-w-6xl" : "max-w-3xl"}`}>

        <div className="flex items-center gap-4">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Submit an Essay</h1>
          <p className="text-muted-foreground mt-1">
            {slotId
              ? `Writing for: ${slotLabel}`
              : "Your counselor will review and provide feedback"}
          </p>
          {slotId && (
            <Badge variant="outline" className="mt-2">Linked to application slot</Badge>
          )}
        </div>

        <div className={`gap-6 ${showAnalysisPanel ? "grid grid-cols-[1fr_380px]" : ""}`}>

          {/* ── Left column: form ── */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Essay Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  Essay Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Essay Title <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Common App Personal Statement"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetSchool">Target School</Label>
                  {slotId && urlSchoolName ? (
                    <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted/40 text-sm">
                      <School className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{urlSchoolName}</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="targetSchool"
                        value={targetSchool}
                        onChange={(e) => setTargetSchool(e.target.value)}
                        placeholder="e.g. MIT, Harvard, Stanford..."
                        className="pl-10"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Word Limit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Hash className="h-5 w-5 text-primary" />
                  Word Limit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {WORD_LIMIT_OPTIONS.map((limit) => (
                    <button
                      key={limit}
                      type="button"
                      onClick={() => { setWordLimit(limit); setCustomWordLimit(""); }}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        wordLimit === limit
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted/30 hover:bg-muted/60 text-foreground"
                      }`}
                    >
                      {limit} words
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setWordLimit(null)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      wordLimit === null && !customWordLimit
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted/30 hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    No limit
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Or custom:</span>
                  <Input
                    type="number"
                    placeholder="e.g. 800"
                    value={customWordLimit}
                    onChange={(e) => { setCustomWordLimit(e.target.value); setWordLimit(null); }}
                    className="w-32"
                    min="1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Essay Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlignLeft className="h-5 w-5 text-primary" />
                    Essay Content <span className="text-destructive">*</span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={isOverLimit ? "text-destructive border-destructive" : "text-muted-foreground"}
                    >
                      {wordCount} {effectiveWordLimit ? `/ ${effectiveWordLimit}` : ""} words
                    </Badge>
                    {isOverLimit && <Badge variant="destructive">Over limit</Badge>}
                    {wordCount >= 50 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAnalyseEssay}
                        disabled={isAnalysing}
                        className="gap-1.5"
                      >
                        {isAnalysing ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Analysing…
                          </>
                        ) : (
                          <>
                            <ScanText className="h-3.5 w-3.5" />
                            Analyse Essay
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">

                <p className="text-xs text-muted-foreground">
                  Tip: highlight any passage to get AI coaching on that section.
                </p>

                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onMouseUp={handleSelectionChange}
                  onKeyUp={handleSelectionChange}
                  placeholder="Write or paste your essay here..."
                  className={`resize-none min-h-[400px] text-sm leading-relaxed ${
                    isOverLimit ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  required
                />

                {/* Selection coaching bar */}
                {selectedText && (
                  <div className="border border-primary/20 rounded-lg bg-primary/5 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-sm font-medium text-foreground">
                          "{selectedText.length > 60 ? selectedText.slice(0, 60) + "…" : selectedText}"
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleGetCoaching}
                          disabled={isCoaching}
                          className="gap-1.5 h-7 text-xs"
                        >
                          {isCoaching ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Bear with us…
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3" />
                              Get Feedback
                            </>
                          )}
                        </Button>
                        <button
                          type="button"
                          onClick={() => { setSelectedText(""); setSelectionFeedback(null); }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {selectionFeedback && (
                      <div className="pt-1 border-t border-primary/10">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                          {selectionFeedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3 pb-6">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-primary/30 text-primary hover:bg-primary/5"
                disabled={isSavingDraft || isSubmitting}
                onClick={handleSaveDraft}
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Save & Continue Later
                  </>
                )}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting || isSavingDraft || isOverLimit}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Essay
                  </>
                )}
              </Button>
            </div>

          </form>

          {/* ── Right column: analysis panel ── */}
          {showAnalysisPanel && (
            <div className="space-y-4">
              <div className="flex items-center justify-between sticky top-6">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <ScanText className="h-4 w-4 text-primary" />
                  Essay Analysis
                </h2>
                <button
                  type="button"
                  onClick={() => setAnalysisResult(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {isAnalysing && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground text-center">
                      Bear with us, analysing your essay…
                    </p>
                  </CardContent>
                </Card>
              )}

              {analysisResult && (
                <>
                  {/* Overall score */}
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-foreground">Overall Score</span>
                        <span className="text-2xl font-bold text-primary">
                          {analysisResult.overallScore}
                          <span className="text-sm font-normal text-muted-foreground">/100</span>
                        </span>
                      </div>
                      <div className="space-y-2">
                        {analysisResult.criteria.map((c) => (
                          <div key={c.id}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{c.name}</span>
                              <span className="font-medium">{c.score}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${c.score}%`, backgroundColor: c.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Issues */}
                  <div className="space-y-2">
                    {analysisResult.issues.map((issue) => (
                      <Card key={issue.id} className="overflow-hidden">
                        <div className="h-1 w-full" style={{ backgroundColor: issue.color }} />
                        <CardContent className="pt-3 pb-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold" style={{ color: issue.color }}>
                              {issue.criterionName}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                issue.severity === "high"
                                  ? "border-destructive text-destructive"
                                  : issue.severity === "medium"
                                  ? "border-amber-500 text-amber-600"
                                  : "border-muted-foreground text-muted-foreground"
                              }`}
                            >
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-xs font-medium text-foreground">{issue.problemType}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {issue.problemDescription}
                          </p>
                          <div className="pt-1 border-t border-border">
                            <p className="text-xs text-foreground leading-relaxed">
                              <span className="font-medium">Suggestion: </span>
                              {issue.recommendation}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SubmitEssay;
