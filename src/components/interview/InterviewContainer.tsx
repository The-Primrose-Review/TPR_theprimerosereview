
import React from "react";
import EvaInterviewerSide from "./EvaInterviewerSide";
import UserResponseSide from "./UserResponseSide";

interface InterviewContainerProps {
  isEvaSpeaking: boolean;
  isStudentSpeaking: boolean;
  evaTranscript: string;
  lastEvaUtterance: string;
  studentTranscript: string;
  isConnected: boolean;
  connectionState: string;
  endInterview: () => void;
  university?: string;
}

const InterviewContainer: React.FC<InterviewContainerProps> = ({
  isEvaSpeaking,
  isStudentSpeaking,
  evaTranscript,
  lastEvaUtterance,
  studentTranscript,
  isConnected,
  connectionState,
  endInterview,
  university,
}) => {
  const getStatusMessage = () => {
    if (!isConnected) return "Connecting...";
    if (isEvaSpeaking) return "Eva is speaking — listen carefully";
    if (isStudentSpeaking) return "Eva is listening to your response...";
    return "Waiting for the next exchange...";
  };

  return (
    <div className="max-w-5xl mx-auto backdrop-blur-lg bg-white/90 p-6 md:p-8 rounded-2xl shadow-xl border border-violet-200 transition-all duration-700 opacity-100 scale-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[650px]">
        <EvaInterviewerSide
          isEvaSpeaking={isEvaSpeaking}
          evaTranscript={evaTranscript}
          lastEvaUtterance={lastEvaUtterance}
          university={university}
        />

        <UserResponseSide
          isStudentSpeaking={isStudentSpeaking}
          studentTranscript={studentTranscript}
          endInterview={endInterview}
        />
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'} ${isEvaSpeaking || isStudentSpeaking ? 'animate-pulse' : ''}`} />
        <p className="text-sm text-violet-700 text-center">
          {getStatusMessage()}
        </p>
      </div>
    </div>
  );
};

export default InterviewContainer;
