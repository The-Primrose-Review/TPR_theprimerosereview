import { useState } from "react";
import { usePreviewMode } from "@/contexts/PreviewModeContext";
import { toast } from "sonner";
import { useCelebration } from "@/hooks/useCelebration";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApplications } from "@/hooks/useApplications";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ArrowLeft,
  GraduationCap,
  Calendar,
  FileText,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Plus,
  School,
  ClipboardList,
  Globe,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { backgroundStep } from "@/data/steps/background";

const APPLICATION_PLATFORMS = [
  { value: "common-app",   label: "Common App",              description: "Used by 900+ colleges (default)" },
  { value: "coalition",    label: "Coalition Application",   description: "Partnered with 150+ colleges" },
  { value: "uc-app",       label: "UC Application",          description: "California UC system" },
  { value: "apply-texas",  label: "ApplyTexas",              description: "Texas public universities" },
  { value: "direct",       label: "Direct Application",      description: "School-specific portal" },
  { value: "ucas",         label: "UCAS",                    description: "UK university applications" },
  { value: "other",        label: "Other",                   description: "Another platform" },
];

const APPLICATION_TYPES = [
  { value: "early-decision",          label: "Early Decision (ED)",           description: "Binding — first choice school" },
  { value: "early-action",            label: "Early Action (EA)",             description: "Non-binding early application" },
  { value: "restrictive-early-action",label: "Restrictive Early Action (REA)",description: "Early, limits other early apps" },
  { value: "regular-decision",        label: "Regular Decision (RD)",         description: "Standard application round" },
  { value: "rolling",                 label: "Rolling Admission",             description: "Applications reviewed as received" },
];

const STATUS_OPTIONS = [
  { value: "not-started", label: "Not Started", color: "bg-muted text-muted-foreground" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-500/10 text-blue-600" },
  { value: "submitted", label: "Submitted", color: "bg-green-500/10 text-green-600" },
  { value: "accepted", label: "Accepted", color: "bg-emerald-500/10 text-emerald-600" },
  { value: "rejected", label: "Rejected", color: "bg-red-500/10 text-red-600" },
  { value: "waitlisted", label: "Waitlisted", color: "bg-yellow-500/10 text-yellow-600" },
];

const CURRENT_YEAR = new Date().getFullYear();
const GRAD_YEARS = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2];

const COLLEGE_LIST: string[] = (
  backgroundStep.questions[0].subQuestions[0].options as string[]
);

const AddApplication = () => {
  const isPreviewMode = usePreviewMode();
  const navigate = useNavigate();
  const { createApplication } = useApplications();
  const { celebrate, activeEvent } = useCelebration();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [schoolOpen, setSchoolOpen] = useState(false);

  const [form, setForm] = useState({
    school_name: "",
    program: "",
    application_platform: "common-app",
    application_type: "",
    deadline_date: "",
    status: "not-started",
    required_essays: 1,
    completed_essays: 0,
    recommendations_requested: 0,
    recommendations_submitted: 0,
    urgent: false,
    notes: "",
  });

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-compute completion percentage
  const computeCompletion = () => {
    const essayScore =
      form.required_essays > 0
        ? (form.completed_essays / form.required_essays) * 60
        : 60;
    const recScore =
      form.recommendations_requested > 0
        ? (form.recommendations_submitted / form.recommendations_requested) * 40
        : 40;
    return Math.round(essayScore + recScore);
  };

  // Auto-detect urgency based on deadline
  const isUrgent = () => {
    if (!form.deadline_date) return false;
    const daysUntil = Math.ceil(
      (new Date(form.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil <= 7 && daysUntil >= 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPreviewMode) {
      toast.info("Preview mode — adding applications is disabled");
      return;
    }

    if (!form.school_name || !form.application_type || !form.deadline_date) return;

    setIsSubmitting(true);
    try {
      await createApplication.mutateAsync({
        student_id: "", // overwritten by hook
        school_name: form.school_name,
        program: form.program || null,
        application_platform: form.application_platform || null,
        application_type: form.application_type,
        deadline_date: form.deadline_date,
        status: form.status,
        required_essays: form.required_essays,
        completed_essays: form.completed_essays,
        recommendations_requested: form.recommendations_requested,
        recommendations_submitted: form.recommendations_submitted,
        completion_percentage: 0,
        urgent: isUrgent(),
        ai_score_avg: null,
        notes: form.notes || null,
      } as any);
      setSubmitted(true);
      celebrate('new_application');
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success state ──────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <CelebrationOverlay event={activeEvent} />
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Application Added!</h1>
            <p className="text-muted-foreground mt-2">
              <span className="font-medium text-foreground">{form.school_name}</span> has been
              added to your application list. Your counselor can now track your progress.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                setSubmitted(false);
                setForm({
                  school_name: "",
                  program: "",
                  application_platform: "common-app",
                  application_type: "",
                  deadline_date: "",
                  status: "not-started",
                  required_essays: 1,
                  completed_essays: 0,
                  recommendations_requested: 0,
                  recommendations_submitted: 0,
                  urgent: false,
                  notes: "",
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Application
            </Button>
            <Button variant="outline" onClick={() => navigate("/student-personal-area")}>
              Back to My Area
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const urgent = isUrgent();

  // ── Form ───────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/student-personal-area")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add Application</h1>
          <p className="text-muted-foreground">Track a college you're applying to</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 — School Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-primary" />
              School Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  School Name <span className="text-destructive">*</span>
                </Label>
                <Popover open={schoolOpen} onOpenChange={setSchoolOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={schoolOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className={form.school_name ? "text-foreground" : "text-muted-foreground"}>
                        {form.school_name || "Search for a school..."}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Type to search..." />
                      <CommandList>
                        <CommandEmpty>No school found. Type to add a custom name.</CommandEmpty>
                        <CommandGroup>
                          {COLLEGE_LIST.map((college) => (
                            <CommandItem
                              key={college}
                              value={college}
                              onSelect={(val) => {
                                updateForm("school_name", val === form.school_name ? "" : val);
                                setSchoolOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${form.school_name === college ? "opacity-100" : "opacity-0"}`}
                              />
                              {college}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="program">
                  Program / Major <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="program"
                  placeholder="Computer Science, Biology..."
                  value={form.program}
                  onChange={(e) => updateForm("program", e.target.value)}
                />
              </div>
            </div>

            {/* Application Platform */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                Application Platform <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {APPLICATION_PLATFORMS.map((platform) => (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() => updateForm("application_platform", platform.value)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      form.application_platform === platform.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <p className="font-medium text-sm text-foreground">{platform.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{platform.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Application Type */}
            <div className="space-y-2">
              <Label>
                Application Type <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {APPLICATION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateForm("application_type", type.value)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      form.application_type === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <p className="font-medium text-sm text-foreground">{type.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2 — Deadline & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Deadline & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline_date">
                  Application Deadline <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="deadline_date"
                  type="date"
                  value={form.deadline_date}
                  onChange={(e) => updateForm("deadline_date", e.target.value)}
                  required
                />
                {urgent && (
                  <div className="flex items-center gap-1 text-yellow-600 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    Deadline within 7 days — marked as urgent
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Current Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => updateForm("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>




        

        {/* Section 3 — Essays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Essays (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="required_essays">Essays Required</Label>
                <Input
                  id="required_essays"
                  type="number"
                  min={0}
                  max={20}
                  value={form.required_essays}
                  onChange={(e) =>
                    updateForm("required_essays", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="completed_essays">Essays Completed</Label>
                <Input
                  id="completed_essays"
                  type="number"
                  min={0}
                  max={form.required_essays}
                  value={form.completed_essays}
                  onChange={(e) =>
                    updateForm(
                      "completed_essays",
                      Math.min(parseInt(e.target.value) || 0, form.required_essays)
                    )
                  }
                />
              </div>
            </div>
            {form.required_essays > 0 && (
              <div className="text-xs text-muted-foreground">
                {form.completed_essays} of {form.required_essays} essays completed
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4 — Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Recommendations (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recommendations_requested">Recommendations Required</Label>
                <Input
                  id="recommendations_requested"
                  type="number"
                  min={0}
                  max={10}
                  value={form.recommendations_requested}
                  onChange={(e) =>
                    updateForm("recommendations_requested", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recommendations_submitted">Recommendations Submitted</Label>
                <Input
                  id="recommendations_submitted"
                  type="number"
                  min={0}
                  max={form.recommendations_requested}
                  value={form.recommendations_submitted}
                  onChange={(e) =>
                    updateForm(
                      "recommendations_submitted",
                      Math.min(
                        parseInt(e.target.value) || 0,
                        form.recommendations_requested
                      )
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>




        {/* Section 5 — Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Notes <span className="text-muted-foreground text-sm font-normal">(optional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any additional notes about this application — scholarship info, special requirements, etc."
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              rows={3}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Completion Preview */}
        {/* <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Estimated Completion</p>
                <p className="text-xs text-muted-foreground">
                  Based on essays (60%) + recommendations (40%)
                </p>
              </div>
              <div className="flex items-center gap-3">
                {urgent && (
                  <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Urgent
                  </Badge>
                )}
                <div className="text-3xl font-bold text-primary">{completion}%</div>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/student-personal-area")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={
              isSubmitting ||
              !form.school_name ||
              !form.application_type ||
              !form.deadline_date
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <GraduationCap className="h-4 w-4 mr-2" />
                Add Application
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddApplication;