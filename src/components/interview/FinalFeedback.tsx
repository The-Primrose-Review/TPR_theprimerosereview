
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, CheckCircle, Star, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface FinalFeedbackProps {
  university: string;
  programName: string;
  onReset: () => void;
}

const nextSteps = [
  "Schedule 2–3 more practice sessions to build confidence and consistency",
  "Research recent faculty publications and news at your target program",
  "Prepare a concise 90-second personal narrative about your academic journey",
  "Record yourself answering common questions to review your body language and pacing",
  "Ask a mentor, counselor, or teacher to conduct a mock interview with you",
];

const interviewTips = [
  {
    title: "Use the STAR method",
    body: "When answering behavioral questions, structure your answer: Situation, Task, Action, Result. It keeps your answer focused and compelling."
  },
  {
    title: "Specificity wins",
    body: "Vague answers like \"I am a hard worker\" are forgettable. Specific examples — a project, a moment, a number — make you memorable."
  },
  {
    title: "Show genuine curiosity",
    body: "Research the program deeply before your interview. Mention specific professors, courses, or research that excites you."
  },
  {
    title: "Embrace the pause",
    body: "It's fine to take 2–3 seconds to think before answering. Rushing into a rambling answer is worse than a brief pause."
  },
  {
    title: "End with questions",
    body: "Always have 2–3 thoughtful questions ready for your interviewer. It signals genuine interest and intellectual curiosity."
  },
  {
    title: "Authenticity over perfection",
    body: "Admissions interviewers are not looking for a perfect script. They want to see who you really are and how you think."
  },
];

const FinalFeedback: React.FC<FinalFeedbackProps> = ({ university, programName, onReset }) => {
  return (
    <div className="max-w-4xl mx-auto backdrop-blur-sm bg-white/90 p-8 rounded-2xl shadow-lg border border-violet-200 transition-all duration-500 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-2">
        <GraduationCap className="h-6 w-6 text-violet-700" />
        <h2 className="text-2xl font-semibold text-violet-900">
          Interview Complete
        </h2>
      </div>
      <p className="text-sm text-neutral-500 mb-6">
        {university} — {programName}
      </p>

      {/* Celebration banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 p-6 text-white mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -mr-8 -mt-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-violet-400/10 -ml-6 -mb-6" />
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-1">Great work completing your practice session!</h3>
          <p className="text-violet-200 text-sm">
            Eva provided verbal feedback throughout your interview. Review the tips below and keep practicing — each session builds real confidence.
          </p>
        </div>
      </div>

      <Tabs defaultValue="next-steps" className="w-full">
        <TabsList className="mb-6 grid grid-cols-2 h-auto">
          <TabsTrigger value="next-steps" className="py-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Next Steps</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="tips" className="py-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>Interview Tips</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="next-steps" className="animate-fade-in">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-violet-900 mb-4">
                What to do after this session
              </h3>
              <div className="space-y-3">
                {nextSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-violet-100 bg-violet-50/50">
                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-violet-700">{idx + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="animate-fade-in">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-violet-900 mb-4">
                Admissions interview best practices
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {interviewTips.map((tip, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-violet-100 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-violet-500 shrink-0" />
                      <h4 className="text-sm font-semibold text-violet-800">{tip.title}</h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{tip.body}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={onReset}
          className="border-violet-200 text-violet-900 hover:bg-violet-50 transition-all duration-300 flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Practice Again
        </Button>
        <Button
          onClick={() => toast.success("Great practice session!", { description: "Keep practicing to build confidence." })}
          className="bg-violet-700 hover:bg-violet-800 text-white transition-all duration-300"
        >
          Done
        </Button>
      </div>
    </div>
  );
};

export default FinalFeedback;
