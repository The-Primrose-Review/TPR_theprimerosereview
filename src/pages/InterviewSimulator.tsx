
import React, { useState, useEffect } from "react";
import { useInterviewState } from "@/hooks/useInterviewState";
import { useRealtimeInterview } from "@/hooks/useRealtimeInterview";
import InterviewHeader from "@/components/interview/InterviewHeader";
import WelcomeScreen from "@/components/interview/WelcomeScreen";
import LoadingScreen from "@/components/interview/LoadingScreen";
import InterviewContainer from "@/components/interview/InterviewContainer";
import FinalFeedback from "@/components/interview/FinalFeedback";

type InterviewStatus = "idle" | "preparing" | "active" | "ended";

const InterviewSimulator = () => {
  const { programName, setProgramName, university, setUniversity, resetInterview } = useInterviewState();
  const [status, setStatus] = useState<InterviewStatus>("idle");

  const {
    connect,
    disconnect,
    connectionState,
    isConnected,
    isEvaSpeaking,
    isStudentSpeaking,
    evaTranscript,
    lastEvaUtterance,
    studentTranscript,
  } = useRealtimeInterview();

  // Transition to active once WebRTC connects, or back to idle on error
  useEffect(() => {
    if (connectionState === "connected" && status === "preparing") {
      setStatus("active");
    }
    if (connectionState === "error" && status === "preparing") {
      setStatus("idle");
    }
  }, [connectionState, status]);

  const handleStart = async () => {
    if (!programName) return;
    setStatus("preparing");
    await connect(programName, university);
  };

  const handleEnd = () => {
    disconnect();
    setStatus("ended");
  };

  const handleReset = () => {
    resetInterview();
    setStatus("idle");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-900">
      <div className="flex-1 container mx-auto px-4 py-12">
        <InterviewHeader status={status} university={university} />

        {status === "idle" && (
          <WelcomeScreen
            programName={programName}
            setProgramName={setProgramName}
            university={university}
            setUniversity={setUniversity}
            startInterview={handleStart}
          />
        )}

        {status === "preparing" && (
          <LoadingScreen programName={programName} university={university} />
        )}

        {status === "active" && (
          <InterviewContainer
            isEvaSpeaking={isEvaSpeaking}
            isStudentSpeaking={isStudentSpeaking}
            evaTranscript={evaTranscript}
            lastEvaUtterance={lastEvaUtterance}
            studentTranscript={studentTranscript}
            isConnected={isConnected}
            connectionState={connectionState}
            endInterview={handleEnd}
            university={university}
          />
        )}

        {status === "ended" && (
          <FinalFeedback
            university={university}
            programName={programName}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
};

export default InterviewSimulator;
