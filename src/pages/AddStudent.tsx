import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { backgroundStep } from "@/data/steps/background";
import { useTeacherInvite, useGenerateTeacherInvite } from "@/hooks/useTeacherInvite";
import { BookOpen } from "lucide-react";
import {
  Upload,
  Copy,
  Send,
  UserPlus,
  Link2,
  Clock,
  Check,
  ChevronsUpDown,
  Search,
  Plus,
  X,
  // Mail,
  // Phone,
} from "lucide-react";

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia",
  "Belgium", "Ireland", "Netherlands", "Norway", "South Korea",
  "Spain", "Switzerland", "Other",
];

const universityOptions: string[] =
  ((backgroundStep.questions[0] as any).subQuestions as any[]).find(
    (q) => q.id === "university"
  )?.options ?? [];

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

const AddStudent = () => {
  const [activeTab, setActiveTab] = useState("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [counselorSchoolName, setCounselorSchoolName] = useState("");

  const { data: existingTeacherInvite } = useTeacherInvite();
  const generateTeacherInvite = useGenerateTeacherInvite();
  const [teacherInviteLink, setTeacherInviteLink] = useState(existingTeacherInvite ?? "");
  const { toast } = useToast();

  const [manualForm, setManualForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gpa: "",
    satScore: "",
    actScore: "",
    highSchool: "",
    graduationYear: "",
    profilePhoto: null as File | null,
  });

  const [targetColleges, setTargetColleges] = useState<CollegeSlot[]>([emptySlot()]);

  const updateCollegeSlot = (index: number, updates: Partial<CollegeSlot>) =>
    setTargetColleges((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, ...updates } : slot))
    );

  const addCollegeSlot = () =>
    setTargetColleges((prev) => [...prev, emptySlot()]);

  const removeCollegeSlot = (index: number) =>
    setTargetColleges((prev) => prev.filter((_, i) => i !== index));

  useEffect(() => {
    const fetchCounselorSchool = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.school_id) return;

      const { data: school } = await supabase
        .from("schools")
        .select("name")
        .eq("id", profile.school_id)
        .maybeSingle();

      if (school?.name) {
        setCounselorSchoolName(school.name);
        setManualForm((prev) => ({ ...prev, highSchool: school.name }));
      }
    };

    fetchCounselorSchool();
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // ── Step 1: Get the currently logged-in counselor ────────
      const { data: { user: counselor } } = await supabase.auth.getUser();
      if (!counselor) throw new Error("You must be logged in to add students");

      // ── Step 2: Create student auth account ──────────────────
      const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: manualForm.email,
        password: tempPassword,
        options: {
          data: { full_name: `${manualForm.firstName} ${manualForm.lastName}` },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create student account");

      const studentUserId = authData.user.id;

      // ── Step 3: Find or create school ────────────────────────
      let schoolId: string | null = null;
      if (manualForm.highSchool.trim()) {
        const { data: existingSchool } = await supabase
          .from("schools")
          .select("id")
          .ilike("name", manualForm.highSchool.trim())
          .single();

        if (existingSchool) {
          schoolId = existingSchool.id;
        } else {
          const { data: newSchool, error: schoolError } = await supabase
            .from("schools")
            .insert({ name: manualForm.highSchool.trim() })
            .select("id")
            .single();
          if (schoolError) throw schoolError;
          schoolId = newSchool.id;
        }
      }

      // ── Step 4: Update profile (handle_new_user trigger already created the row) ──
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          email: manualForm.email,
          full_name: `${manualForm.firstName} ${manualForm.lastName}`,
          school_id: schoolId,
        })
        .eq("user_id", studentUserId);
      if (profileError) throw profileError;

      // ── Step 5: Assign student role ───────────────────────────
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: studentUserId, role: "student" });
      if (roleError) throw roleError;

      // ── Step 6: Insert into student_profiles ──────────────────
      const { error: studentProfileError } = await supabase
        .from("student_profiles")
        .insert({
          user_id: studentUserId,
          phone: manualForm.phone || null,
          gpa: manualForm.gpa ? parseFloat(manualForm.gpa) : null,
          sat_score: manualForm.satScore ? parseInt(manualForm.satScore) : null,
          act_score: manualForm.actScore ? parseInt(manualForm.actScore) : null,
          graduation_year: manualForm.graduationYear
            ? parseInt(manualForm.graduationYear)
            : null,
        });
      if (studentProfileError) throw studentProfileError;

      // ── Step 7: Link student to counselor ────────────────────
      const { error: assignError } = await supabase
        .from("student_counselor_assignments")
        .insert({
          student_id: studentUserId,
          counselor_id: counselor.id,
        });
      if (assignError) throw assignError;

      // ── Step 8: Insert target colleges ───────────────────────
      const collegeRows = targetColleges
        .map((s) => ({
          student_id: studentUserId,
          country: s.country || null,
          college: s.university === "Other" ? s.universityOther : s.university,
        }))
        .filter((r) => r.college);
      if (collegeRows.length > 0) {
        const { error: collegesError } = await (supabase as any)
          .from("student_target_colleges")
          .insert(collegeRows);
        if (collegesError) throw collegesError;
      }

      // Send welcome email (non-fatal)
      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: {
            email: manualForm.email,
            fullName: `${manualForm.firstName} ${manualForm.lastName}`,
            role: "student",
            appUrl: window.location.origin,
          },
        });
      } catch (e) {
        console.error("Failed to send welcome email:", e);
      }

      toast({
        title: "Student Added Successfully",
        description: `${manualForm.firstName} ${manualForm.lastName} has been added to your roster.`,
      });

      setManualForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        gpa: "",
        satScore: "",
        actScore: "",
        highSchool: counselorSchoolName,
        graduationYear: "",
        profilePhoto: null,
      });
      setTargetColleges([emptySlot()]);
    } catch (error: any) {
      toast({
        title: "Failed to add student",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateInviteLink = async () => {
    try {
      const { data: { user: counselor } } = await supabase.auth.getUser();
      if (!counselor) throw new Error("You must be logged in");

      const { data: existing } = await supabase
        .from("counselor_invites")
        .select("invite_code")
        .eq("counselor_id", counselor.id)
        .maybeSingle();

      let inviteCode: string;

      if (existing) {
        inviteCode = existing.invite_code;
      } else {
        inviteCode = Math.random().toString(36).substring(2, 15);
        const { error: insertError } = await supabase
          .from("counselor_invites")
          .insert({ counselor_id: counselor.id, invite_code: inviteCode });
        if (insertError) throw insertError;
      }

      const link = `${window.location.origin}/signup?invite=${inviteCode}`;
      setInviteLink(link);

      toast({
        title: "Invite Link Generated",
        description: "Share this link with your student so they can register.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to generate link",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Link Copied",
      description: "Invite link has been copied to clipboard.",
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setManualForm({ ...manualForm, profilePhoto: file });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add Student</h1>
        <p className="text-muted-foreground">
          Add a new student to your counseling roster
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Manual Add
          </TabsTrigger>
          <TabsTrigger value="invite" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Invite Link
          </TabsTrigger>
        </TabsList>

        {/* Manual Add Tab */}
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Add Student Manually
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter student information to add them directly to your roster.
                They'll receive an email to set their own password.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={
                        manualForm.profilePhoto
                          ? URL.createObjectURL(manualForm.profilePhoto)
                          : undefined
                      }
                    />
                    <AvatarFallback className="text-lg">
                      {manualForm.firstName.charAt(0)}
                      {manualForm.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="photo-upload" className="block text-sm font-medium mb-2">
                      Profile Photo (Optional)
                    </Label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("photo-upload")?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={manualForm.firstName}
                      onChange={(e) => setManualForm({ ...manualForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={manualForm.lastName}
                      onChange={(e) => setManualForm({ ...manualForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={manualForm.email}
                      onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={manualForm.phone}
                      onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Academic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="gpa">GPA</Label>
                    <Input
                      id="gpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="4.0"
                      value={manualForm.gpa}
                      onChange={(e) => setManualForm({ ...manualForm, gpa: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="satScore">SAT Score</Label>
                    <Input
                      id="satScore"
                      type="number"
                      min="400"
                      max="1600"
                      value={manualForm.satScore}
                      onChange={(e) => setManualForm({ ...manualForm, satScore: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="actScore">ACT Score</Label>
                    <Input
                      id="actScore"
                      type="number"
                      min="1"
                      max="36"
                      value={manualForm.actScore}
                      onChange={(e) => setManualForm({ ...manualForm, actScore: e.target.value })}
                    />
                  </div>
                </div>

                {/* School Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="highSchool">
                      High School *{" "}
                      {counselorSchoolName && (
                        <span className="text-xs text-muted-foreground font-normal">(Auto-filled)</span>
                      )}
                    </Label>
                    <Input
                      id="highSchool"
                      value={manualForm.highSchool}
                      onChange={(e) => setManualForm({ ...manualForm, highSchool: e.target.value })}
                      readOnly={!!counselorSchoolName}
                      className={counselorSchoolName ? "bg-muted cursor-not-allowed" : ""}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="graduationYear">Graduation Year *</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      min="2024"
                      max="2030"
                      value={manualForm.graduationYear}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, graduationYear: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Target Universities */}
                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground">Target Universities</p>

                  {targetColleges.map((slot, index) => {
                    const filtered = slot.search.trim()
                      ? universityOptions.filter((u) =>
                          u.toLowerCase().includes(slot.search.toLowerCase())
                        )
                      : universityOptions;

                    return (
                      <div key={index} className="space-y-3 p-3 border rounded-lg bg-muted/20">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">University {index + 1}</span>
                          {targetColleges.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeCollegeSlot(index)}
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
                              onChange={(e) =>
                                updateCollegeSlot(index, { country: e.target.value })
                              }
                              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                            >
                              <option value="">Select country...</option>
                              {COUNTRIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label>University</Label>
                            <Popover
                              open={slot.open}
                              onOpenChange={(open) => updateCollegeSlot(index, { open })}
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
                                    onChange={(e) =>
                                      updateCollegeSlot(index, { search: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="max-h-72 overflow-y-auto">
                                  {filtered.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                      No university found.
                                    </p>
                                  ) : (
                                    filtered.map((u) => (
                                      <button
                                        key={u}
                                        type="button"
                                        onClick={() =>
                                          updateCollegeSlot(index, {
                                            university: u,
                                            universityOther: "",
                                            open: false,
                                            search: "",
                                          })
                                        }
                                        className="relative flex w-full cursor-pointer select-none items-center px-4 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4 shrink-0",
                                            slot.university === u ? "opacity-100" : "opacity-0"
                                          )}
                                        />
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
                              onChange={(e) =>
                                updateCollegeSlot(index, { universityOther: e.target.value })
                              }
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
                    onClick={addCollegeSlot}
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add another university
                  </Button>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Adding Student...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Student
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invite Link Tab */}
        <TabsContent value="invite">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  Generate Student Invite Link
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create a registration link for students to complete their own onboarding
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Send Student Registration Link</h3>
                  <p className="text-muted-foreground mb-6">
                    Generate a unique link — when the student registers using it, they'll be
                    automatically linked to your roster.
                  </p>
                  <Button onClick={generateInviteLink} size="lg">
                    <Link2 className="h-4 w-4 mr-2" />
                    Generate Invite Link
                  </Button>
                </div>

                {inviteLink && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <Label className="text-sm font-medium">Registration Link</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input value={inviteLink} readOnly className="flex-1" />
                        <Button variant="outline" size="sm" onClick={copyInviteLink}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="h-12">
                        <Mail className="h-4 w-4 mr-2" />
                        Send via Email
                      </Button>
                      <Button variant="outline" className="h-12">
                        <Phone className="h-4 w-4 mr-2" />
                        Send via SMS
                      </Button>
                    </div> */}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-violet-200 dark:border-violet-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-violet-600" />
                  Generate Teacher Invite Link
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Share this link with teachers at your school so they can register and receive student essays.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!teacherInviteLink && !existingTeacherInvite ? (
                  <div className="text-center py-4">
                    <Button
                      onClick={async () => {
                        try {
                          const link = await generateTeacherInvite.mutateAsync();
                          setTeacherInviteLink(link);
                          toast({ title: "Teacher invite link generated!", description: "Share it with your teachers." });
                        } catch (e: any) {
                          toast({ title: "Failed", description: e.message, variant: "destructive" });
                        }
                      }}
                      disabled={generateTeacherInvite.isPending}
                      className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      {generateTeacherInvite.isPending ? "Generating…" : "Generate Teacher Invite Link"}
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-violet-50 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-800">
                    <Label className="text-sm font-medium text-violet-700 dark:text-violet-300">Teacher Registration Link</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={teacherInviteLink || existingTeacherInvite || ""}
                        readOnly
                        className="flex-1 text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(teacherInviteLink || existingTeacherInvite || "");
                          toast({ title: "Copied!", description: "Teacher invite link copied to clipboard." });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Teachers who register with this link will be connected to your school automatically.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How Student Self-Registration Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      title: "Student Receives Link",
                      desc: "Student clicks the registration link you provide",
                    },
                    {
                      step: 2,
                      title: "Complete Onboarding Form",
                      desc: "Student fills out personal details, academic info, and target schools",
                    },
                    {
                      step: 3,
                      title: "Added to Your Roster",
                      desc: "Student appears in your dashboard automatically linked to you",
                    },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                        {step}
                      </div>
                      <div>
                        <h4 className="font-medium">{title}</h4>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddStudent;
