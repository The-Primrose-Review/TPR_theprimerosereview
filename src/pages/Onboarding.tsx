
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Trophy, Star, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { QuestionInput } from "@/components/QuestionInput";
import { steps } from "@/data/onboardingSteps";
import { LoadingTransition } from "@/components/LoadingTransition";
import { UniversityLoadingTransition } from "@/components/UniversityLoadingTransition";
import { AchievementsLoadingTransition } from "@/components/AchievementsLoadingTransition";
import { AchievementLoadingTransition } from "@/components/AchievementLoadingTransition";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from "@/hooks/useAuthState";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import OnboardingTOC from "@/components/onboarding/OnboardingTOC";
import { useIsMobile } from "@/hooks/use-mobile";

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isNextHovered, setIsNextHovered] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showUniversityLoading, setShowUniversityLoading] = useState(false);
  const [showAchievementsLoading, setShowAchievementsLoading] = useState(false);
  const [showAchievementLoading, setShowAchievementLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anonymousId, setAnonymousId] = useState<string>("");
  // const [hasPremiumAccess, setHasPremiumAccess] = useState(false); // premium gating disabled
  const hasPremiumAccess = true;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthState();
  const { toast: uiToast } = useToast();
  const isMobile = useIsMobile();

  /* Premium gating disabled — all questions are accessible
  useEffect(() => {
    const premiumUnlocked = localStorage.getItem('premiumUnlocked') === 'true';
    const fromMemberArea = location.state?.fromMemberArea && location.state?.premiumUnlocked;
    setHasPremiumAccess(premiumUnlocked || fromMemberArea);
    if (fromMemberArea) localStorage.setItem('premiumUnlocked', 'true');
    if (location.state?.startFromQuestion && location.state?.premiumUnlocked) {
      const startStep = Math.floor(location.state.startFromQuestion / 2);
      setCurrentStep(startStep);
      setCurrentQuestion(location.state.startFromQuestion % 2);
      setHasPremiumAccess(true);
      localStorage.setItem('premiumUnlocked', 'true');
    }
  }, [location.state]);
  */

  useEffect(() => {
    const storedAnonymousId = localStorage.getItem('anonymousId');
    if (storedAnonymousId) {
      setAnonymousId(storedAnonymousId);
    } else {
      const newAnonymousId = uuidv4();
      localStorage.setItem('anonymousId', newAnonymousId);
      setAnonymousId(newAnonymousId);
    }
  }, []);

  useEffect(() => {
    const checkExistingOnboarding = async () => {
      if (!isAuthenticated || !user?.id) return;
      try {
        const { data, error } = await supabase
          .from('onboarding_answers')
          .select('completed, answers')
          .eq('user_id', user.id)
          .single();
        if (error && error.code !== 'PGRST116') return;
        if (data?.completed) { navigate('/student-dashboard'); return; }
        if (data?.answers && typeof data.answers === 'object') {
          setAnswers(data.answers as Record<string, any>);
          const savedStep = localStorage.getItem('onboarding_step');
          const savedQuestion = localStorage.getItem('onboarding_question');
          if (savedStep !== null) setCurrentStep(parseInt(savedStep, 10));
          if (savedQuestion !== null) setCurrentQuestion(parseInt(savedQuestion, 10));
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };
    checkExistingOnboarding();
  }, [isAuthenticated, user?.id, navigate]);

  const step = steps[currentStep];
  const question = step?.questions[currentQuestion];
  const questionText = question ? (typeof question.question === 'function' ? question.question(answers) : question.question) : '';
  const totalSteps = steps.length;

  const tocSteps = steps.map((step, index) => ({
    title: step.title,
    description: step.description,
    locked: false // index >= 4 && !hasPremiumAccess — premium gating disabled
  }));

  const totalQuestions = steps.reduce((acc, step) => acc + step.questions.length, 0);
  const currentQuestionOverall = steps.slice(0, currentStep).reduce((acc, step) => acc + step.questions.length, 0) + currentQuestion + 1;
  const progress = (currentQuestionOverall / totalQuestions) * 100;
  const storedAnswers = sessionStorage.getItem('onboardingAnswers');
  const onboardingAnswers = answers || (storedAnswers ? JSON.parse(storedAnswers) : {});
  const { gender, age_range, degree_type, inspiration, personal_story, degree_interest, universities, program, field_of_study, work_experience_years, company, position, responsibilities, multiple_positions, long_term_goals } = onboardingAnswers;
  const inspirational_figures = answers.inspirational_figures;
  const challenge = answers.challenge;

  const saveAnswersToSupabase = async () => {
    if (location.pathname === '/statement-preview') return;
    if (Object.keys(answers).length > 0 && anonymousId) {
      try {
        if (isAuthenticated && user) {
          await supabase.from('onboarding_answers').upsert({
            id: user.id, user_id: user.id, anonymous_id: anonymousId, answers,
            gender, age_range, degree_type,
            inspiration: inspirational_figures ? inspirational_figures.toString() : '',
            personal_story: challenge || '', degree_interest, university_name: universities,
            program, years_experience: work_experience_years?.toString(), background: field_of_study,
            career_goals: long_term_goals, personal_strengths: responsibilities || multiple_positions,
            updated_at: new Date().toISOString()
          }).select();
        } else {
          await supabase.from('onboarding_answers').upsert({
            id: anonymousId, anonymous_id: anonymousId, answers,
            gender, age_range, degree_type,
            inspiration: inspirational_figures ? inspirational_figures.toString() : '',
            personal_story: challenge || '', degree_interest, university_name: universities,
            program, years_experience: work_experience_years?.toString(), background: field_of_study,
            career_goals: long_term_goals, personal_strengths: responsibilities || multiple_positions,
            updated_at: new Date().toISOString()
          }).select();
        }
      } catch (error) {
        console.error("Error in saveAnswersToSupabase:", error);
      }
    }
  };

  const handleCompleteLater = async () => {
    await saveAnswersToSupabase();
    localStorage.setItem('onboarding_step', String(currentStep));
    localStorage.setItem('onboarding_question', String(currentQuestion));
    navigate('/student-dashboard');
  };

  const handleNext = async () => {
    if (!question) return;
    const currentAnswer = answers[question.id];
    const isOptionalQuestion = 'optional' in question && question.optional;
    if (!isOptionalQuestion && (!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0))) {
      uiToast({ title: "Please provide an answer", description: "This question requires an answer before continuing.", variant: "destructive" });
      return;
    }
    if (question.type === "text" && 'validation' in question && question.validation) {
      const error = question.validation(currentAnswer);
      if (error) { uiToast({ title: "Invalid input", description: error, variant: "destructive" }); return; }
    }
    await saveAnswersToSupabase();
    const nextStepIndex = currentQuestion < step.questions.length - 1 ? currentStep : currentStep + 1;
    /* Premium gating disabled — no longer redirecting at step 4
    if (nextStepIndex >= 4 && !hasPremiumAccess) {
      try {
        sessionStorage.setItem('onboardingAnswers', JSON.stringify(answers));
        sessionStorage.setItem('anonymousId', anonymousId);
        localStorage.setItem('onboardingAnswers', JSON.stringify(answers));
        localStorage.setItem('anonymousId', anonymousId);
      } catch (e) { console.error('Failed to persist onboarding answers before auth redirect', e); }
      if (!isAuthenticated) {
        navigate("/sign-up", { state: { redirectAfterAuth: "/statement-preview", fromOnboarding: true, anonymousId, answers } });
      } else {
        navigate("/statement-preview", { state: { answers, anonymousId } });
      }
      return;
    }
    */
    if (question.type === "combined_cards") {
      if (question.id === "basic_info") {
        if (!currentAnswer?.age_range || !currentAnswer?.gender) {
          uiToast({ title: "Incomplete information", description: "Please provide both your age range and gender.", variant: "destructive" }); return;
        }
        setAnswers(prev => ({ ...prev, age_range: currentAnswer.age_range, gender: currentAnswer.gender }));
        setShowLoading(true);
        setTimeout(() => { setShowLoading(false); moveToNextQuestion(); }, 5000);
      } else if (question.id === "academic_info") {
        const isUniversityValid = currentAnswer?.universities && (currentAnswer.universities !== "Other" || (currentAnswer.universities === "Other" && currentAnswer.otherUniversity));
        if (!isUniversityValid || !currentAnswer?.program || !currentAnswer?.field_of_study) {
          uiToast({ title: "Incomplete information", description: "Please fill in all required academic information.", variant: "destructive" }); return;
        }
        setAnswers(prev => ({ ...prev, universities: currentAnswer.universities === "Other" ? currentAnswer.otherUniversity : currentAnswer.universities, program: currentAnswer.program, field_of_study: currentAnswer.field_of_study }));
        setShowUniversityLoading(true);
        setTimeout(() => { setShowUniversityLoading(false); moveToNextQuestion(); }, 5000);
      } else { moveToNextQuestion(); }
    } else if (question.id === "academic_achievements") {
      setShowAchievementsLoading(true);
      setTimeout(() => { setShowAchievementsLoading(false); moveToNextQuestion(); }, 5000);
    } else if (question.id === "achievement") {
      setShowAchievementLoading(true);
      setTimeout(() => { setShowAchievementLoading(false); moveToNextQuestion(); }, 5000);
    } else { moveToNextQuestion(); }
  };

  const moveToNextQuestion = async () => {
    if (!step) return;
    if (currentQuestion < step.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setCurrentQuestion(0);
    } else {
      try {
        sessionStorage.setItem('onboardingAnswers', JSON.stringify(answers));
        sessionStorage.setItem('anonymousId', anonymousId);
      } catch (error) { console.error("Error saving to session storage:", error); }
      try {
        await saveAnswersToSupabase();
        if (isAuthenticated && user) {
          await supabase.from('onboarding_answers').upsert({
            id: user.id, user_id: user.id, anonymous_id: anonymousId, answers, completed: true,
            gender, age_range, degree_type,
            inspiration: inspirational_figures ? inspirational_figures.toString() : '',
            personal_story: challenge || '', degree_interest, university_name: universities,
            program, years_experience: work_experience_years?.toString(), background: field_of_study,
            career_goals: long_term_goals, personal_strengths: responsibilities || multiple_positions,
            updated_at: new Date().toISOString()
          });
        } else {
          await supabase.from('onboarding_answers').upsert({
            id: anonymousId, anonymous_id: anonymousId, answers, completed: true,
            gender, age_range, degree_type,
            inspiration: inspirational_figures ? inspirational_figures.toString() : '',
            personal_story: challenge || '', degree_interest, university_name: universities,
            program, years_experience: work_experience_years?.toString(), background: field_of_study,
            career_goals: long_term_goals, personal_strengths: responsibilities || multiple_positions,
            updated_at: new Date().toISOString()
          });
        }
      } catch (error) { console.error("Error marking onboarding as completed:", error); }
      localStorage.removeItem('onboarding_step');
      localStorage.removeItem('onboarding_question');
      navigate("/loading-new", { state: { answers, anonymousId } });
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) { setCurrentQuestion(currentQuestion - 1); }
    else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setCurrentQuestion(steps[currentStep - 1].questions.length - 1);
    }
  };

  const handleInputChange = (value: any) => {
    if (!question) return;
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  };

  const handleNavigateToStep = (stepIndex: number) => {
    if (stepIndex <= currentStep && !tocSteps[stepIndex].locked) {
      setCurrentStep(stepIndex);
      setCurrentQuestion(0);
    }
  };

  const getStepIcon = (stepIndex: number) => {
    const stepQuestions = steps[stepIndex].questions;
    const isComplete = stepQuestions.every(q => answers[q.id]);
    return isComplete ? <Trophy className="w-4 h-4 text-green-500" /> : <Star className="w-4 h-4 text-neutral-400" />;
  };

  if (showLoading) return <LoadingTransition />;
  if (showUniversityLoading) return <UniversityLoadingTransition />;
  if (showAchievementsLoading) return <AchievementsLoadingTransition />;
  if (showAchievementLoading) return <AchievementLoadingTransition />;

  if (!step || !question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Loading questions...</p>
        <Button className="mt-4" onClick={() => { setCurrentStep(0); setCurrentQuestion(0); toast.error("Had to reset - please try again"); }}>Reset</Button>
      </div>
    );
  }

  // Premium gating disabled — all questions unlocked
  // const isPremiumStep = currentStep >= 4;
  // const needsPremiumAccess = isPremiumStep && !hasPremiumAccess;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="w-full bg-neutral-50 py-2 sm:py-3 px-3 sm:px-6 border-b fixed top-0 z-10 left-0">
        <div className="max-w-4xl mx-auto">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between items-center mt-2 sm:mt-3">
            <p className="text-xs sm:text-sm text-neutral-500">Step {currentStep + 1} of {totalSteps}</p>
            <div className="flex items-center gap-3">
              <p className="text-xs sm:text-sm text-neutral-500">{currentQuestionOverall}/{totalQuestions}</p>
              <button
                onClick={handleCompleteLater}
                className="text-xs text-neutral-400 hover:text-neutral-600 underline underline-offset-2 transition-colors"
              >
                Complete later
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-col md:flex-row'} gap-3 sm:gap-6 p-3 sm:p-6 mt-14 sm:mt-16`}>
        {!isMobile && (
          <div className="md:w-1/4 md:sticky md:top-24 md:self-start">
            <OnboardingTOC steps={tocSteps} currentStep={currentStep} onNavigateToStep={handleNavigateToStep} />
          </div>
        )}

        <div className={`${isMobile ? 'w-full' : 'md:w-3/4'} space-y-4 sm:space-y-6 animate-fade-in mt-2 sm:mt-4`}>
          {/* Premium lock screen disabled
          {needsPremiumAccess ? (
            <div className="bg-white p-4 sm:p-8 rounded-xl shadow-sm border border-neutral-100 text-center">
              <Lock className="w-12 sm:w-16 h-12 sm:h-16 text-neutral-400 mx-auto mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-3 sm:mb-4">Premium Content Locked</h2>
              <p className="text-base sm:text-lg text-neutral-600 mb-4 sm:mb-6">You've completed the free questions! Please authenticate first to see your preview statement and unlock premium access.</p>
              <Button onClick={() => {
                if (!isAuthenticated) {
                  navigate("/sign-up", { state: { redirectAfterAuth: "/statement-preview", fromOnboarding: true, anonymousId, answers } });
                } else {
                  navigate("/statement-preview", { state: { answers, anonymousId } });
                }
              }} className="px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg w-full sm:w-auto">
                {!isAuthenticated ? "Sign Up to Continue" : "See Your Preview Statement"}
              </Button>
            </div>
          ) : (
          */}
            <>
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-neutral-100">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-neutral-900 flex items-center gap-2">
                  {step.title}
                  {getStepIcon(currentStep)}
                  {/* isPremiumStep badge removed — gating disabled */}
                </h2>
                <p className="mt-2 text-sm sm:text-base md:text-lg text-neutral-600">{step.description}</p>
                <div className="mt-4 sm:mt-6 bg-blue-50 p-3 sm:p-5 rounded-lg border border-blue-100">
                  <p className="text-sm sm:text-base md:text-lg font-medium text-neutral-800">
                    {questionText}
                    {('optional' in question && question.optional) && <span className="text-xs sm:text-sm text-neutral-500 ml-2">(Optional)</span>}
                  </p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <QuestionInput question={question} value={answers[question.id]} onChange={handleInputChange} />
              </div>
            </>

          <div className="flex justify-between pt-3 sm:pt-4 sticky bottom-0 bg-white py-3 sm:py-4 border-t mt-6 sm:mt-8">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 && currentQuestion === 0} className="flex items-center gap-2 transition-all duration-300 hover:translate-x-[-4px] active:translate-y-[2px] text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2">
              <ArrowLeft className="w-3 sm:w-4 h-3 sm:h-4" /> Back
            </Button>
            {/* {!needsPremiumAccess && ( — always true, gating disabled */}
              <div className="flex gap-2">
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  onMouseEnter={() => setIsNextHovered(true)}
                  onMouseLeave={() => setIsNextHovered(false)}
                  className={`flex text-white items-center gap-2 transition-all duration-300 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2 ${isNextHovered ? 'scale-105 shadow-lg' : 'scale-100'} hover:translate-y-[-2px] active:translate-y-[1px]`}
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-3 sm:w-4 h-3 sm:h-4 animate-spin mr-2" />Submitting...</>
                  ) : (
                    <>{currentStep === steps.length - 1 && currentQuestion === step.questions.length - 1 ? "Finish" : "Continue"}<ArrowRight className={`w-3 sm:w-4 h-3 sm:h-4 transition-transform duration-300 ${isNextHovered ? 'translate-x-1' : ''}`} /></>
                  )}
                </Button>
              </div>
            {/* )} — closing of !needsPremiumAccess guard, removed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
