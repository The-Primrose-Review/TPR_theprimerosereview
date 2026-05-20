import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, GraduationCap, Users, UserCircle, Building2 } from "lucide-react";
import primroseLogo from "@/assets/primrose-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') as 'counselor' | 'student' | 'parent' | 'principal' | 'teacher' | null;
  const isAdminLogin = searchParams.get('admin') === '1';
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'counselor' | 'student' | 'parent' | 'principal' | 'teacher' | null>(roleParam);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setForgotLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'counselor': return <GraduationCap className="h-8 w-8" />;
      case 'student': return <Users className="h-8 w-8" />;
      case 'parent': return <UserCircle className="h-8 w-8" />;
      case 'principal': return <Building2 className="h-8 w-8" />;
      default: return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'counselor': return 'Counselor';
      case 'student': return 'Student';
      case 'parent': return 'Parent';
      case 'principal': return 'Principal';
      default: return '';
    }
  };

  const navigateByRole = (role: string) => {
    switch (role) {
      case 'counselor': navigate('/dashboard'); break;
      case 'student': navigate('/student-dashboard'); break;
      case 'parent': navigate('/parent-portal'); break;
      case 'principal': navigate('/principal-dashboard'); break;
      case 'teacher': navigate('/teacher-dashboard'); break;
      case 'admin': navigate('/superadmin'); break;
      default: navigate('/');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole && !isAdminLogin) {
      toast.error("Please select a role");
      return;
    }
    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .single();

      if (roleError || !roleData) throw new Error('Could not fetch user role');

      // Admin bypasses role selector — navigate directly
      if (roleData.role === 'admin') {
        toast.success('Welcome back!');
        navigate('/superadmin');
        return;
      }

      // Validate that the selected role matches the actual role in the DB
      if (roleData.role !== selectedRole) {
        await supabase.auth.signOut();
        toast.error(
          `This account is registered as a ${getRoleLabel(roleData.role)}, not a ${getRoleLabel(selectedRole)}. Please select the correct role.`
        );
        return;
      }

      toast.success(`Welcome back!`);
      navigateByRole(roleData.role);

    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">

        {/* Top row */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {/* <Button variant="outline" size="sm" onClick={() => navigate('/demo')}>
            View Demo
          </Button> */}
        </div>

        {/* Logo */}
        <div className="flex justify-center">
          <img src={primroseLogo} alt="The Primrose Review" className="h-16 w-auto" />
        </div>

        <Card className="p-6 space-y-6">
          {!showForgotPassword && (
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Sign in as:</h1>
            </div>
          )}

          {/* Forgot Password View */}
          {showForgotPassword && (
            <>
              <div className="text-center">
                <h2 className="text-lg font-semibold">Reset your password</h2>
                <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send you a reset link.</p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={forgotLoading}>
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
              <button
                type="button"
                className="block w-full text-sm text-muted-foreground hover:underline text-center"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to sign in
              </button>
            </>
          )}

          {/* Login Form */}
          {!showForgotPassword && (selectedRole || isAdminLogin) && (
            <>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                {getRoleIcon(selectedRole)}
                <span>Signing in as <strong>{getRoleLabel(selectedRole)}</strong></span>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => { setForgotEmail(email); setShowForgotPassword(true); }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Please wait...' : 'Sign In'}
                </Button>
              </form>

              <button
                type="button"
                className="block w-full text-sm text-muted-foreground hover:underline text-center"
                onClick={() => setSelectedRole(null)}
              >
                Change role
              </button>
            </>
          )}

          {/* Role Selection — only show when no role selected and not in forgot-password view */}
          {!showForgotPassword && !selectedRole && !isAdminLogin && (
            <div className="grid grid-cols-2 gap-3">
              {(['counselor', 'student', 'parent', 'principal'] as const).map((role) => (
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

          {/* Bottom: Sign up link — hidden for students and forgot-password view */}
          {!showForgotPassword && selectedRole !== 'student' && (
            <div className="text-center pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Don't have an account? </span>
              <button
                type="button"
                className="text-sm text-primary font-medium hover:underline"
                onClick={() => navigate('/signup')}
              >
                Sign up here
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Auth;