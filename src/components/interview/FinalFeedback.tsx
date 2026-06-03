import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw, BookOpen, Sparkles, Target, Bot,
  ChevronRight, Loader2, CheckCircle2,
} from "lucide-react";

interface Insight {
  category: string;
  title: string;
  content: string;
}

export type InsightState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; insights: Insight[]; quality: string }
  | { status: "error" };

interface FinalFeedbackProps {
  university: string;
  programName: string;
  insightState: InsightState;
  onReset: () => void;
  onContinue: () => void;
}

const categoryColors: Record<string, string> = {
  "Academic Interests":               "bg-blue-50 border-blue-200 text-blue-700",
  "Leadership & Initiative":          "bg-violet-50 border-violet-200 text-violet-700",
  "Personal Growth":                  "bg-emerald-50 border-emerald-200 text-emerald-700",
  "Values & Motivations":             "bg-amber-50 border-amber-200 text-amber-700",
  "Admissions Storytelling Potential":"bg-pink-50 border-pink-200 text-pink-700",
  "Career Goals":                     "bg-indigo-50 border-indigo-200 text-indigo-700",
  "Intellectual Curiosity":           "bg-cyan-50 border-cyan-200 text-cyan-700",
  "Community Impact":                 "bg-teal-50 border-teal-200 text-teal-700",
  "Resilience & Challenges":          "bg-orange-50 border-orange-200 text-orange-700",
  "Family & Background":              "bg-rose-50 border-rose-200 text-rose-700",
};

const defaultColor = "bg-slate-50 border-slate-200 text-slate-700";

const howWeUseCards = [
  { icon: <BookOpen className="h-4 w-4" />, text: "Essay feedback will be tailored to your experiences and voice" },
  { icon: <CheckCircle2 className="h-4 w-4" />, text: "Recommendation letter guidance will reflect your achievements and strengths" },
  { icon: <Target className="h-4 w-4" />, text: "Application coaching will align with your goals, motivations, and future plans" },
  { icon: <Bot className="h-4 w-4" />, text: "Eva will remember your story and provide more relevant support throughout your journey" },
];

const FinalFeedback: React.FC<FinalFeedbackProps> = ({
  university,
  programName,
  insightState,
  onReset,
  onContinue,
}) => {
  const [revealed, setRevealed] = useState(false);

  const hasInsights = insightState.status === "success" && insightState.insights.length > 0;
  const isInsufficient = insightState.status === "success" && insightState.insights.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto space-y-5"
    >
      {/* ── Success header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/80 via-primary to-blue-600 p-8 text-white shadow-lg shadow-primary/20">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -mr-12 -mt-12" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 -ml-8 -mb-8" />
        <div className="relative space-y-3">
          <h2 className="text-2xl font-bold leading-snug">
            Thank You. That Was a Great Conversation.
          </h2>
          <p className="text-white/75 text-sm leading-relaxed">
            We know talking to an AI about yourself can feel a little unusual.
          </p>
          <p className="text-white/85 text-sm leading-relaxed">
            But the time you invested here was one of the most valuable parts of your Primrose journey.
            Throughout our conversation, we learned about your experiences, ambitions, challenges, and
            motivations. That understanding will help us provide more personalised feedback, stronger
            guidance, and a more accurate reflection of who you are throughout the admissions process.
          </p>
          <p className="text-white/75 text-sm leading-relaxed">
            The quality of the feedback you receive starts with the quality of the story you share.
            Your investment here will directly improve the results you see across The Primrose Review.
          </p>
        </div>
      </div>

      {/* ── How we'll use this ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-1">How We'll Use This Information</h3>
        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
          Everything you shared helps us better understand who you are, allowing us to provide guidance
          that reflects your unique background, experiences, and aspirations.
        </p>
        <div className="space-y-2.5">
          {howWeUseCards.map((card, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <div className="mt-0.5 shrink-0 text-primary/70">{card.icon}</div>
              <p className="text-sm text-slate-600">{card.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Discovery section ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-slate-800">Ready to see what stood out?</h3>
        </div>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
          During your conversation, Eva identified patterns, themes, and details that may help us
          better support your admissions journey.
        </p>

        {(insightState.status === "loading" || insightState.status === "idle") && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
            <p className="text-sm text-slate-400">Analysing your conversation...</p>
          </div>
        )}

        {insightState.status === "error" && (
          <div className="text-center py-6 space-y-2">
            <p className="text-sm text-slate-500">Something went wrong while analysing your conversation.</p>
            <p className="text-xs text-slate-400">Your conversation has been saved and will inform future feedback.</p>
          </div>
        )}

        {insightState.status === "success" && !revealed && (
          <Button
            onClick={() => setRevealed(true)}
            className="w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow shadow-violet-200"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            Reveal My Insights
          </Button>
        )}

        {insightState.status === "success" && revealed && isInsufficient && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-2"
            >
              <p className="font-semibold text-slate-700">We're still getting to know you.</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                Your conversation gave us a great starting point, but we need a little more information
                before we can identify meaningful personal insights. As you continue using The Primrose
                Review, we'll build a richer understanding of your story, experiences, and goals.
              </p>
            </motion.div>
          </AnimatePresence>
        )}

        {insightState.status === "success" && revealed && hasInsights && (
          <AnimatePresence>
            <div className="space-y-3">
              {insightState.insights.map((insight, i) => {
                const colorClass = categoryColors[insight.category] ?? defaultColor;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`rounded-xl border p-4 space-y-1.5 ${colorClass}`}
                  >
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">
                      {insight.category}
                    </span>
                    <p className="font-semibold text-sm">{insight.title}</p>
                    <p className="text-sm opacity-80 leading-relaxed">{insight.content}</p>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* ── Buttons ── */}
      <div className="flex justify-between pb-2">
        <Button
          variant="outline"
          onClick={onReset}
          className="border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Start Over
        </Button>
        <Button onClick={onContinue} className="gap-2">
          Continue to Dashboard
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default FinalFeedback;
