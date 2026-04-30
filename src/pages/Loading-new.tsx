
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuthState } from "@/hooks/useAuthState";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const LoadingNew = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { answers } = location.state || {};
  const { toast: uiToast } = useToast();
  const { isAuthenticated, user } = useAuthState();
  const [status, setStatus] = useState<"saving" | "redirecting" | "error">("saving");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const storedAnswers = sessionStorage.getItem('onboardingAnswers');
  const onboardingAnswers = answers || (storedAnswers ? JSON.parse(storedAnswers) : {});

  useEffect(() => {
    const timeoutId = setTimeout(() => setTimeoutReached(true), 10000);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!answers) {
      uiToast({ title: "Missing information", description: "We couldn't find your responses. Please start again.", variant: "destructive" });
      navigate('/');
      return;
    }
    try {
      sessionStorage.setItem('onboardingAnswers', JSON.stringify(answers));
    } catch (error) { console.error("Error saving to session storage:", error); }

    const saveAndRedirect = async () => {
      try {
        if (isAuthenticated && user) {
          const timeoutId = setTimeout(() => handleRedirect(), 5000);
          try {
            await supabase.from('onboarding_answers').delete().eq('user_id', user.id);
            const { gender, age_range, degree_type, degree_interest, universities, program, field_of_study, work_experience_years, responsibilities, multiple_positions, long_term_goals } = onboardingAnswers;
            const inspirational_figures = onboardingAnswers.inspirational_figures;
            const challenge = onboardingAnswers.challenge;
            await supabase.from('onboarding_answers').insert({
              user_id: user.id, answers, completed: true,
              gender, age_range, degree_type,
              inspiration: inspirational_figures ? inspirational_figures.toString() : '',
              personal_story: challenge || '', degree_interest, university_name: universities,
              program, years_experience: work_experience_years?.toString(), background: field_of_study,
              career_goals: long_term_goals, personal_strengths: responsibilities || multiple_positions,
              updated_at: new Date().toISOString()
            });
            clearTimeout(timeoutId);
          } catch (dbError) {
            console.error("Error during database operations:", dbError);
            clearTimeout(timeoutId);
          }
        }
        handleRedirect();
      } catch (error) {
        console.error("Error in saveAndRedirect:", error);
        setStatus("error");
        setErrorMessage("We had trouble processing your information. You can still continue.");
        setTimeout(() => handleRedirect(), 2000);
      }
    };

    const handleRedirect = () => {
      setStatus("redirecting");
      navigate('/student-dashboard', { replace: true });
    };

    saveAndRedirect();
  }, [answers, navigate, uiToast, isAuthenticated, user]);

  const handleRetry = () => {
    setTimeoutReached(false);
    setStatus("saving");
    setErrorMessage(null);
    try {
      sessionStorage.setItem('onboardingAnswers', JSON.stringify(answers));
      toast.success("Continuing to next step...");
      navigate('/student-dashboard', { replace: true });
    } catch (error) {
      setStatus("error");
      setErrorMessage("We had trouble processing your information. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === "saving" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Saving your information</h2>
            <p className="text-gray-600">This will only take a moment...</p>
            {timeoutReached && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-amber-600 mb-3">Taking longer than expected...</p>
                <Button onClick={handleRetry} className="flex items-center justify-center mx-auto" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" /> Continue Anyway
                </Button>
              </div>
            )}
          </>
        )}
        {status === "redirecting" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Almost there!</h2>
            <p className="text-gray-600">Redirecting you to continue...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="bg-red-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
            <p className="text-gray-600 mb-4">{errorMessage || "Something went wrong. Redirecting you to continue..."}</p>
            <Button onClick={handleRetry} className="flex items-center justify-center mx-auto">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoadingNew;
