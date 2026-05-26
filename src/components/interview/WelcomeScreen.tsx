
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, ArrowRight, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface WelcomeScreenProps {
  programName: string;
  setProgramName: (name: string) => void;
  university: string;
  setUniversity: (val: string) => void;
  startInterview: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  programName,
  setProgramName,
  university,
  setUniversity,
  startInterview
}) => {
  const [step, setStep] = useState(1);

  const handleStartInterview = () => {
    if (!programName) {
      toast.warning("Please enter a program name first");
      return;
    }
    startInterview();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-xl mx-auto"
    >
      {/* Hero card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-6 text-center shadow-sm">
        <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-primary/20"
          />
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/80 via-primary to-blue-600 flex items-center justify-center shadow-xl shadow-primary/20 relative z-10">
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
            <Volume2 className="h-7 w-7 text-white/90" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">AI Interview Practice</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Practice your university admissions interview with Eva, your AI interviewer.
          She'll ask real questions, listen to your answers, and guide you through the session.
        </p>
      </div>

      {/* Setup card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-center mb-6 gap-2">
          <GraduationCap className="h-5 w-5 text-slate-400" />
          <h3 className="text-base font-semibold text-slate-700">Set Up Your Interview</h3>
        </div>

        <div className="space-y-6 mb-8">
          <div className={`transition-all duration-500 ${step === 1 ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
            <Label htmlFor="university" className="text-sm font-medium text-slate-600 block mb-2">
              Which university are you applying to?
            </Label>
            <Select
              value={university}
              onValueChange={val => {
                setUniversity(val);
                setTimeout(() => setStep(2), 300);
              }}
            >
              <SelectTrigger className="h-12 border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/30">
                <SelectValue placeholder="Select a university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Harvard University">Harvard University</SelectItem>
                <SelectItem value="Stanford University">Stanford University</SelectItem>
                <SelectItem value="MIT">Massachusetts Institute of Technology</SelectItem>
                <SelectItem value="Oxford University">Oxford University</SelectItem>
                <SelectItem value="Cambridge University">Cambridge University</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={`transition-all duration-500 ${step === 2 ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
            <Label htmlFor="program-name" className="text-sm font-medium text-slate-600 block mb-2">
              Which program at {university} are you applying to?
            </Label>
            <Input
              id="program-name"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g., Computer Science, Business Administration"
              className="h-12 border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/30"
              onKeyDown={(e) => e.key === "Enter" && handleStartInterview()}
            />
          </div>
        </div>

        <Button
          onClick={handleStartInterview}
          className={`w-full h-12 rounded-xl transition-all duration-300 ${step === 1 ? "opacity-40 pointer-events-none" : "opacity-100"}`}
          size="lg"
          disabled={step === 1}
        >
          <BookOpen className="mr-2 h-5 w-5" />
          Begin Practice Interview
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="mt-4 text-center text-xs text-slate-400">
          Make sure your microphone is enabled — Eva will speak and listen in real time
        </p>
      </div>
    </motion.div>
  );
};

export default WelcomeScreen;
