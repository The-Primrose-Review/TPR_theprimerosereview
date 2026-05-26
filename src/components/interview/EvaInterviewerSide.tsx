
import React from "react";
import { GraduationCap } from "lucide-react";
import { AnimatedText } from "./AnimatedText";
import LiveMicrophone from "./LiveMicrophone";

interface EvaInterviewerSideProps {
  isEvaSpeaking: boolean;
  evaTranscript: string;
  lastEvaUtterance: string;
  university?: string;
}

const EvaInterviewerSide: React.FC<EvaInterviewerSideProps> = ({
  isEvaSpeaking,
  evaTranscript,
  lastEvaUtterance,
  university,
}) => {
  const displayText = isEvaSpeaking ? evaTranscript : lastEvaUtterance;
  const placeholderText = "Eva is getting ready to speak...";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-2 mb-4">
        <GraduationCap className="h-5 w-5 text-violet-700" />
        <h2 className="text-xl font-semibold text-violet-900">
          Eva — {university || "Admissions"} Interviewer
        </h2>
      </div>

      <div className="flex-1 relative p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border-2 border-violet-200 transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-center mb-6">
          <LiveMicrophone
            isActive={isEvaSpeaking}
            size="lg"
            altText="Eva AI Interviewer"
          />
        </div>

        <div className="mt-6 bg-white p-5 rounded-xl border border-violet-200 shadow-sm min-h-[120px] flex items-start">
          {displayText ? (
            <AnimatedText
              text={displayText}
              className="text-base text-violet-900 leading-relaxed"
              key={displayText}
            />
          ) : (
            <p className="text-sm text-neutral-400 italic">{placeholderText}</p>
          )}
        </div>

        {isEvaSpeaking && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-end h-4 space-x-0.5">
              <div className="w-0.5 h-2 bg-violet-400 animate-sound-wave-1"></div>
              <div className="w-0.5 h-3 bg-violet-400 animate-sound-wave-2"></div>
              <div className="w-0.5 h-4 bg-violet-400 animate-sound-wave-3"></div>
              <div className="w-0.5 h-3 bg-violet-400 animate-sound-wave-2"></div>
              <div className="w-0.5 h-2 bg-violet-400 animate-sound-wave-1"></div>
            </div>
            <span className="text-xs text-violet-600">Eva is speaking...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaInterviewerSide;
