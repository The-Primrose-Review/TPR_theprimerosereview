import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, GraduationCap, Users, UserCircle, Building2 } from "lucide-react";
import primroseLogo from "@/assets/primrose-logo.png";

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCodeParam = searchParams.get('invite');
  const roleParam = searchParams.get('role');

  const [selectedRole, setSelectedRole] = useState<'counselor' | 'student' | 'parent' | 'principal' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Student fields
  const [schoolName, setSchoolName] = useState("");
  const [inviteSchoolName, setInviteSchoolName] = useState<string | null>(null);
  const [grade, setGrade] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  // Principal fields
  const [principalSchoolName, setPrincipalSchoolName] = useState("");

  // Counselor fields
  const [counselorSchoolName, setCounselorSchoolName] = useState("");
  const [counselorPhone, setCounselorPhone] = useState("");
  const [counselorTitle, setCounselorTitle] = useState("");
  const [counselorBio, setCounselorBio] = useState("");
  const [counselorSpecialization, setCounselorSpecialization] = useState("");
  const [counselorYearsOfExperience, setCounselorYearsOfExperience] = useState("");

  // Parent fields
  const [invitationCode, setInvitationCode] = useState("");

 

useEffect(() => {
  if (roleParam === 'parent') {
    setSelectedRole('parent');
    if (inviteCodeParam) setInvitationCode(inviteCodeParam);
  } else if (inviteCodeParam) {
    setSelectedRole('student');
    (async () => {
      const { data: schoolName } = await supabase.rpc('get_school_name_by_invite', {
        invite_code_param: inviteCodeParam,
      });
      if (schoolName) setInviteSchoolName(schoolName);
    })();
  }
}, [inviteCodeParam, roleParam]);

  const getRoleIcon = (role: string, size = "h-8 w-8") => {
    switch (role) {
      case 'counselor': return <GraduationCap className={size} />;
      case 'student': return <Users className={size} />;
      case 'parent': return <UserCircle className={size} />;
      case 'principal': return <Building2 className={size} />;
      default: return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'counselor': return 'Counselor';
      case 'student': return 'Student';
      case 'parent': return 'Parent';
      case 'principal': return 'Admin';
      default: return '';
    }
  };

  const navigateByRole = (role: string) => {
    switch (role) {
      case 'counselor': navigate('/dashboard'); break;
      case 'student': navigate('/student-dashboard'); break;
      case 'parent': navigate('/parent-portal'); break;
      case 'principal': navigate('/principal-dashboard'); break;
      default: navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName }
        }
      });
      if (error) throw error;

      if (data.user) {
        let schoolId: string | null = null;

        if (selectedRole === 'student') {
          // If signing up via invite, inherit the counselor's school_id
          if (inviteCodeParam) {
            const { data: inviteData } = await supabase
              .from('counselor_invites')
              .select('counselor_id')
              .eq('invite_code', inviteCodeParam)
              .maybeSingle();

            if (inviteData) {
              const { data: counselorProfile } = await supabase
                .from('profiles')
                .select('school_id')
                .eq('user_id', inviteData.counselor_id)
                .maybeSingle();
              if (counselorProfile?.school_id) {
                schoolId = counselorProfile.school_id;
              }
            }
          }

          // Fall back to manual school name entry if no school resolved from invite
          if (!schoolId && schoolName.trim()) {
            const { data: existingSchool } = await supabase
              .from('schools')
              .select('id')
              .ilike('name', schoolName.trim())
              .maybeSingle();

            if (existingSchool) {
              schoolId = existingSchool.id;
            } else {
              const { data: newSchool, error: schoolError } = await supabase
                .from('schools')
                .insert({ name: schoolName.trim() })
                .select('id')
                .single();
              if (schoolError) throw schoolError;
              schoolId = newSchool.id;
            }
          }
        }

        if (selectedRole === 'counselor' && counselorSchoolName.trim()) {
          const { data: existingSchool } = await supabase
            .from('schools')
            .select('id')
            .ilike('name', counselorSchoolName.trim())
            .maybeSingle();

          if (existingSchool) {
            schoolId = existingSchool.id;
          } else {
            const { data: newSchool, error: schoolError } = await supabase
              .from('schools')
              .insert({ name: counselorSchoolName.trim() })
              .select('id')
              .single();
            if (schoolError) throw schoolError;
            schoolId = newSchool.id;
          }
        }

        if (selectedRole === 'principal' && principalSchoolName.trim()) {
          const { data: existingSchool } = await supabase
            .from('schools')
            .select('id')
            .ilike('name', principalSchoolName.trim())
            .maybeSingle();

          if (existingSchool) {
            schoolId = existingSchool.id;
          } else {
            const { data: newSchool, error: schoolError } = await supabase
              .from('schools')
              .insert({ name: principalSchoolName.trim() })
              .select('id')
              .single();
            if (schoolError) throw schoolError;
            schoolId = newSchool.id;
          }
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ user_id: data.user.id, email, full_name: fullName, school_id: schoolId });
        if (profileError) throw profileError;

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role: selectedRole });
        if (roleError) throw roleError;

        // Student-specific inserts
        if (selectedRole === 'student') {
          const { error: studentError } = await supabase
            .from('student_profiles')
            .insert({
              user_id: data.user.id,
              grade: grade || null,
              graduation_year: graduationYear ? parseInt(graduationYear) : null,
              parent_name: parentName || null,
              parent_email: parentEmail || null,
              parent_phone: parentPhone || null,
            });
          if (studentError) throw studentError;

          // if (counselorIdParam) {
          //   const { error: assignError } = await supabase
          //     .from('student_counselor_assignments')
          //     .insert({ student_id: data.user.id, counselor_id: counselorIdParam });
          //   if (assignError) throw assignError;
          // }
          if (inviteCodeParam) {
            const { data: inviteData } = await supabase
              .from('counselor_invites')
              .select('counselor_id')
              .eq('invite_code', inviteCodeParam)
              .maybeSingle();

            if (!inviteData) {
              throw new Error("Invalid or expired invite link");
            }

            const { error: assignError } = await supabase
              .from('student_counselor_assignments')
              .insert({
                student_id: data.user.id,
                counselor_id: inviteData.counselor_id
              });

            if (assignError) throw assignError;

            // Send parent invite email if parent email was provided
            if (parentEmail.trim()) {
              try {
                await supabase.functions.invoke('send-parent-invite', {
                  body: {
                    parentEmail: parentEmail.trim(),
                    parentName: parentName.trim() || undefined,
                    studentName: fullName,
                    counselorCode: inviteCodeParam,
                    appUrl: window.location.origin,
                  },
                });
              } catch (e) {
                // Non-fatal — signup succeeded even if email fails
                console.error('Failed to send parent invite email:', e);
              }
            }
          }
        }

        // Counselor-specific insert
        if (selectedRole === 'counselor') {
          const { error: counselorError } = await supabase
            .from('counselor_profiles')
            .insert({
              user_id: data.user.id,
              phone: counselorPhone || null,
              title: counselorTitle || null,
              bio: counselorBio || null,
              specialization: counselorSpecialization || null,
              years_of_experience: counselorYearsOfExperience
                ? parseInt(counselorYearsOfExperience)
                : null,
            });
          if (counselorError) throw counselorError;
        }

        // Parent-specific: link to student via counselor invite code
        if (selectedRole === 'parent') {
          if (!invitationCode.trim()) throw new Error("Invite code is required for parent registration");
          const { error: linkError } = await supabase.rpc('link_parent_to_student', {
            _counselor_invite_code: invitationCode.trim(),
            _parent_email: email.trim(),
          });
          if (linkError) throw new Error(linkError.message);
        }
      }

      // Send welcome email (non-fatal)
      try {
        await fetch("https://fkvfngdwblbalrompzdj.supabase.co/functions/v1/send-welcome-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            fullName,
            role: selectedRole,
            appUrl: window.location.origin,
          }),
        });
      } catch (e) {
        console.error("Failed to send welcome email:", e);
      }

      toast.success("Account created successfully!");
      navigateByRole(selectedRole);
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">

        {/* Top row */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => selectedRole ? setSelectedRole(null) : navigate('/auth')}
          >
            <ArrowLeft className="h-4 w-4" />
            {selectedRole ? 'Back' : 'Back to Sign In'}
          </Button>
        </div>

        {/* Logo */}
        <div className="flex justify-center">
          <img src={primroseLogo} alt="The Primrose Review" className="h-16 w-auto" />
        </div>

        <Card className="p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {selectedRole ? `Sign up as ${getRoleLabel(selectedRole)}` : 'Create an account'}
            </h1>
            {!selectedRole && (
              <p className="text-sm text-muted-foreground mt-1">Choose your role to get started</p>
            )}
          </div>

          {/* Step 1: Role selection */}
          {!selectedRole && (
            <div className="grid grid-cols-3 gap-3">
              {(['counselor', 'student', 'principal'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all"
                >
                  {getRoleIcon(role)}
                  <span className="text-sm font-medium">{getRoleLabel(role)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Registration form based on role */}
          {selectedRole && (
            <form onSubmit={handleSignup} className="space-y-4">

              {/* Common fields */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a password"
                  minLength={6}
                />
              </div>

              {/* Student-specific fields */}
              {selectedRole === 'student' && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground">School Information</p>

                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    {inviteSchoolName ? (
                      <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground">
                        <span className="flex-1">{inviteSchoolName}</span>
                        <span className="text-xs text-primary font-medium">Auto-filled</span>
                      </div>
                    ) : (
                      <Input
                        id="schoolName"
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="Lincoln High School"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade</Label>
                      <select
                        id="grade"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="">Select...</option>
                        <option>9th</option>
                        <option>10th</option>
                        <option>11th</option>
                        <option>12th</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="graduationYear">Grad Year</Label>
                      <select
                        id="graduationYear"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="">Select...</option>
                        <option>2025</option>
                        <option>2026</option>
                        <option>2027</option>
                        <option>2028</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-muted-foreground pt-2">
                    Parent / Guardian <span className="font-normal">(optional)</span>
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="parentName">Parent Name</Label>
                    <Input
                      id="parentName"
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Robert Thompson"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">Parent Email</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="parent@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">Parent Phone</Label>
                    <Input
                      id="parentPhone"
                      type="tel"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              )}

              {/* Counselor-specific fields */}
              {selectedRole === 'counselor' && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground">School Information</p>

                  <div className="space-y-2">
                    <Label htmlFor="counselorSchoolName">School Name</Label>
                    <Input
                      id="counselorSchoolName"
                      type="text"
                      value={counselorSchoolName}
                      onChange={(e) => setCounselorSchoolName(e.target.value)}
                      placeholder="Lincoln High School"
                    />
                  </div>

                  <p className="text-sm font-medium text-muted-foreground">Professional Information</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="counselorTitle">Title</Label>
                      <Input
                        id="counselorTitle"
                        type="text"
                        value={counselorTitle}
                        onChange={(e) => setCounselorTitle(e.target.value)}
                        placeholder="Senior Counselor"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="counselorPhone">Phone</Label>
                      <Input
                        id="counselorPhone"
                        type="tel"
                        value={counselorPhone}
                        onChange={(e) => setCounselorPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="counselorSpecialization">Specialization</Label>
                    <Input
                      id="counselorSpecialization"
                      type="text"
                      value={counselorSpecialization}
                      onChange={(e) => setCounselorSpecialization(e.target.value)}
                      placeholder="Ivy League, STEM, Arts..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="counselorYearsOfExperience">Years of Experience</Label>
                    <Input
                      id="counselorYearsOfExperience"
                      type="number"
                      min="0"
                      max="50"
                      value={counselorYearsOfExperience}
                      onChange={(e) => setCounselorYearsOfExperience(e.target.value)}
                      placeholder="5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="counselorBio">
                      Bio <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <textarea
                      id="counselorBio"
                      value={counselorBio}
                      onChange={(e) => setCounselorBio(e.target.value)}
                      placeholder="Tell students a bit about yourself..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}

              {/* Principal-specific fields */}
              {selectedRole === 'principal' && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground">School Information</p>
                  <div className="space-y-2">
                    <Label htmlFor="principalSchoolName">School Name</Label>
                    <Input
                      id="principalSchoolName"
                      type="text"
                      value={principalSchoolName}
                      onChange={(e) => setPrincipalSchoolName(e.target.value)}
                      placeholder="Lincoln High School"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      If the school already exists, you'll be linked to it automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* Parent-specific fields */}
              {selectedRole === 'parent' && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label htmlFor="invitationCode">
                    Invitation Code <span className="text-muted-foreground font-normal">(from your child)</span>
                  </Label>
                  <Input
                    id="invitationCode"
                    type="text"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value)}
                    placeholder="Enter invitation code"
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          )}

          {/* Bottom: Sign in link */}
          <div className="text-center pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Already have an account? </span>
            <button
              type="button"
              className="text-sm text-primary font-medium hover:underline"
              onClick={() => navigate('/auth')}
            >
              Sign in
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Signup;