import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCelebration } from "@/hooks/useCelebration";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useStudentRecommendations } from "@/hooks/useRecommendationRequests";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText,
  CheckCircle,
  Clock,
  Send,
  User,
  Award,
  Sparkles,
  ChevronRight,
  Loader2,
  AlertCircle,
  Mail,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type RecommendationRequest = Database["public"]["Tables"]["recommendation_requests"]["Row"];

const STRENGTH_OPTIONS = [
  "Analytical thinking",
  "Creativity",
  "Leadership",
  "Teamwork",
  "Curiosity",
  "Discipline",
  "Empathy",
  "Initiative",
  "Problem-solving",
  "Communication",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_FORM = {
  refereeName: "",
  refereeEmail: "",
  refereeRole: "",
  relationshipDuration: "",
  relationshipCapacity: "",
  meaningfulProject: "",
  bestMoment: "",
  difficultiesOvercome: "",
  strengths: [] as string[],
  personalNotes: "",
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "sent":
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Received
        </Badge>
      );
    case "in_progress":
      return (
        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <Clock className="h-3 w-3 mr-1" />
          Pending Review
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <FileText className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      );
  }
};

const StudentRecommendationLetters = () => {
  const { requests, isLoading, error, createRequest } = useStudentRecommendations();
  const { celebrate, activeEvent } = useCelebration();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<"list" | "form" | "view">(
    searchParams.get("step") === "form" ? "form" : "list"
  );
  const [selectedRequest, setSelectedRequest] = useState<RecommendationRequest | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const handleStrengthToggle = (strength: string) => {
    setFormData((prev) => ({
      ...prev,
      strengths: prev.strengths.includes(strength)
        ? prev.strengths.filter((s) => s !== strength)
        : [...prev.strengths, strength],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.refereeName || !formData.refereeRole || !formData.relationshipDuration) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }
    if (!formData.refereeEmail || !EMAIL_RE.test(formData.refereeEmail)) {
      toast.error("Please enter a valid teacher email address");
      return;
    }

    try {
      const result = await createRequest.mutateAsync({
        referee_name: formData.refereeName,
        referee_role: formData.refereeRole,
        relationship_duration: formData.relationshipDuration,
        relationship_capacity: formData.relationshipCapacity,
        meaningful_project: formData.meaningfulProject,
        best_moment: formData.bestMoment,
        difficulties_overcome: formData.difficultiesOvercome,
        strengths: formData.strengths,
        personal_notes: formData.personalNotes,
        status: "pending",
        student_id: "",
        teacher_email: formData.refereeEmail,
      } as any);

      // Notify the teacher via email with their private portal link
      const token = (result as any)?.teacher_token;
      if (token) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user!.id)
          .single();
        const studentName = profile?.full_name || user?.email || "A student";
        const teacherUrl = `${window.location.origin}/teacher-rec/${token}`;

        await supabase.functions.invoke("notify-teacher-request", {
          body: {
            teacherEmail: formData.refereeEmail,
            teacherName: formData.refereeName,
            studentName,
            teacherUrl,
          },
        });
      }

      setFormData(INITIAL_FORM);
      setCurrentStep("list");
    } catch (err) {
      // Error toast is already handled in the hook's onError
      console.error("Error submitting recommendation request:", err);
    }
  };

  // ── Loading state ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center h-96 gap-3 text-destructive">
        <AlertCircle className="h-6 w-6" />
        <p>Failed to load recommendation requests. Please refresh and try again.</p>
      </div>
    );
  }

  // ── View Letter ───────────────────────────────────────────
  if (currentStep === "view" && selectedRequest) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => {
            setCurrentStep("list");
            setSelectedRequest(null);
          }}
        >
          ← Back to Letters
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Recommendation Letter</CardTitle>
                <p className="text-muted-foreground mt-1">From {selectedRequest.referee_name}</p>
              </div>
              {getStatusBadge(selectedRequest.status)}
            </div>
          </CardHeader>
          <CardContent>
            {selectedRequest.status === 'sent' ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                <h2 className="text-xl font-semibold text-foreground">Recommendation Submitted</h2>
                <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
                  Your recommendation letter from <strong>{selectedRequest.referee_name}</strong> has been
                  finalized by your counselor and submitted on your behalf.
                </p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your recommendation letter is being prepared.</p>
                <p className="text-sm mt-2">You will be notified once it's ready.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Questionnaire Form ────────────────────────────────────
  if (currentStep === "form") {
    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => setCurrentStep("list")}>
          ← Back to Letters
        </Button>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold text-foreground mb-3">
              You are one step away from your recommendation letter
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              To make this recommendation as accurate and personal as possible, please complete the
              short questionnaire below. Your answers will help your counselor write the strongest
              letter on your behalf.
            </p>
          </CardContent>
        </Card>

        {/* Section 1: Referee Context */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Referee Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="refereeName">Who is this referee? *</Label>
              <Input
                id="refereeName"
                placeholder="Full name, role, subject taught or position at school"
                value={formData.refereeName}
                onChange={(e) => setFormData({ ...formData, refereeName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="refereeEmail" className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-primary" />
                Teacher's email address *
              </Label>
              <Input
                id="refereeEmail"
                type="email"
                placeholder="e.g. j.smith@school.edu"
                value={formData.refereeEmail}
                onChange={(e) => setFormData({ ...formData, refereeEmail: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                We'll send them a notification with a private link to write your letter.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refereeRole">Their role/position *</Label>
              <Input
                id="refereeRole"
                placeholder="e.g., AP Physics Teacher, Math Department Head"
                value={formData.refereeRole}
                onChange={(e) => setFormData({ ...formData, refereeRole: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationshipDuration">
                How long have you known them and in what capacity? *
              </Label>
              <Textarea
                id="relationshipDuration"
                placeholder="e.g., taught me in Grade 11–12 Math, thesis supervisor, homeroom teacher"
                value={formData.relationshipDuration}
                onChange={(e) => setFormData({ ...formData, relationshipDuration: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationshipCapacity">How closely did you work together?</Label>
              <Textarea
                id="relationshipCapacity"
                placeholder="Classes only, one-on-one mentoring, extracurricular supervision, research project, leadership role, etc."
                value={formData.relationshipCapacity}
                onChange={(e) =>
                  setFormData({ ...formData, relationshipCapacity: e.target.value })
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Shared Work & Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Shared Work & Concrete Examples
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="meaningfulProject">
                What is the most meaningful academic or personal project you did together?
              </Label>
              <Textarea
                id="meaningfulProject"
                placeholder="Briefly describe what you worked on and why it mattered"
                value={formData.meaningfulProject}
                onChange={(e) => setFormData({ ...formData, meaningfulProject: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bestMoment">
                Can you describe one moment where this referee saw you at your best?
              </Label>
              <Textarea
                id="bestMoment"
                placeholder="A class discussion, project, challenge, leadership moment, or clear improvement over time"
                value={formData.bestMoment}
                onChange={(e) => setFormData({ ...formData, bestMoment: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficultiesOvercome">
                Did you overcome any difficulty while working with them?
              </Label>
              <Textarea
                id="difficultiesOvercome"
                placeholder="Academic struggle, personal challenge, resilience, or growth"
                value={formData.difficultiesOvercome}
                onChange={(e) =>
                  setFormData({ ...formData, difficultiesOvercome: e.target.value })
                }
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Strengths Through Their Eyes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>What do you think this referee would say you're especially strong at?</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {STRENGTH_OPTIONS.map((strength) => (
                  <div key={strength} className="flex items-center space-x-2">
                    <Checkbox
                      id={strength}
                      checked={formData.strengths.includes(strength)}
                      onCheckedChange={() => handleStrengthToggle(strength)}
                    />
                    <Label htmlFor={strength} className="text-sm font-normal cursor-pointer">
                      {strength}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalNotes">
                Would you like to add a few personal notes for your counselor? (Optional)
              </Label>
              <Textarea
                id="personalNotes"
                placeholder="Any additional context or information you'd like to share..."
                value={formData.personalNotes}
                onChange={(e) => setFormData({ ...formData, personalNotes: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <Button
              onClick={handleSubmit}
              size="lg"
              className="w-full"
              disabled={
                createRequest.isPending ||
                !formData.refereeName ||
                !formData.refereeEmail ||
                !EMAIL_RE.test(formData.refereeEmail) ||
                !formData.refereeRole ||
                !formData.relationshipDuration
              }
            >
              {createRequest.isPending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Send className="h-5 w-5 mr-2" />
              )}
              Submit for Recommendation Letter
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-3">
              Your counselor will review your answers and prepare your recommendation letter.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main List View ────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <CelebrationOverlay event={activeEvent} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recommendation Letters</h1>
          <p className="text-muted-foreground">Request and view your recommendation letters</p>
        </div>
        <Button onClick={() => setCurrentStep("form")}>
          <FileText className="h-4 w-4 mr-2" />
          Request New Letter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">{requests?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">
                  {requests?.filter((r) => r.status === "pending" || r.status === "in_progress")
                    .length ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Received</p>
                <p className="text-2xl font-bold text-foreground">
                  {requests?.filter((r) => r.status === "sent").length ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Letters List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Recommendation Letters</CardTitle>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No recommendation letters yet.</p>
              <Button variant="outline" className="mt-4" onClick={() => setCurrentStep("form")}>
                Request Your First Letter
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedRequest(request);
                    setCurrentStep("view");
                    if (request.status === 'sent') celebrate('rec_letter_received');
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{request.referee_name}</p>
                      <p className="text-sm text-muted-foreground">{request.referee_role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Submitted</p>
                      <p className="text-sm font-medium">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentRecommendationLetters;