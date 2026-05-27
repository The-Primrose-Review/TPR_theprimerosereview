
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, ArrowRight, Volume2, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";
import { backgroundStep } from "@/data/steps/background";
import { cn } from "@/lib/utils";

const universityQuestion = backgroundStep.questions[0] as any;
const universities: string[] = universityQuestion.subQuestions[0].options;

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
  const [open, setOpen] = useState(false);
  const [customUniversity, setCustomUniversity] = useState("");

  const isOther = university === "Other";
  const effectiveUniversity = isOther ? customUniversity : university;

  const handleSelectUniversity = (val: string) => {
    setUniversity(val);
    setOpen(false);
    if (val !== "Other") {
      setTimeout(() => setStep(2), 300);
    }
  };

  const handleCustomUniversityNext = () => {
    if (!customUniversity.trim()) {
      toast.warning("Please enter your university name");
      return;
    }
    setStep(2);
  };

  const handleStartInterview = () => {
    if (!programName) {
      toast.warning("Please enter a program name first");
      return;
    }
    if (isOther) {
      setUniversity(customUniversity.trim());
    }
    startInterview();
  };

  const canProceed = step === 2;

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

        <div className="space-y-4 mb-8">

          {/* Step 1 — University picker */}
          <div className={`transition-all duration-500 ${step >= 1 ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
            <Label className="text-sm font-medium text-slate-600 block mb-2">
              Which university are you applying to?
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full h-12 justify-between border-slate-200 text-slate-700 font-normal hover:bg-slate-50"
                >
                  {university ? university : "Search universities..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
                <Command>
                  <CommandInput placeholder="Search universities..." className="h-10" />
                  <CommandList className="max-h-64">
                    <CommandEmpty>No university found.</CommandEmpty>
                    <CommandGroup>
                      {universities.map((uni) => (
                        <CommandItem
                          key={uni}
                          value={uni}
                          onSelect={handleSelectUniversity}
                        >
                          <Check className={cn("mr-2 h-4 w-4", university === uni ? "opacity-100" : "opacity-0")} />
                          {uni}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* "Other" custom university input */}
          {isOther && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Label className="text-sm font-medium text-slate-600 block">
                Enter your university name
              </Label>
              <div className="flex gap-2">
                <Input
                  value={customUniversity}
                  onChange={(e) => setCustomUniversity(e.target.value)}
                  placeholder="e.g., University of Cape Town"
                  className="h-12 border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/30"
                  onKeyDown={(e) => e.key === "Enter" && handleCustomUniversityNext()}
                />
                <Button
                  onClick={handleCustomUniversityNext}
                  className="h-12 px-4 shrink-0"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Program input */}
          <div className={`transition-all duration-500 ${step === 2 ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
            <Label className="text-sm font-medium text-slate-600 block mb-2">
              Which program at {effectiveUniversity || university} are you applying to?
            </Label>
            <Input
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
          className={`w-full h-12 rounded-xl transition-all duration-300 ${!canProceed ? "opacity-40 pointer-events-none" : "opacity-100"}`}
          size="lg"
          disabled={!canProceed}
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
