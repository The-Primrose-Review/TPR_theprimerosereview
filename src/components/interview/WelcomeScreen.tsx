
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, GraduationCap, ArrowRight, Mic } from "lucide-react";
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
    <div className="max-w-xl mx-auto animate-fade-in">
      {/* Hero card */}
      <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-8 mb-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Mic className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">AI Interview Practice</h2>
        <p className="text-violet-200 text-sm leading-relaxed">
          Practice your university admissions interview with Eva, your AI interviewer.
          She'll ask real questions, listen to your answers, and guide you through the session.
        </p>
      </div>

      {/* Setup card */}
      <div className="backdrop-blur-sm bg-white/90 p-8 rounded-2xl shadow-lg border border-violet-200 transition-all duration-500">
        <div className="flex items-center justify-center mb-6">
          <GraduationCap className="h-6 w-6 text-violet-700 mr-2" />
          <h3 className="text-lg font-semibold text-violet-900">Set Up Your Interview</h3>
        </div>

        <div className="space-y-6 mb-8">
          <div className={`transition-all duration-500 ${step === 1 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
            <Label htmlFor="university" className="text-sm font-medium text-violet-900 block mb-2">
              Which university are you applying to?
            </Label>
            <Select
              value={university}
              onValueChange={val => {
                setUniversity(val);
                setTimeout(() => setStep(2), 300);
              }}
            >
              <SelectTrigger className="h-12 border-violet-200 focus:border-violet-700 focus:ring-2 focus:ring-violet-200 transition-all duration-300">
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

          <div className={`transition-all duration-500 ${step === 2 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
            <Label htmlFor="program-name" className="text-sm font-medium text-violet-900 block mb-2">
              Which program at {university} are you applying to?
            </Label>
            <Input
              id="program-name"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g., Computer Science, Business Administration, History"
              className="h-12 border-violet-200 focus:border-violet-700 focus:ring-2 focus:ring-violet-200 transition-all duration-300"
              onKeyDown={(e) => e.key === "Enter" && handleStartInterview()}
            />
          </div>
        </div>

        <Button
          onClick={handleStartInterview}
          className={`w-full bg-violet-700 hover:bg-violet-800 text-white transition-all duration-300 h-12 rounded-xl ${step === 1 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
          size="lg"
          disabled={step === 1}
        >
          <BookOpen className="mr-2 h-5 w-5" />
          Begin Practice Interview
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Make sure your microphone is enabled — Eva will speak and listen in real time
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
