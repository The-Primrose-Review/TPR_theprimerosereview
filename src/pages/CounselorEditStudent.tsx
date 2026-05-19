import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { backgroundStep } from "@/data/steps/background";
import { Loader2, User, GraduationCap, Phone, Building2, Plus, X, ChevronsUpDown, Search, Check, ArrowLeft } from "lucide-react";

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia",
  "Belgium", "Ireland", "Netherlands", "Norway", "South Korea",
  "Spain", "Switzerland", "Other",
];

const universityOptions: string[] =
  ((backgroundStep.questions[0] as any).subQuestions as any[]).find(
    (q) => q.id === "university"
  )?.options ?? [];

const GRADES = ["10th Grade", "11th Grade", "12th Grade", "Post High School"];

interface ProfileForm {
  full_name: string;
  phone: string;
  grade: string;
  graduation_year: string;
  gpa: string;
  sat_score: string;
  act_score: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
}

interface CollegeSlot {
  country: string;
  university: string;
  universityOther: string;
  open: boolean;
  search: string;
}

const emptySlot = (): CollegeSlot => ({
  country: "",
  university: "",
  universityOther: "",
  open: false,
  search: "",
});

const CounselorEditStudent = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [form, setForm] = useState<ProfileForm>({
    full_name: "",
    phone: "",
    grade: "",
    graduation_year: "",
    gpa: "",
    sat_score: "",
    act_score: "",
    parent_name: "",
    parent_phone: "",
    parent_email: "",
  });
  const [colleges, setColleges] = useState<CollegeSlot[]>([emptySlot()]);

  useEffect(() => {
    if (studentId) fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [{ data: profile }, { data: studentProfile }, { data: targetColleges }] = await Promise.all([
        supabase.from("profiles").select("full_name, email").eq("user_id", studentId).maybeSingle(),
        supabase.from("student_profiles").select("phone, grade, graduation_year, gpa, sat_score, act_score, parent_name, parent_email, parent_phone").eq("user_id", studentId).maybeSingle(),
        (supabase as any).from("student_target_colleges").select("country, college").eq("student_id", studentId),
      ]);

      setStudentEmail(profile?.email ?? "");
      setForm({
        full_name: profile?.full_name ?? "",
        phone: studentProfile?.phone ?? "",
        grade: studentProfile?.grade ?? "",
        graduation_year: studentProfile?.graduation_year?.toString() ?? "",
        gpa: studentProfile?.gpa?.toString() ?? "",
        sat_score: studentProfile?.sat_score?.toString() ?? "",
        act_score: studentProfile?.act_score?.toString() ?? "",
        parent_name: studentProfile?.parent_name ?? "",
        parent_phone: studentProfile?.parent_phone ?? "",
        parent_email: studentProfile?.parent_email ?? "",
      });

      if (targetColleges && targetColleges.length > 0) {
        setColleges(
          targetColleges.map((c: any) => {
            const isKnown = universityOptions.includes(c.college);
            return {
              country: c.country ?? "",
              university: isKnown ? c.college : (c.college ? "Other" : ""),
              universityOther: isKnown ? "" : (c.college ?? ""),
              open: false,
              search: "",
            };
          })
        );
      }
    } catch (err: any) {
      toast({ title: "Failed to load student", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateCollege = (index: number, updates: Partial<CollegeSlot>) => {
    setColleges(prev => prev.map((slot, i) => i === index ? { ...slot, ...updates } : slot));
  };

  const addCollege = () => setColleges(prev => [...prev, emptySlot()]);

  const removeCollege = (index: number) => {
    if (colleges.length > 1) setColleges(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!studentId) return;
    setSaving(true);
    try {
      const [profileResult, studentProfileResult] = await Promise.all([
        supabase.from("profiles").update({ full_name: form.full_name }).eq("user_id", studentId),
        supabase.from("student_profiles").upsert({
          user_id: studentId,
          phone: form.phone || null,
          grade: form.grade || null,
          graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
          gpa: form.gpa ? parseFloat(form.gpa) : null,
          sat_score: form.sat_score ? parseInt(form.sat_score) : null,
          act_score: form.act_score ? parseInt(form.act_score) : null,
          parent_name: form.parent_name || null,
          parent_phone: form.parent_phone || null,
          parent_email: form.parent_email || null,
        }, { onConflict: "user_id" }),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (studentProfileResult.error) throw studentProfileResult.error;

      // Colleges: delete then re-insert
      const { error: deleteError } = await (supabase as any)
        .from("student_target_colleges")
        .delete()
        .eq("student_id", studentId);
      if (deleteError) throw deleteError;

      const validColleges = colleges
        .map(c => ({
          student_id: studentId,
          country: c.country || null,
          college: c.university === "Other" ? c.universityOther.trim() : c.university.trim(),
        }))
        .filter(c => c.college);

      if (validColleges.length > 0) {
        const { error: insertError } = await (supabase as any)
          .from("student_target_colleges")
          .insert(validColleges);
        if (insertError) throw insertError;
      }

      toast({ title: "Student updated", description: "Changes saved successfully." });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/students")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Edit {form.full_name || "Student"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{studentEmail}</p>
        </div>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input
              value={form.full_name}
              onChange={e => handleChange("full_name", e.target.value)}
              placeholder="Student's full name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={studentEmail} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={e => handleChange("phone", e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Academic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            Academic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Grade</Label>
              <Select value={form.grade} onValueChange={v => handleChange("grade", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Graduation Year</Label>
              <Input
                type="number"
                value={form.graduation_year}
                onChange={e => handleChange("graduation_year", e.target.value)}
                placeholder="e.g. 2026"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>GPA</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="4"
                value={form.gpa}
                onChange={e => handleChange("gpa", e.target.value)}
                placeholder="3.8"
              />
            </div>
            <div className="space-y-1.5">
              <Label>SAT Score</Label>
              <Input
                type="number"
                value={form.sat_score}
                onChange={e => handleChange("sat_score", e.target.value)}
                placeholder="1500"
              />
            </div>
            <div className="space-y-1.5">
              <Label>ACT Score</Label>
              <Input
                type="number"
                value={form.act_score}
                onChange={e => handleChange("act_score", e.target.value)}
                placeholder="34"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Colleges */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Target Colleges
            </CardTitle>
            <p className="text-xs text-muted-foreground text-right leading-relaxed">
              Add or update the colleges this student is targeting.<br />
              Use <span className="font-medium text-foreground">Add another university</span> below to add more.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {colleges.map((slot, index) => {
            const filtered = slot.search.trim()
              ? universityOptions.filter(u => u.toLowerCase().includes(slot.search.toLowerCase()))
              : universityOptions;

            return (
              <div key={index} className="space-y-3 p-3 border rounded-lg bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">University {index + 1}</span>
                  {colleges.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeCollege(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Country</Label>
                    <select
                      value={slot.country}
                      onChange={e => updateCollege(index, { country: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Select country...</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <Label>University</Label>
                    <Popover
                      open={slot.open}
                      onOpenChange={open => updateCollege(index, { open })}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className="w-full h-10 justify-between font-normal"
                        >
                          <span className={cn(!slot.university && "text-muted-foreground")}>
                            {slot.university || "Select university..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <div className="flex items-center border-b px-3">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <input
                            className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Search universities..."
                            value={slot.search}
                            onChange={e => updateCollege(index, { search: e.target.value })}
                          />
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {filtered.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">No university found.</p>
                          ) : (
                            filtered.map(u => (
                              <button
                                key={u}
                                type="button"
                                onClick={() => updateCollege(index, { university: u, universityOther: "", open: false, search: "" })}
                                className="relative flex w-full cursor-pointer select-none items-center px-4 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                              >
                                <Check className={cn("mr-2 h-4 w-4 shrink-0", slot.university === u ? "opacity-100" : "opacity-0")} />
                                {u}
                              </button>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {slot.university === "Other" && (
                  <div>
                    <Label>University Name</Label>
                    <Input
                      value={slot.universityOther}
                      onChange={e => updateCollege(index, { universityOther: e.target.value })}
                      placeholder="Enter university name"
                    />
                  </div>
                )}
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCollege}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add another university
          </Button>
        </CardContent>
      </Card>

      {/* Parent / Guardian */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            Parent / Guardian
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Parent Name</Label>
            <Input
              value={form.parent_name}
              onChange={e => handleChange("parent_name", e.target.value)}
              placeholder="Parent's full name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Parent Phone</Label>
              <Input
                value={form.parent_phone}
                onChange={e => handleChange("parent_phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Parent Email</Label>
              <Input
                value={form.parent_email}
                onChange={e => handleChange("parent_email", e.target.value)}
                placeholder="parent@email.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default CounselorEditStudent;
