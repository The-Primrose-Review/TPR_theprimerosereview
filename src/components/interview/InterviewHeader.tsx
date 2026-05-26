
import React from "react";
import { GraduationCap } from "lucide-react";

interface InterviewHeaderProps {
  status: "idle" | "preparing" | "active" | "ended";
  university?: string;
}

const InterviewHeader: React.FC<InterviewHeaderProps> = ({ status, university }) => {
  return (
    <h1 className="text-3xl font-bold mb-8 text-slate-800 flex items-center">
      <GraduationCap className="mr-2 h-8 w-8 text-primary" />
      {university ? `${university} Interview Simulator` : "Interview Simulator"}
      {status === "active" && (
        <span className="ml-3 text-sm px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary animate-pulse">
          Live Session
        </span>
      )}
    </h1>
  );
};

export default InterviewHeader;
