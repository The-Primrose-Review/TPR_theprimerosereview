
import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-slate-800">Interview Complete</h2>
      </div>
      <p className="text-xs text-slate-400 mb-6">{university} — {programName}</p>

      {/* Celebration banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/80 via-primary to-blue-600 p-6 text-white mb-6 shadow-lg shadow-primary/20">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -mr-8 -mt-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 -ml-6 -mb-6" />
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold mb-1">Great work completing your practice session!</h3>
          <p className="text-white/70 text-sm">
            Eva provided verbal feedback throughout your interview. Review the tips below and keep practicing — each session builds real confidence.
          </p>
        </div>
      </div>

      <Tabs defaultValue="next-steps" className="w-full">
        <TabsList className="mb-6 grid grid-cols-2 h-auto bg-slate-100 border border-slate-200">
          <TabsTrigger value="next-steps" className="py-2 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Next Steps</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="tips" className="py-2 data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>Interview Tips</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="next-steps">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-4">What to do after this session</h3>
            <div className="space-y-3">
              {nextSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{idx + 1}</span>
                  </div>
                  <p className="text-sm text-slate-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tips">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-4">Admissions interview best practices</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviewTips.map((tip, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-primary/70 shrink-0" />
                    <h4 className="text-sm font-semibold text-slate-700">{tip.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{tip.body}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={onReset}
          className="border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Practice Again
        </Button>
        <Button
          onClick={() => toast.success("Great practice session!", { description: "Keep practicing to build confidence." })}
        >
          Done
        </Button>
      </div>
    </motion.div>
  );
};

export default FinalFeedback;
