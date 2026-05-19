import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { DemoNavigation } from "@/components/DemoNavigation";
import { Button } from "@/components/ui/button";
import { Rocket, CheckCircle2 } from "lucide-react";
import { useAuthState } from "@/hooks/useAuthState";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PreviewModeContext from "@/contexts/PreviewModeContext";
import { PreviewBanner } from "@/components/PreviewBanner";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Demo from "./pages/Demo";
import Students from "./pages/Students";
import Essays from "./pages/Essays";
import Applications from "./pages/Applications";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import StudentDashboard from "./pages/StudentDashboard";
import StudentPersonalArea from "./pages/StudentPersonalArea";
import StudentStats from "./pages/StudentStats";
import ParentPortal from "./pages/ParentPortal";
import SchoolActivities from "./pages/SchoolActivities";
import AddStudent from "./pages/AddStudent";
import CheckDeadlines from "./pages/CheckDeadlines";
import ViewReports from "./pages/ViewReports";
import StudentRecommendationLetters from "./pages/StudentRecommendationLetters";
import CounselorRecommendationLetters from "./pages/CounselorRecommendationLetters";
import EssayAnalytics from "./pages/EssayAnalytics";
import NotFound from "./pages/NotFound";
import TeacherRecommendationPage from "./pages/TeacherRecommendationPage";
import primroseLogo from "@/assets/primrose-logo.png";
import clientLogo from "@/assets/client-logo.jpg";
import { useSchoolLogo } from "@/hooks/useSchoolLogo";
import Signup from "./pages/SignUp";
import SubmitEssay from "./pages/SubmitEssay";
import ProtectedRoute from "./components/ProtectedRoute";
import AddApplication from "./pages/AddApplication";
import EditEssay from "./pages/EditEssay";
import StudentMessages from "./pages/StudentMessages";
import ParentMessages from "./pages/ParentMessages";
import PrincipalDashboard from "./pages/PrincipalDashboard";
import PrincipalStudents from "./pages/PrincipalStudents";
import PrincipalCounselors from "./pages/PrincipalCounselors";
import PrincipalActivities from "./pages/PrincipalActivities";
import PrincipalSettings from "./pages/PrincipalSettings";
import PrincipalAtRiskCriteria from "./pages/PrincipalAtRiskCriteria";
import OnboardingPage from "./pages/Onboarding";
import LoadingNew from "./pages/Loading-new";
import StatementPreview from "./pages/StatementPreview";
import OnboardingSuccess from "./pages/OnboardingSuccess";
import DemoMaker from "./pages/DemoMaker";
import ProductDemo from "./pages/ProductDemo";
import EssayToolkit from "./pages/EssayToolkit";
import PersonalEssay from "./pages/PersonalEssay";
import StudentFeedback from "./pages/StudentFeedback";
import SuperAdmin from "./pages/SuperAdmin";
import ResetPassword from "./pages/ResetPassword";
import EvaluationEngine from "./pages/EvaluationEngine";
import PrimroseLab from "./pages/PrimroseLab";
import ScholarshipFinder from "./pages/ScholarshipFinder";
import TuitionCalculator from "./pages/TuitionCalculator";
import StudentEditProfile from "./pages/StudentEditProfile";
import CounselorEditStudent from "./pages/CounselorEditStudent";
import WeeklyChallenge from "./pages/WeeklyChallenge";

const queryClient = new QueryClient();

// Layout component that conditionally shows sidebar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthState();
  const { data: schoolLogoUrl } = useSchoolLogo();
  const logoSrc = schoolLogoUrl ?? clientLogo;
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const noSidebarRoutes = ['/', '/auth', '/demo', '/product-demo', '/demo-maker', '/reset-password'];
  const isPreviewMode = location.pathname.startsWith('/preview/');
  const isStudentRoute =
  [
    '/student-dashboard',
    '/primrose-lab',
    '/scholarship-finder',
    '/tuition-calculator',
    '/student-personal-area',
    '/student-stats',
    '/student-recommendation-letters',
    '/student-messages',
    '/evaluation-engine',
    '/student-profile',
    '/weekly-challenge',
  ].includes(location.pathname) ||
  location.pathname === '/submit-essay' ||
  location.pathname === '/personal-essay' ||
  location.pathname === '/student-feedback' ||
  location.pathname === '/add-application';
  const showSidebar = !noSidebarRoutes.includes(location.pathname);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const checkOnboarding = async () => {
      const { data } = await supabase
        .from('onboarding_answers')
        .select('completed')
        .eq('user_id', user.id)
        .eq('completed', true)
        .maybeSingle();
      if (data?.completed) setOnboardingCompleted(true);
    };
    checkOnboarding();
  }, [isAuthenticated, user]);

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <PreviewModeContext.Provider value={isPreviewMode}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {isPreviewMode && <PreviewBanner />}

            {/* Header with Logos */}
            <header className="h-20 flex items-center justify-between border-b border-border bg-background px-4 shrink-0">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <img
                  src={primroseLogo}
                  alt="The Primrose Review"
                  className="h-12 w-auto"
                />
              </div>
              <div className="flex items-center gap-4">
                {isStudentRoute && !isPreviewMode && (
                  onboardingCompleted ? (
                    <Button
                      onClick={() => toast.success("You've completed your onboarding — welcome aboard! We're so excited to have you here.", { duration: 4000 })}
                      className="gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-medium transition-colors"
                      size="sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Onboarding Complete!
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate('/onboarding')}
                      className="gap-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border font-medium transition-colors"
                      size="sm"
                    >
                      <Rocket className="h-4 w-4" />
                      Complete full onboarding here
                    </Button>
                  )
                )}
                <img
                  src={logoSrc}
                  alt="School Logo"
                  className="h-16 w-auto rounded"
                />
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>

          {/* Demo Navigation - floating button */}
          {/* <DemoNavigation /> */}
        </div>
      </SidebarProvider>
    </PreviewModeContext.Provider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ── Public routes (no sidebar, no auth) ── */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/teacher-rec/:token" element={<TeacherRecommendationPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ── Counselor-only routes ── */}
          <Route path="/dashboard" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'admin']}>
                <Index />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/students" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'admin']}>
                <Students />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/essays" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'admin']}>
                <Essays />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/essay-analytics" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'admin']}>
                <EssayAnalytics />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/applications" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'admin']}>
                <Applications />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/recommendation-letters" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'admin']}>
                <CounselorRecommendationLetters />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/messages" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'admin']}>
                <Messages />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/notifications" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'admin']}>
                <Notifications />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/add-student" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'admin']}>
                <AddStudent />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/counselor/edit-student/:studentId" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'admin']}>
                <CounselorEditStudent />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/check-deadlines" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'admin']}>
                <CheckDeadlines />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/view-reports" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'admin']}>
                <ViewReports />
              </ProtectedRoute>
            </AppLayout>
          } />

          {/* ── Student-only routes ── */}
          <Route path="/student-profile" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <StudentEditProfile />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/student-dashboard" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            </AppLayout>
          } />

          {/* Edit Essay */}
          <Route path="/edit-essay" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <EditEssay />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/student-personal-area" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <StudentPersonalArea />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/submit-essay" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <SubmitEssay />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/student-recommendation-letters" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <StudentRecommendationLetters />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/student-stats" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <StudentStats />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/add-application" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <AddApplication />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/student-messages" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <StudentMessages />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/personal-essay" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <PersonalEssay />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/student-feedback" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <StudentFeedback />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/evaluation-engine" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <EvaluationEngine />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/primrose-lab" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <PrimroseLab />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/scholarship-finder" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <ScholarshipFinder />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/tuition-calculator" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <TuitionCalculator />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/weekly-challenge" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['student']}>
                <WeeklyChallenge />
              </ProtectedRoute>
            </AppLayout>
          } />

          {/* ── Parent-only routes ── */}
          <Route path="/parent-portal" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentPortal />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/school-activities" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['parent']}>
                <SchoolActivities />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/parent-messages" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentMessages />
              </ProtectedRoute>
            </AppLayout>
          } />

          {/* ── Principal-only routes ── */}
          <Route path="/principal-dashboard" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['principal']}>
                <PrincipalDashboard />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/principal-students" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['principal']}>
                <PrincipalStudents />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/principal-counselors" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['principal']}>
                <PrincipalCounselors />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/principal-activities" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['principal']}>
                <PrincipalActivities />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/principal-at-risk-criteria" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['principal']}>
                <PrincipalAtRiskCriteria />
              </ProtectedRoute>
            </AppLayout>
          } />

          <Route path="/principal-settings" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['principal']}>
                <PrincipalSettings />
              </ProtectedRoute>
            </AppLayout>
          } />

          {/* ── Onboarding ── */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/loading-new" element={<LoadingNew />} />
          <Route path="/statement-preview" element={<StatementPreview />} />
          <Route path="/onboarding-success" element={<OnboardingSuccess />} />

          {/* ── Demo & Toolkit ── */}
          <Route path="/product-demo" element={<ProductDemo />} />
          <Route path="/demo-maker" element={<DemoMaker />} />
          <Route path="/essay-toolkit" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'admin']}>
                <EssayToolkit />
              </ProtectedRoute>
            </AppLayout>
          } />

          {/* ── Student Experience Preview routes (counselor + principal) ── */}
          <Route path="/preview/student-dashboard" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'principal', 'admin']}>
                <StudentDashboard />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/preview/primrose-lab" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'principal', 'admin']}>
                <PrimroseLab />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/preview/student-personal-area" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'principal', 'admin']}>
                <StudentPersonalArea />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/preview/student-recommendation-letters" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'principal', 'admin']}>
                <StudentRecommendationLetters />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/preview/student-stats" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'principal', 'admin']}>
                <StudentStats />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/preview/student-messages" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'principal', 'admin']}>
                <StudentMessages />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/preview/student-feedback" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'principal', 'admin']}>
                <StudentFeedback />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/preview/evaluation-engine" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'principal', 'admin']}>
                <EvaluationEngine />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/preview/submit-essay" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'principal', 'admin']}>
                <SubmitEssay />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/preview/add-application" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'principal', 'admin']}>
                <AddApplication />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/preview/personal-essay" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'principal', 'admin']}>
                <PersonalEssay />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/preview/scholarship-finder" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'principal', 'admin']}>
                <ScholarshipFinder />
              </ProtectedRoute>
            </AppLayout>
          } />
          <Route path="/preview/tuition-calculator" element={
            <AppLayout>
              <ProtectedRoute allowedRoles={['counselor', 'principal', 'admin']}>
                <TuitionCalculator />
              </ProtectedRoute>
            </AppLayout>
          } />

          {/* ── Super Admin (standalone, no sidebar) ── */}
          <Route path="/superadmin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SuperAdmin />
            </ProtectedRoute>
          } />

          {/* ── Catch-all ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </QueryClientProvider>
  );
};

export default App;