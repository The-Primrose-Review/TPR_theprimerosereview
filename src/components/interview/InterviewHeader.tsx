
import React from "react";
import { GraduationCap } from "lucide-react";

interface InterviewHeaderProps {
  status: "idle" | "preparing" | "active" | "ended";
  university?: string;
}

const InterviewHeader: React.FC<InterviewHeaderProps> = ({ status, university }) => {
  return (
    <h1 className="text-3xl font-bold mb-8 text-white flex items-center drop-shadow">
      <GraduationCap className="mr-2 h-8 w-8" />
      {university ? `${university} Interview Simulator` : "Interview Simulator"}
      {status === "active" && (
        <span className="ml-3 text-sm px-3 py-1 rounded-full bg-violet-100 text-violet-700 animate-pulse">
          Live Session
        </span>
      )}
    </h1>
  );
};

export default InterviewHeader;
