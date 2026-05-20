import { useState, useEffect, useRef } from "react";
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
  Hash,
  AlignLeft,
  Loader2,
  CheckCircle,
  Sparkles,
  RefreshCw,
  MessageSquare,
  X,
  ScanText,
  Send,
  Users,
  GraduationCap,
} from "lucide-react";

const SUPABASE_URL = "https://fkvfngdwblbalrompzdj.supabase.co";
const WORD_LIMIT_OPTIONS = [250, 500, 650, 750, 1000];

const PersonalEssay = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const urlDraftId = searchParams.get("draftId");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [counselorId, setCounselorId] = useState<string | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(urlDraftId);

  const [title, setTitle] = useState("Common App Personal Statement");
  const [prompt, setPrompt] = useState("");
  const [content, setContent] = useState("");
  const [wordLimit, setWordLimit] = useState<number | null>(650);
  const [customWordLimit, setCustomWordLimit] = useState("");

  const wordCount = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
  const effectiveWordLimit = wordLimit ?? (customWordLimit ? parseInt(customWordLimit) : null);
  const isOverLimit = effectiveWordLimit ? wordCount > effectiveWordLimit : false;

  const [selectedText, setSelectedText] = useState("");
  const [selectionFeedback, setSelectionFeedback] = useState<string | null>(null);
  const [isCoaching, setIsCoaching] = useState(false);

  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);

  const [recipient, setRecipient] = useState<'counselor' | 'teacher' | 'both'>('counselor');
  const [teachers, setTeachers] = useState<{ user_id: string; full_name: string }[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounselorAndTeachers = async () => {
      const { data: anyRole } = await supabase.rpc("get_any_counselor_id");
      if (anyRole) setCounselorId(anyRole);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const schoolId = profileData?.school_id;
      if (schoolId) {
        const { data: teacherRows } = await (supabase as any)
          .from("teacher_profiles")
          .select("user_id")
          .eq("school_id", schoolId);

        if (teacherRows && teacherRows.length > 0) {
          const teacherIds = teacherRows.map((t: any) => t.user_id);
          const { data: teacherProfilesData } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", teacherIds);
          if (teacherProfilesData) setTeachers(teacherProfilesData as any);
        }
      }
    };
    fetchCounselorAndTeachers();

    const cached = sessionStorage.getItem("pe_initial_suggestions");
    if (cached) {
      setSuggestions(cached);
      setHasFetchedOnce(true);
    } else {
      fetchSuggestions(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!urlDraftId) return;
    const loadDraft = async () => {
      const { data, error } = await (supabase
        .from("essay_feedback")
        .select("essay_title, essay_prompt, essay_content, word_limit, status")
        .eq("id", urlDraftId)
        .single() as any);
      if (error || !data || data.status !== "draft") return;
      setTitle(data.essay_title ?? "Common App Personal Statement");
      setPrompt(data.essay_prompt ?? "");
      setContent(data.essay_content ?? "");
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

  const fetchSuggestions = async (withContent = false) => {
    setIsLoadingSuggestions(true);
    setSuggestions(null);
    setIsAnalysisMode(withContent);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/student-ai-helper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          essayContent: withContent ? content.trim() : null,
          essayPrompt: prompt.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.suggestions ?? null;
        setSuggestions(text);
        if (!withContent && text) sessionStorage.setItem("pe_initial_suggestions", text);
      } else {
        toast.error("Couldn't load AI suggestions. Try refreshing.");
      }
    } catch {
      toast.error("Couldn't reach the AI assistant right now.");
    } finally {
      setIsLoadingSuggestions(false);
      setHasFetchedOnce(true);
    }
  };

  const handleAnalyzeEssay = () => fetchSuggestions(true);

  const handleSelectionChange = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value.substring(start, end).trim();
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

  const handleSaveDraft = async () => {
    if (!title.trim()) { toast.error("Please add a title before saving"); return; }
    setIsSavingDraft(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        student_id: user.id,
        counselor_id: counselorId,
        essay_title: title.trim(),
        essay_prompt: prompt.trim() || null,
        essay_content: content.trim(),
        word_limit: effectiveWordLimit || null,
        status: "draft",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim())   { toast.error("Please add an essay title");         return; }
    if (!content.trim()) { toast.error("Please add your essay content");     return; }
    if (isOverLimit)     { toast.error("Your essay exceeds the word limit"); return; }
    if ((recipient === 'counselor' || recipient === 'both') && !counselorId) {
      toast.error("No counselor found. Please contact support.");
      return;
    }
    if ((recipient === 'teacher' || recipient === 'both') && !selectedTeacherId) {
      toast.error("Please select a teacher to send to.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let essayId: string | null = currentDraftId;

      if (currentDraftId) {
        const { error } = await (supabase
          .from("essay_feedback")
          .update({
            essay_title:   title.trim(),
            essay_prompt:  prompt.trim() || null,
            essay_content: content.trim(),
            status:        "pending",
          } as any)
          .eq("id", currentDraftId) as any);
        if (error) throw error;
      } else {
        const { data: essayData, error } = await supabase
          .from("essay_feedback")
          .insert({
            student_id:    user.id,
            counselor_id:  recipient === 'teacher' ? null : counselorId,
            essay_title:   title.trim(),
            essay_prompt:  prompt.trim() || null,
            essay_content: content.trim(),
            status:        "pending",
          })
          .select()
          .single();
        if (error) throw error;
        essayId = essayData?.id ?? null;
      }

      if ((recipient === 'teacher' || recipient === 'both') && selectedTeacherId && essayId) {
        const { error: shareError } = await (supabase as any)
          .from("essay_teacher_shares")
          .insert({
            essay_feedback_id: essayId,
            teacher_id:        selectedTeacherId,
            student_id:        user.id,
          });
        if (shareError) console.error("Failed to share with teacher:", shareError);
      }

      setIsSuccess(true);
      toast.success("Essay submitted successfully!");

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if ((recipient === 'counselor' || recipient === 'both') && counselorId) {
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
              essayLabel:      title.trim(),
              appUrl:          window.location.origin,
            }),
          });
        }
      } catch (notifyError) {
        console.error("Failed to send essay notification:", notifyError);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit essay");
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseSuggestions = (raw: string) => {
    return raw.split(/\n(?=\*\*)/).map(b => b.trim()).filter(Boolean);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Essay Submitted!</h2>
            <p className="text-muted-foreground mt-2">
              {recipient === 'teacher'
                ? "Your teacher has received your personal essay and will review it soon."
                : recipient === 'both'
                ? "Your counselor and teacher have both received your personal essay."
                : "Your counselor has received your personal essay and will review it soon."}
            </p>
          </div>
          <Button onClick={() => navigate("/student-personal-area?tab=essays")} className="w-full">
            Back to My Work
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex items-center gap-4">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-primary" />
            Personal Essay
          </h1>
          <p className="text-muted-foreground mt-1">
            Write your Common App personal statement with AI coaching tailored to your story.
          </p>
        </div>

        <div className="grid grid-cols-[1fr_380px] gap-6 items-start">

          {/* Left: form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  Essay Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Essay Title</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Common App Personal Statement"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt">
                    Essay Prompt{" "}
                    <span className="text-muted-foreground text-xs">(optional — paste for more targeted AI suggestions)</span>
                  </Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Some students have a background, identity, interest, or talent so meaningful they believe their application would be incomplete without it..."
                    className="resize-none min-h-[80px] text-sm"
                  />
                </div>
              </CardContent>
            </Card>

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

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlignLeft className="h-5 w-5 text-primary" />
                    Essay Content <span className="text-destructive ml-1">*</span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={isOverLimit ? "text-destructive border-destructive" : "text-muted-foreground"}
                    >
                      {wordCount} {effectiveWordLimit ? `/ ${effectiveWordLimit}` : ""} words
                    </Badge>
                    {isOverLimit && <Badge variant="destructive">Over limit</Badge>}
                    {wordCount >= 200 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAnalyzeEssay}
                        disabled={isLoadingSuggestions}
                        className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                      >
                        {isLoadingSuggestions && isAnalysisMode ? (
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
                  placeholder="Start writing your personal statement here..."
                  className={`resize-none min-h-[420px] text-sm leading-relaxed ${
                    isOverLimit ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  required
                />

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

            {/* Recipient */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Send className="h-5 w-5 text-primary" />
                  Send To
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  {([
                    { value: 'counselor', label: 'My Counselor', icon: GraduationCap },
                    { value: 'teacher',   label: 'A Teacher',    icon: Users },
                    { value: 'both',      label: 'Both',         icon: Send },
                  ] as const).map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRecipient(value)}
                      className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-sm font-medium transition-all ${
                        recipient === value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-muted/30 hover:bg-muted/60 text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {(recipient === 'teacher' || recipient === 'both') && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-muted-foreground font-medium">Select teacher</p>
                    {teachers.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No teachers found at your school. Ask your counselor to add one.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {teachers.map((t) => (
                          <button
                            key={t.user_id}
                            type="button"
                            onClick={() => setSelectedTeacherId(t.user_id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                              selectedTeacherId === t.user_id
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            {t.full_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

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

          {/* Right: AI assistant panel (always visible) */}
          <div className="sticky top-6 space-y-3">
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {isAnalysisMode ? "Essay Analysis" : "AI Essay Coach - Initial Suggestions"}
                  </CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => fetchSuggestions(isAnalysisMode)}
                    disabled={isLoadingSuggestions}
                    className="gap-1.5 h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isLoadingSuggestions ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    {hasFetchedOnce && !isLoadingSuggestions ? "Refresh" : ""}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isAnalysisMode
                    ? "Feedback on your current draft based on your profile."
                    : "Personalised opening ideas based on your profile. Add your essay prompt above for more targeted suggestions."}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoadingSuggestions && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground text-center">
                      {isAnalysisMode ? "Bear with us, analysing your essay…" : "Bear with us, crafting your suggestions…"}
                    </p>
                  </div>
                )}

                {!isLoadingSuggestions && suggestions && (() => {
                  const blocks = parseSuggestions(suggestions);
                  const hasSuggestionFormat = blocks.some(b => /^\*\*/.test(b));

                  if (!hasSuggestionFormat) {
                    // Freeform "great job" response
                    return (
                      <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                          <p className="text-sm font-semibold text-green-700 dark:text-green-400">Looking great!</p>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                          {suggestions}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {blocks.map((block, i) => {
                        const titleMatch = block.match(/^\*\*(.+?)\*\*/);
                        const blockTitle = titleMatch ? titleMatch[1] : null;
                        const body = block.replace(/^\*\*(.+?)\*\*\n?/, "").trim();
                        return (
                          <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
                            {blockTitle && (
                              <p className="text-sm font-semibold text-primary">{blockTitle}</p>
                            )}
                            <p className="text-xs text-foreground leading-relaxed">{body}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {!isLoadingSuggestions && !suggestions && hasFetchedOnce && (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-sm text-muted-foreground">Couldn't load suggestions right now.</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => fetchSuggestions(false)}>
                      Try again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {content.trim().length > 50 && (
              <p className="text-xs text-muted-foreground text-center px-2">
                Click "Refresh" to get updated suggestions based on what you've written so far.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PersonalEssay;
